# Modulo Inventario

## Objetivo

Operar existencias desde UI usando movimientos auditables, sin editar saldos directamente.

## Alcance Actual

Incluido:

- Vista compacta de stock por producto.
- Estado de producto: en stock, bajo stock o agotado.
- Registrar movimiento desde UI.
- Tipos soportados:
  - Stock inicial
  - Entrada
  - Ajuste positivo
  - Ajuste negativo
  - Merma
- Motivo obligatorio para ajuste negativo y merma.
- Historial reciente de movimientos.
- Refresco de productos, stock e historial despues de registrar movimiento.

No incluido todavia:

- Filtros avanzados de historial.
- Historial por producto desde detalle.
- Permisos por rol.
- Recepcion formal de compras.
- Traspasos entre sucursales.
- Conteo fisico/ciclico.

## Backend

Rutas:

- `GET /api/portal/businesses/:business_id/inventory_movements`
- `POST /api/portal/businesses/:business_id/inventory_movements`

Modelo principal:

- `InventoryMovement`

Saldo:

- `InventoryBalance`

Servicio:

- `Inventory::MovementRecorder`

Reglas:

- Todas las operaciones filtran por `business_id`.
- Inventario solo cambia por movimientos.
- Ajuste negativo y merma requieren motivo.
- Cantidad debe ser mayor a cero.
- El balance se actualiza dentro de transaccion.

## Frontend

Vista:

- `Inventario`

Subvistas:

- `Stock`: lista compacta por producto.
- `Movimiento`: formulario para registrar entrada/ajuste/merma.
- `Historial`: movimientos recientes.

Comportamiento:

- `Registrar movimiento` abre formulario.
- `Mover` en una fila de stock abre formulario con el producto preseleccionado.
- Al guardar, vuelve a `Stock` y muestra mensaje.
- El historial se actualiza despues de guardar.

## Campos del Formulario

- Producto
- Tipo de movimiento
- Cantidad
- Costo unitario
- Motivo

## Criterios de Aceptacion

- Un usuario puede registrar una entrada o ajuste desde UI.
- El stock visible cambia despues del movimiento.
- El historial muestra el movimiento nuevo.
- Ajuste negativo y merma no pasan sin motivo.
- El saldo no se edita directamente.

## Pendientes Recomendados

1. Agregar filtros por producto, fecha y tipo.
2. Crear vista de historial por producto.
3. Agregar permisos para ajustes negativos y merma.
4. Conectar entradas de inventario con compras/proveedores.
