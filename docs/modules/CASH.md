# Modulo Caja

## Objetivo

Operar apertura, movimientos y cierre de caja desde UI, sin depender de llamadas manuales a la API.

## Alcance Actual

Incluido:

- Resumen del turno actual.
- Apertura de caja con fondo inicial.
- Registro de movimientos manuales:
  - Salida de efectivo
  - Abono a credito
- Cierre de caja con efectivo contado y notas.
- Bitacora reciente de movimientos.
- Recalculo de efectivo esperado despues de cada movimiento.

No incluido todavia:

- Reembolso desde UI.
- Ajuste de cierre como flujo independiente.
- Historial de sesiones anteriores.
- Permisos por rol para cierre o salidas.
- Desglose por metodo de pago dentro de la vista de caja.

## Backend

Rutas:

- `GET /api/portal/businesses/:business_id/context`
- `POST /api/portal/businesses/:business_id/cash_register_session`
- `POST /api/portal/businesses/:business_id/cash_register_session/close`
- `GET /api/portal/businesses/:business_id/cash_movements`
- `POST /api/portal/businesses/:business_id/cash_movements`

Servicios:

- `Cash::SessionOpener`
- `Cash::MovementRecorder`
- `Cash::SessionCloser`

Reglas:

- Solo puede existir una sesion abierta por caja.
- El esperado se recalcula con la suma de `cash_movements`.
- `cash_out`, `refund` y `closing_adjustment` requieren motivo.
- No se puede registrar movimiento si la caja esta cerrada.
- No se puede vender sin caja abierta.

## Frontend

Vista:

- `Caja`

Subvistas:

- `Resumen`
- `Abrir`
- `Movimiento`
- `Cerrar`

Comportamiento:

- Si no hay caja abierta, se puede abrir desde UI.
- Si hay caja abierta, se pueden registrar salidas y abonos.
- El cierre captura contado y calcula diferencia contra esperado.
- La bitacora usa los movimientos de la sesion actual cuando existe.

## Campos

### Apertura

- Fondo inicial

### Movimiento

- Tipo
- Importe
- Motivo

### Cierre

- Efectivo contado
- Notas de cierre

## Criterios de Aceptacion

- Un usuario puede abrir caja desde UI.
- Un usuario puede registrar al menos una salida o un abono.
- El esperado visible cambia despues del movimiento.
- Un usuario puede cerrar caja y ver la diferencia.
- Venta sigue bloqueada cuando no existe sesion abierta.

## Pendientes Recomendados

1. Historial de sesiones con filtros por fecha.
2. Reembolsos y ajustes de cierre desde UI.
3. Permisos por rol para movimientos sensibles.
4. Integrar arqueo y reporte imprimible de corte.
