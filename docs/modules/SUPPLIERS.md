# Proveedores

## Objetivo

Registrar y mantener la base minima de proveedores desde UI para preparar compras reales.

## Alcance MVP

- Listado de proveedores.
- Busqueda por nombre, contacto, telefono, email o RFC.
- Alta de proveedor.
- Edicion de datos base.
- Activar e inactivar proveedor.

## Datos capturados

- Nombre comercial.
- Razon social.
- RFC.
- Telefono.
- WhatsApp.
- Email.
- Contacto.
- Direccion.
- Dias de entrega.
- Condiciones de pago.
- Notas.
- Estatus activo/inactivo.

## Backend

- Tabla `suppliers`.
- Modelo `Supplier` por `business_id`.
- Endpoints:
  - `GET /api/portal/businesses/:business_id/suppliers`
  - `GET /api/portal/businesses/:business_id/suppliers/:id`
  - `POST /api/portal/businesses/:business_id/suppliers`
  - `PATCH /api/portal/businesses/:business_id/suppliers/:id`

## Reglas

- `commercial_name` es obligatorio.
- `email` unico por negocio cuando exista.
- `rfc` unico por negocio cuando exista.
- No se borra; se desactiva.

## UI

- Vista dedicada en modulo `Proveedores`.
- Separacion entre listado y formulario.
- Mobile first, con captura compacta y busqueda rapida.

## Criterio de aceptacion

- El usuario puede crear, editar y consultar proveedores desde UI.
- El negocio ya puede empezar a capturar base de abastecimiento real para el modulo de compras.
