# Compras

## Objetivo

Registrar compras recibidas con proveedor, costo y entrada automatica a inventario.

## Alcance MVP

- Historial de compras recibidas.
- Alta de compra con proveedor.
- Captura de una o varias partidas.
- Referencia de factura opcional.
- Notas de compra.
- Entrada automatica a inventario por partida.
- Actualizacion de costo actual del producto.

## Datos capturados

- Proveedor.
- Fecha y hora.
- Referencia de factura.
- Notas.
- Partidas:
  - Producto.
  - Cantidad.
  - Costo unitario.

## Backend

- Tablas `purchases` y `purchase_items`.
- Servicio `Purchases::Recorder`.
- Endpoints:
  - `GET /api/portal/businesses/:business_id/purchases`
  - `GET /api/portal/businesses/:business_id/purchases/:id`
  - `POST /api/portal/businesses/:business_id/purchases`

## Reglas

- La compra se registra como recibida en una sola operacion.
- Cada partida genera `inventory_movement` tipo `purchase_receipt`.
- El costo actual del producto se actualiza con el ultimo costo capturado.
- No hay edicion posterior en MVP inicial.

## UI

- Vista dedicada en modulo `Compras`.
- Separacion entre historial y formulario.
- Captura multiple de partidas.
- Total calculado en pantalla.

## Criterio de aceptacion

- El usuario puede registrar una compra completa desde UI.
- La compra aumenta inventario y actualiza costo sin tocar consola.
