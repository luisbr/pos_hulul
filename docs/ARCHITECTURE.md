# Hulul POS Ferretero - Arquitectura

## Decision de producto

Hulul inicia como un POS ferretero 100% web en nube. La etapa 1 no requiere modo local ni sincronizacion operativa, pero el diseno tecnico debe dejar preparada la etapa 2 para correr en una computadora local y sincronizar con la nube cuando exista internet.

El documento `Hulul_MD00_Brand_UI_Frontend.docx` se usa como guia visual de marca e interfaz. No define el producto inicial; el producto inicial es el POS ferretero.

## Stack aprobado

- Backend: Ruby on Rails API.
- Base de datos: PostgreSQL.
- Frontend: React + Vite.
- Identidad visual: Hulul, usando grafito, turquesa y fondo claro definidos en el brandbook.
- MVP: multi-tenant desde el dia 1.
- Precios: precio de venta capturado con IVA incluido.
- Importacion inicial: Excel en MVP.
- Sync/local: preparado desde el modelo de datos, implementado en etapa posterior.

## Estructura recomendada

```txt
hulul/
  backend/       Rails API
  frontend/      React + Vite
  docs/          arquitectura, modelo de datos, backlog
```

## Capas del sistema

### Admin Hulul

Usado por el equipo Hulul para administrar clientes, negocios, sucursales, licencias, soporte y estado general.

Responsabilidades:

- Crear y editar negocios.
- Crear sucursales.
- Administrar estado de licencia.
- Entrar al portal de un negocio con permisos controlados.
- Ver estado operativo basico: ultima actividad, usuarios, ventas, eventos pendientes futuros.

### Portal cliente

Usado por duenos, encargados, cajeros y almacenistas.

Responsabilidades:

- Apertura y cierre de caja.
- Venta de mostrador.
- Cobro con efectivo, tarjeta, transferencia y pago mixto.
- Venta a credito.
- Catalogo de productos.
- Inventario por movimientos.
- Compras y recepcion.
- Proveedores.
- Clientes y abonos.
- Reportes basicos.

## Multi-tenant

Todas las tablas operativas deben pertenecer a un negocio mediante `business_id`.

Regla base:

- Ninguna consulta operativa debe leer datos sin filtrar por `business_id`.
- La separacion por negocio se valida en backend, no solo en frontend.
- Los usuarios pueden pertenecer a uno o varios negocios mediante membresias.

## Etapa 1: web cloud

La etapa 1 corre completamente en nube:

- Rails API desplegado en servidor cloud.
- PostgreSQL cloud.
- Frontend React/Vite servido como aplicacion web.
- Login con email y password.
- Sin instalable local.
- Sin venta offline.
- Sin sync local activo.

## Etapa 2: local + sync

La etapa 2 permitira operar en una computadora local cuando el negocio no tenga internet.

Decisiones que deben quedar preparadas desde etapa 1:

- IDs UUID en entidades principales.
- `sync_events` para registrar operaciones importantes.
- `idempotency_key` en operaciones criticas.
- Timestamps consistentes.
- Folios no dependientes de IDs autoincrementales.
- Operaciones de venta/caja/inventario modeladas como movimientos auditables.

La etapa 2 puede resolverse con:

- Rails API local.
- PostgreSQL local.
- Frontend servido en LAN.
- Servicio local para impresoras.
- Proceso de sincronizacion con nube.

## Autenticacion

Etapa 1:

- Email + password.
- Sesiones/JWT segun implementacion Rails elegida.
- Roles y permisos validados en backend.

Etapa posterior:

- PIN de cajero para operacion rapida en caja.

## Licencias

Estados iniciales:

- `trial`
- `active`
- `suspended`
- `cancelled`

Reglas:

- Suspender no borra informacion.
- Un negocio suspendido no debe operar ventas nuevas.
- Admin Hulul conserva acceso de soporte.

## Folios

Los folios deben ser legibles por negocio/sucursal/caja y no depender del ID interno.

Formato propuesto:

```txt
SUC-CAJA-000001
```

Ejemplo:

```txt
TOL-001-000001
```

## IVA y precios

El precio de venta capturado en producto incluye IVA.

Reglas:

- El POS muestra precios finales.
- Internamente se puede desglosar base e IVA.
- El ticket muestra subtotal, IVA y total cuando aplique.
- La tasa por defecto sera 16%, con soporte para 0% y exento.

## Impresion

Etapa 1:

- Ticket web imprimible desde navegador.

Etapa posterior:

- Impresion local directa mediante servicio local, impresora USB/red, CUPS o ESC/POS.

## Principios de implementacion

- Las ventas no se borran; se cancelan con movimiento contrario.
- El inventario no se edita directo; cambia por movimientos.
- Caja se controla por sesiones de apertura/cierre.
- Credito usa movimientos, no solo un saldo plano.
- Permisos se validan en backend.
- La UI debe ser densa pero clara, siguiendo el brandbook Hulul.
