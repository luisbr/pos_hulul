# Modulo Cancelacion y Devolucion

## Objetivo

Cancelar ventas sin borrar historial, revirtiendo inventario y registrando devolucion de efectivo cuando corresponda.

## Alcance Actual

Incluido:

- Cancelacion de venta desde detalle.
- Motivo obligatorio.
- Bloqueo de doble cancelacion.
- Reversion de inventario con `sale_cancellation`.
- Devolucion en caja con `refund` cuando la venta tuvo pago en efectivo.
- Requiere caja abierta para devolver efectivo.
- Historial y detalle muestran estado y motivo de cancelacion.

No incluido todavia:

- Cancelacion parcial por linea.
- Devolucion sin cancelar toda la venta.
- Reimpresion de comprobante de devolucion.
- Permisos por rol.

## Backend

Rutas:

- `POST /api/portal/businesses/:business_id/sales/:id/cancel`

Servicio:

- `Sales::Canceller`

Campos en `sales`:

- `cancelled_at`
- `cancelled_by_id`
- `cancellation_reason`

Reglas:

- Una venta cancelada no puede cancelarse otra vez.
- Si hubo efectivo, la cancelacion registra `refund` en una sesion abierta.
- Toda cancelacion revierte inventario con movimientos auditables.

## Frontend

Vista:

- `Venta > Historial > Detalle`

Comportamiento:

- Si la venta sigue `paid`, muestra formulario de cancelacion.
- Si ya esta `cancelled`, muestra fecha, usuario y motivo.

## Criterios de Aceptacion

- Se puede cancelar una venta pagada.
- El stock vuelve a subir.
- La caja refleja salida si hubo efectivo.
- La venta queda en estado `cancelled`.
- No se puede cancelar dos veces.

## Pendientes Recomendados

1. Devolucion parcial.
2. Permisos por rol.
3. Comprobante de devolucion.
4. Filtros por estado en historial.
