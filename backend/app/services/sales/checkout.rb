module Sales
  class Checkout
    def self.call(...)
      new(...).call
    end

    def initialize(business:, branch:, cash_register:, cash_register_session:, cashier:, customer: nil, items:, payments:, idempotency_key:)
      @business = business
      @branch = branch
      @cash_register = cash_register
      @session = cash_register_session
      @cashier = cashier
      @customer = customer
      @items = items
      @payments = payments
      @idempotency_key = idempotency_key
    end

    def call
      existing_sale = @business.sales.find_by(idempotency_key: @idempotency_key)
      return existing_sale if existing_sale

      raise ArgumentError, "La caja debe estar abierta" unless @session&.open?
      raise ArgumentError, "La caja no pertenece a la sesion abierta" unless @session.cash_register == @cash_register
      raise ArgumentError, "Agrega al menos un producto" if @items.blank?
      raise ArgumentError, "Agrega al menos un pago" if @payments.blank?

      ActiveRecord::Base.transaction do
        @cash_register.lock!
        normalized_items = build_items
        validate_stock!(normalized_items)
        normalized_payments = build_payments(normalized_items.sum { |item| item[:total_cents] })
        folio = next_folio

        sale = Sale.create!(
          business: @business,
          branch: @branch,
          cash_register: @cash_register,
          cash_register_session: @session,
          customer: @customer,
          cashier: @cashier,
          folio: folio,
          status: "paid",
          subtotal_cents: normalized_items.sum { |item| item[:subtotal_cents] },
          tax_cents: normalized_items.sum { |item| item[:tax_cents] },
          discount_cents: normalized_items.sum { |item| item[:discount_cents] },
          total_cents: normalized_items.sum { |item| item[:total_cents] },
          sale_type: sale_type(normalized_payments),
          idempotency_key: @idempotency_key
        )

        normalized_items.each do |item|
          SaleItem.create!(
            business: @business,
            sale: sale,
            product: item[:product],
            sku: item[:product].sku,
            product_name: item[:product].name,
            quantity: item[:quantity],
            unit: item[:product].base_unit,
            unit_price_cents: item[:unit_price_cents],
            discount_cents: item[:discount_cents],
            tax_cents: item[:tax_cents],
            total_cents: item[:total_cents]
          )

          Inventory::MovementRecorder.call(
            business: @business,
            branch: @branch,
            product: item[:product],
            movement_type: "sale",
            quantity: item[:quantity],
            unit: item[:product].base_unit,
            reference_type: "Sale",
            reference_id: sale.id,
            reason: "Venta #{folio}",
            created_by: @cashier
          )
        end

        normalized_payments.each do |payment_attrs|
          Payment.create!(
            business: @business,
            sale: sale,
            cash_register_session: @session,
            payment_method: payment_attrs[:payment_method],
            amount_cents: payment_attrs[:amount_cents],
            received_amount_cents: payment_attrs[:received_amount_cents],
            change_amount_cents: payment_attrs[:change_amount_cents],
            reference: payment_attrs[:reference],
            created_by: @cashier
          )

          next unless payment_attrs[:payment_method] == "cash"

          Cash::MovementRecorder.call(
            cash_register_session: @session,
            movement_type: "sale_cash_payment",
            amount_cents: payment_attrs[:amount_cents],
            reference_type: "Sale",
            reference_id: sale.id,
            reason: "Venta #{folio}",
            created_by: @cashier
          )
        end

        @cash_register.increment!(:current_folio_number)
        sale
      end
    end

    private

    def build_items
      @items.map do |item|
        product = @business.products.active.find(item.fetch(:product_id))
        quantity = BigDecimal(item.fetch(:quantity).to_s)
        raise ArgumentError, "La cantidad debe ser mayor a cero" unless quantity.positive?

        total_cents = (product.sale_price_cents * quantity).round
        tax_cents = tax_for(product, total_cents)

        {
          product: product,
          quantity: quantity,
          unit_price_cents: product.sale_price_cents,
          subtotal_cents: total_cents - tax_cents,
          discount_cents: 0,
          tax_cents: tax_cents,
          total_cents: total_cents
        }
      end
    end

    def build_payments(total_cents)
      normalized = @payments.map do |payment|
        method = payment.fetch(:payment_method)
        amount_cents = payment.fetch(:amount_cents).to_i
        received_amount_cents = payment[:received_amount_cents].presence&.to_i || amount_cents
        change_amount_cents = method == "cash" ? received_amount_cents - amount_cents : 0

        raise ArgumentError, "Metodo de pago invalido" unless Payment::PAYMENT_METHODS.include?(method)
        raise ArgumentError, "El pago debe ser mayor a cero" unless amount_cents.positive?
        raise ArgumentError, "El efectivo recibido no cubre el pago" if method == "cash" && change_amount_cents.negative?

        {
          payment_method: method,
          amount_cents: amount_cents,
          received_amount_cents: received_amount_cents,
          change_amount_cents: change_amount_cents,
          reference: payment[:reference]
        }
      end

      paid_cents = normalized.sum { |payment| payment[:amount_cents] }
      raise ArgumentError, "El pago no cubre el total" unless paid_cents >= total_cents

      normalized
    end

    def validate_stock!(items)
      items.group_by { |item| item[:product] }.each do |product, product_items|
        requested_quantity = product_items.sum { |item| item[:quantity] }
        balance = InventoryBalance.lock.find_by(
          business: @business,
          branch: @branch,
          product: product
        )
        available_quantity = balance&.quantity || 0

        next if available_quantity >= requested_quantity

        raise ArgumentError, "Stock insuficiente para #{product.sku}. Disponible: #{available_quantity.to_s("F")}"
      end
    end

    def tax_for(product, total_cents)
      return 0 unless product.tax_mode == "included"

      rate = BigDecimal(product.tax_rate.to_s)
      (BigDecimal(total_cents.to_s) - (BigDecimal(total_cents.to_s) / (1 + (rate / 100)))).round
    end

    def next_folio
      "#{@branch.code}-#{@cash_register.code}-#{@cash_register.current_folio_number.to_s.rjust(6, "0")}"
    end

    def sale_type(payments)
      methods = payments.map { |payment| payment[:payment_method] }.uniq
      methods.one? ? methods.first : "mixed"
    end
  end
end
