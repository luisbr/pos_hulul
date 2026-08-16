# Modulo Importacion Excel

## Objetivo

Cargar productos en lote para acelerar el arranque operativo de una ferreteria.

## Alcance Actual

Incluido:

- Descarga de plantilla base.
- Upload de archivo `.xlsx` o `.csv`.
- Preview antes de importar.
- Validacion de columnas requeridas.
- Validacion de SKU y codigo de barras duplicados.
- Alta masiva de productos.
- Creacion automatica de categorias, marcas y unidades faltantes.
- Registro de stock inicial como `initial_stock`.

No incluido todavia:

- Correccion fila por fila desde UI.
- Actualizacion masiva de productos existentes.
- Soporte de imagenes.
- Conversiones de unidad desde importacion.

## Backend

Rutas:

- `GET /api/portal/businesses/:business_id/products/import_template`
- `POST /api/portal/businesses/:business_id/products/import_preview`
- `POST /api/portal/businesses/:business_id/products/import_commit`

Servicio:

- `Products::Importer`

## Frontend

Vista:

- `Productos > Importar`

Flujo:

1. Descargar plantilla.
2. Seleccionar archivo.
3. Generar preview.
4. Corregir errores si existen.
5. Confirmar importacion.

## Columnas base

- `sku`
- `codigo_barras`
- `nombre`
- `categoria`
- `marca`
- `unidad`
- `precio_venta`
- `costo`
- `stock_inicial`
- `stock_minimo`
- `iva`
- `pasillo`
- `anaquel`
- `gaveta`

## Criterios de Aceptacion

- Un usuario puede importar productos en lote sin seeds.
- El sistema crea catalogos faltantes.
- El stock inicial queda reflejado en inventario.
- Si hay errores, la importacion no confirma.

## Pendientes Recomendados

1. Modo actualizar existentes.
2. Preview mas rica con resumen por error.
3. Soporte de conversiones de unidad.
