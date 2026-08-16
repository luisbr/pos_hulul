# Clientes

## Objetivo

Dar de alta y mantener la base minima de clientes desde UI sin depender de consola ni seeds.

## Alcance MVP

- Listado de clientes.
- Busqueda por nombre, contacto, telefono, email o RFC.
- Alta de cliente persona o empresa.
- Edicion de datos base.
- Activar e inactivar cliente.

## Datos capturados

- Tipo: persona o empresa.
- Nombre comercial.
- Contacto.
- RFC.
- Telefono.
- WhatsApp.
- Email.
- Razon social.
- Direccion.
- Notas.
- Estatus activo/inactivo.

## Backend

- Tabla `customers`.
- Modelo `Customer` por `business_id`.
- Endpoints:
  - `GET /api/portal/businesses/:business_id/customers`
  - `GET /api/portal/businesses/:business_id/customers/:id`
  - `POST /api/portal/businesses/:business_id/customers`
  - `PATCH /api/portal/businesses/:business_id/customers/:id`

## Reglas

- `commercial_name` es obligatorio.
- `email` unico por negocio cuando exista.
- `rfc` unico por negocio cuando exista.
- No se borra; se desactiva.

## UI

- Vista dedicada en modulo `Clientes`.
- Separacion clara entre listado y formulario.
- Mobile first, con lista compacta y formulario simple.

## Criterio de aceptacion

- El usuario puede crear, editar y consultar clientes desde UI.
- El negocio ya puede empezar a capturar base comercial real para ventas futuras y credito.
