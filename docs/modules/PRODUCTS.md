# Modulo Productos

## Objetivo

Administrar el catalogo basico de productos del negocio para que el POS no dependa de seeds ni cambios manuales.

## Alcance Actual

Incluido:

- Listar productos activos e inactivos.
- Buscar por nombre, SKU o codigo de barras.
- Crear producto.
- Editar producto.
- Activar/desactivar producto.
- Usar categorias, marcas y unidades existentes.
- Validar SKU unico por negocio.
- Validar codigo de barras unico por negocio cuando exista.
- Mantener precio de venta con IVA incluido.

No incluido todavia:

- Crear categorias desde esta pantalla.
- Crear marcas desde esta pantalla.
- Crear unidades desde esta pantalla.
- Stock inicial desde alta de producto.
- Imagen de producto.
- Proveedor principal.
- Importacion Excel.

## Backend

Rutas:

- `GET /api/portal/businesses/:business_id/products`
- `GET /api/portal/businesses/:business_id/products/:id`
- `POST /api/portal/businesses/:business_id/products`
- `PATCH /api/portal/businesses/:business_id/products/:id`
- `GET /api/portal/businesses/:business_id/catalogs`

Modelo principal:

- `Product`

Catalogos usados:

- `ProductCategory`
- `Brand`
- `Unit`

Reglas:

- Todas las operaciones filtran por `business_id`.
- `sku` es unico por negocio.
- `barcode` es unico por negocio si existe.
- Desactivar usa `active=false`; no se borra producto.
- Inventario no se edita aqui; se modifica por movimientos de inventario.

## Frontend

Vista:

- `Productos`

Comportamiento:

- La vista inicia en modo listado.
- La lista muestra tarjetas con producto, SKU, unidad, precio, stock y estado activo/inactivo.
- `Nuevo` abre una pantalla/formulario separado.
- `Editar` abre la misma pantalla/formulario con datos cargados.
- `Volver` regresa al listado.
- `Desactivar/Activar` cambia el estado del producto.

Decision UX:

- Listado y alta/edicion no deben mostrarse juntos.
- En celular debe haber una sola tarea visible: revisar lista o capturar formulario.
- Las acciones principales deben quedar como botones tactiles grandes.

## Campos del Formulario

- Nombre
- SKU
- Codigo de barras
- Categoria
- Marca
- Unidad
- Precio venta
- Costo
- IVA
- Tasa
- Stock minimo
- Pasillo
- Anaquel
- Gaveta
- Venta fraccionada
- Activo

## Criterios de Aceptacion

- Un usuario puede dar de alta un producto nuevo desde UI.
- Un producto nuevo aparece en la lista de Productos.
- Un producto activo aparece en busqueda del POS.
- Un producto inactivo no debe venderse desde POS.
- Un producto puede editar precio, costo, ubicacion y stock minimo.
- Un producto puede desactivarse sin borrar historial.

## Pendientes Recomendados

1. Agregar stock inicial opcional mediante `InventoryMovement`.
2. Crear categorias/marcas/unidades inline.
3. Separar formulario a componente cuando la UI crezca.
4. Agregar permisos backend para alta/edicion/desactivacion.
