# Modulo Bitacora / Auditoria

## Objetivo

Registrar acciones administrativas y sensibles para saber quien hizo cada cambio, cuando ocurrio y sobre que entidad.

## Alcance Actual

Incluido:

- Tabla `audit_events`.
- Endpoint `GET /api/portal/businesses/:business_id/audit_events`.
- Vista `Bitacora` en portal para usuarios con permiso.
- Actor autenticado, tipo de evento, entidad afectada, metadata, IP y user agent.
- Eventos iniciales:
  - Cambio de estado de empresa desde Admin Hulul.
  - Edicion de configuracion de empresa.
  - Alta y edicion de usuarios/membresias.
  - Alta y edicion de productos.
  - Importacion de productos.
  - Alta y edicion de catalogos.
  - Alta y edicion de clientes.
  - Alta y edicion de proveedores.
  - Cancelacion de venta.
  - Anulacion de compra.
  - Cierre forzado de caja.

## Reglas

- Cada evento pertenece a una empresa por `business_id`.
- El actor se toma del token autenticado, no del navegador.
- La bitacora se consulta por empresa activa y respeta membresia/permisos.
- Cajeros no ven la bitacora.

## Pendiente

- Filtros avanzados por fecha, actor, tipo y entidad.
- Detalle visual completo del cambio anterior/nuevo por campo.
- Exportar bitacora a CSV/Excel.
- Conectar con `sync_events` cuando exista modo local.
