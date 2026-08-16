# Modulo Catalogos Base

## Objetivo

Administrar categorias, marcas y unidades desde UI para no depender de seeds o consola.

## Alcance Actual

Incluido:

- Vista `Catalogos` dentro de `Productos`.
- ABC minimo para:
  - Categorias
  - Marcas
  - Unidades
- Alta y edicion.
- Activar / desactivar.
- Abreviatura para unidades.
- Refresco inmediato de selects usados por productos.

No incluido todavia:

- Conversiones de unidad.
- Jerarquia visual de categorias padre/hijo.
- Reglas para impedir desactivar catalogos ya muy usados.

## Backend

Rutas:

- `GET /api/portal/businesses/:business_id/catalogs`
- `POST /api/portal/businesses/:business_id/catalogs/categories`
- `PATCH /api/portal/businesses/:business_id/catalogs/categories/:id`
- `POST /api/portal/businesses/:business_id/catalogs/brands`
- `PATCH /api/portal/businesses/:business_id/catalogs/brands/:id`
- `POST /api/portal/businesses/:business_id/catalogs/units`
- `PATCH /api/portal/businesses/:business_id/catalogs/units/:id`

## Frontend

Vista:

- `Productos > Catalogos`

Comportamiento:

- Se cambia entre categorias, marcas y unidades con tabs.
- El formulario sirve para alta o edicion.
- Al guardar, el listado y los selects de producto se actualizan.

## Criterios de Aceptacion

- Se puede crear una categoria desde UI.
- Se puede crear una marca desde UI.
- Se puede crear una unidad desde UI.
- Un producto nuevo puede usar esos catalogos sin tocar seeds.

## Pendientes Recomendados

1. Conversiones de unidad.
2. Categorias anidadas visibles.
3. Filtros por activos/inactivos.
