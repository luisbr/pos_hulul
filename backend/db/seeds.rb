business = Business.find_or_create_by!(commercial_name: "Nombre de empresa") do |record|
  record.legal_name = "Razon social sin configurar"
  record.rfc = "RFC sin configurar"
  record.primary_contact_name = "Luis Buendia"
  record.phone = "555-010-1840"
  record.whatsapp = "555-010-1840"
  record.email = "luis.buendia@hulul.com.mx"
  record.status = "active"
  record.license_status = "trial"
  record.trial_ends_at = 30.days.from_now
  record.license_expires_at = 1.year.from_now
end

branch = Branch.find_or_create_by!(business:, code: "TOL") do |record|
  record.name = "Nombre de sucursal"
  record.address = "Av. Ferreteros 120, Centro"
  record.timezone = "America/Mexico_City"
  record.currency = "MXN"
  record.active = true
end

cash_register = CashRegister.find_or_create_by!(business:, branch:, code: "001") do |record|
  record.name = "Caja 1"
  record.active = true
  record.current_folio_number = 1
  record.printer_name = "Ticket mostrador"
  record.ticket_size = "80mm"
end

cash_register.update!(
  name: "Caja 1",
  active: true,
  current_folio_number: cash_register.current_folio_number.presence || 1,
  printer_name: "Ticket mostrador",
  ticket_size: "80mm"
)

user = User.find_or_initialize_by(email: "luis.buendia@hulul.com.mx")
user.name = "Luis Buendia"
user.password = "Abc123456"
user.active = true
user.save!

membership = Membership.find_or_initialize_by(business:, user:, role: "owner")
membership.active = true
membership.save!

public_customer = Customer.find_or_initialize_by(business:, commercial_name: "Publico en general")
public_customer.assign_attributes(
  customer_type: "person",
  contact_name: "Mostrador",
  active: true,
  notes: "Cliente base para ventas sin identificacion",
  public_customer: true
)
public_customer.save!
