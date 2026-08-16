# Modulo Historial de Ventas

## Objetivo

Consultar ventas recientes desde UI con busqueda simple y detalle completo.

## Alcance Actual

Incluido:

- Vista `Historial` dentro de `Venta`.
- Busqueda por folio, SKU, producto o cajero.
- Listado reciente de ventas.
- Apertura de detalle por venta.
- Visualizacion de partidas y pagos.

No incluido todavia:

- Filtros por fecha.
- Filtros por metodo de pago.
- Exportacion.
- Cancelacion desde detalle.

## Backend

Rutas:

- `GET /api/portal/businesses/:business_id/sales`
- `GET /api/portal/businesses/:business_id/sales/:id`

## Frontend

Vista:

- `Venta`

Subvistas:

- `POS`
- `Historial`
- `Detalle`

## Criterios de Aceptacion

- Se pueden listar ventas recientes.
- Se puede buscar una venta por folio o contenido basico.
- Se puede abrir el detalle y revisar partidas y pagos.

## Pendientes Recomendados

1. Filtros por fecha y metodo.
2. Atajo a cancelacion/devolucion.
3. Impresion desde detalle.
