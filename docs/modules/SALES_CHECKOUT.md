# Modulo Cobro y Ticket

## Objetivo

Completar el checkout del POS desde UI con captura de pago y cierre visual del ticket.

## Alcance Actual

Incluido:

- Paso de carrito a pantalla de cobro.
- Metodos:
  - Efectivo
  - Tarjeta
  - Transferencia
  - Mixto
- Captura de recibido para efectivo.
- Calculo de cambio.
- Confirmacion de venta contra API.
- Ticket final con folio, partidas y pagos.
- Preparacion para impresion web.

No incluido todavia:

- Impresion fisica ESC/POS.
- Descuentos por linea o globales.
- Cliente credito con seleccion formal.
- Reintento visual de pagos rechazados por pasarela externa.

## Backend

Ruta:

- `POST /api/portal/businesses/:business_id/sales`

Reglas:

- Requiere caja abierta.
- Requiere al menos un item y un pago.
- Valida cobertura total del pago.
- Efectivo valida recibido y calcula cambio.
- Solo pagos en efectivo afectan caja.

## Frontend

Vista:

- `Venta`

Estados:

- `cart`
- `payment`
- `success`

## Criterios de Aceptacion

- Se puede pasar de carrito a cobro.
- Se puede cobrar en efectivo, tarjeta, transferencia o mixto.
- La venta genera folio y limpia carrito.
- El ticket final muestra pagos y partidas.
- El stock baja despues de cobrar.

## Pendientes Recomendados

1. Impresion real del ticket.
2. Descuentos.
3. Cliente/credito formal.
4. Venta suspendida / cotizacion recuperable.
