# Hulul POS Ferretero - Modelo de Datos Inicial

## Convenciones

- PostgreSQL.
- UUID como primary key en tablas principales.
- `created_at` y `updated_at` en todas las tablas.
- `business_id` obligatorio en tablas operativas.
- Soft delete o estado activo/inactivo donde haya historial.
- Cantidades monetarias en centavos o `decimal(12,2)` segun criterio Rails elegido.
- Cantidades de inventario en `decimal(14,4)` para soportar venta fraccionada.

## Tenancy y administracion

### businesses

Representa cada negocio cliente de Hulul.

Campos:

- `id`
- `commercial_name`
- `legal_name`
- `rfc`
- `primary_contact_name`
- `phone`
- `whatsapp`
- `email`
- `status`
- `license_status`
- `trial_ends_at`
- `license_expires_at`
- `created_at`
- `updated_at`

### branches

Sucursal de un negocio.

Campos:

- `id`
- `business_id`
- `name`
- `code`
- `address`
- `timezone`
- `currency`
- `active`

### users

Usuario global de la plataforma.

Campos:

- `id`
- `name`
- `email`
- `password_digest`
- `active`

### memberships

Relaciona usuarios con negocios y roles.

Campos:

- `id`
- `business_id`
- `user_id`
- `role`
- `active`

Roles iniciales:

- `owner`
- `manager`
- `cashier`
- `warehouse`
- `hulul_admin`
- `hulul_support`

## Catalogos y productos

### product_categories

- `id`
- `business_id`
- `parent_id`
- `name`
- `active`

### brands

- `id`
- `business_id`
- `name`
- `active`

### units

- `id`
- `business_id`
- `name`
- `abbreviation`
- `active`

### unit_conversions

- `id`
- `business_id`
- `from_unit_id`
- `to_unit_id`
- `factor`

### suppliers

- `id`
- `business_id`
- `commercial_name`
- `legal_name`
- `rfc`
- `phone`
- `whatsapp`
- `email`
- `contact_name`
- `address`
- `delivery_days`
- `payment_terms`
- `active`
- `notes`

### products

- `id`
- `business_id`
- `category_id`
- `brand_id`
- `main_supplier_id`
- `name`
- `short_description`
- `sku`
- `barcode`
- `base_unit_id`
- `allows_fractional_sale`
- `sale_price_cents`
- `current_cost_cents`
- `tax_mode`
- `tax_rate`
- `minimum_stock`
- `aisle_location`
- `shelf_location`
- `bin_location`
- `supplier_code`
- `search_aliases`
- `photo_url`
- `active`

Reglas:

- `sku` unico por `business_id`.
- `barcode` unico por `business_id`, salvo regla explicita futura.
- Precio de venta incluye IVA.
- Stock no vive como edicion manual; se calcula o actualiza desde movimientos.

## Inventario

### inventory_balances

Saldo actual por producto/sucursal.

- `id`
- `business_id`
- `branch_id`
- `product_id`
- `quantity`
- `updated_at`

### inventory_movements

Historial auditable de entradas, salidas y ajustes.

- `id`
- `business_id`
- `branch_id`
- `product_id`
- `movement_type`
- `quantity`
- `unit_id`
- `base_quantity`
- `unit_cost_cents`
- `supplier_id`
- `reference_type`
- `reference_id`
- `reason`
- `created_by_id`
- `created_at`

Tipos:

- `sale`
- `purchase_receipt`
- `positive_adjustment`
- `negative_adjustment`
- `waste`
- `sale_cancellation`

## Caja y ventas

### cash_registers

- `id`
- `business_id`
- `branch_id`
- `name`
- `code`
- `active`
- `current_folio_number`
- `printer_name`
- `ticket_size`

### cash_register_sessions

- `id`
- `business_id`
- `branch_id`
- `cash_register_id`
- `opened_by_id`
- `closed_by_id`
- `opened_at`
- `closed_at`
- `opening_amount_cents`
- `expected_cash_cents`
- `counted_cash_cents`
- `difference_cents`
- `status`
- `closing_notes`

### sales

- `id`
- `business_id`
- `branch_id`
- `cash_register_id`
- `cash_register_session_id`
- `customer_id`
- `cashier_id`
- `folio`
- `status`
- `subtotal_cents`
- `tax_cents`
- `discount_cents`
- `total_cents`
- `sale_type`
- `cancelled_at`
- `cancelled_by_id`
- `cancellation_reason`
- `idempotency_key`
- `created_at`

Estados:

- `draft`
- `paid`
- `credit`
- `cancelled`

### sale_items

- `id`
- `business_id`
- `sale_id`
- `product_id`
- `sku`
- `product_name`
- `quantity`
- `unit_id`
- `unit_price_cents`
- `discount_cents`
- `tax_cents`
- `total_cents`

### payments

- `id`
- `business_id`
- `sale_id`
- `cash_register_session_id`
- `payment_method`
- `amount_cents`
- `received_amount_cents`
- `change_amount_cents`
- `reference`
- `created_by_id`
- `created_at`

Metodos:

- `cash`
- `card`
- `transfer`
- `credit`

### cash_movements

- `id`
- `business_id`
- `branch_id`
- `cash_register_session_id`
- `movement_type`
- `amount_cents`
- `reference_type`
- `reference_id`
- `reason`
- `created_by_id`
- `created_at`

Tipos:

- `opening`
- `sale_cash_payment`
- `credit_payment`
- `cash_out`
- `refund`
- `closing_adjustment`

## Clientes y credito

### customers

- `id`
- `business_id`
- `customer_type`
- `commercial_name`
- `legal_name`
- `rfc`
- `phone`
- `whatsapp`
- `email`
- `address`
- `contact_name`
- `credit_limit_cents`
- `credit_days`
- `credit_status`
- `active`
- `notes`

### credit_movements

- `id`
- `business_id`
- `customer_id`
- `movement_type`
- `amount_cents`
- `reference_type`
- `reference_id`
- `due_date`
- `created_by_id`
- `created_at`

Tipos:

- `sale_credit`
- `payment`
- `adjustment`
- `cancellation`

## Compras

### purchase_orders

- `id`
- `business_id`
- `branch_id`
- `supplier_id`
- `folio`
- `status`
- `ordered_at`
- `expected_delivery_at`
- `created_by_id`
- `notes`
- `estimated_total_cents`

Estados:

- `draft`
- `requested`
- `partially_received`
- `received`
- `cancelled`

### purchase_order_items

- `id`
- `business_id`
- `purchase_order_id`
- `product_id`
- `supplier_code`
- `quantity_requested`
- `quantity_received`
- `unit_id`
- `estimated_unit_cost_cents`
- `final_unit_cost_cents`

### purchase_receipts

- `id`
- `business_id`
- `purchase_order_id`
- `branch_id`
- `supplier_id`
- `received_by_id`
- `received_at`
- `invoice_reference`
- `notes`

## Cotizaciones

### quotes

- `id`
- `business_id`
- `branch_id`
- `customer_id`
- `folio`
- `status`
- `valid_until`
- `subtotal_cents`
- `tax_cents`
- `discount_cents`
- `total_cents`
- `created_by_id`

### quote_items

- `id`
- `business_id`
- `quote_id`
- `product_id`
- `quantity`
- `unit_id`
- `unit_price_cents`
- `discount_cents`
- `tax_cents`
- `total_cents`

## Importacion Excel

### import_batches

- `id`
- `business_id`
- `branch_id`
- `import_type`
- `filename`
- `status`
- `total_rows`
- `valid_rows`
- `invalid_rows`
- `created_by_id`
- `created_at`

### import_errors

- `id`
- `business_id`
- `import_batch_id`
- `row_number`
- `field`
- `message`
- `raw_value`

## Sync futuro

### sync_events

Se crea desde etapa 1 aunque el sync local se implemente despues.

- `id`
- `business_id`
- `branch_id`
- `source_type`
- `source_id`
- `event_type`
- `entity_type`
- `entity_id`
- `idempotency_key`
- `payload`
- `status`
- `retry_count`
- `last_error`
- `created_at`
- `sent_at`
- `confirmed_at`

Estados:

- `pending`
- `processing`
- `synced`
- `failed`
- `conflict`

Eventos iniciales:

- `SALE_CREATED`
- `SALE_CANCELLED`
- `PAYMENT_CREATED`
- `CASH_REGISTER_OPENED`
- `CASH_REGISTER_CLOSED`
- `CASH_MOVEMENT_CREATED`
- `INVENTORY_MOVEMENT_CREATED`
- `CUSTOMER_CREATED`
- `CUSTOMER_UPDATED`
- `CREDIT_MOVEMENT_CREATED`
- `QUOTE_CREATED`
- `QUOTE_CONVERTED_TO_SALE`
- `PRODUCT_CREATED`
- `PRODUCT_UPDATED`
- `PURCHASE_ORDER_CREATED`
- `PURCHASE_RECEIVED`
- `SUPPLIER_CREATED`
- `SUPPLIER_UPDATED`
- `USER_CREATED`
- `USER_UPDATED`
