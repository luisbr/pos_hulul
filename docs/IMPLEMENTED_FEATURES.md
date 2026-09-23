# Funcionalidades Implementadas

Resumen operativo de lo que ya existe en el MVP de ventas Hulul.

## Plataforma base

- Backend Rails API.
- Frontend React/Vite.
- Modelo multi-negocio con `business_id` en tablas operativas.
- Negocios, sucursales, usuarios y membresias.
- Modulo de usuarios por negocio con roles y estado de membresia.
- Sesion autenticada con token bearer para portal y Admin Hulul.
- Contexto operativo del portal por negocio.
- Configuracion inicial minima para habilitar operacion.
- Selector de empresa activa para usuarios con varias empresas.
- Bloqueo operativo cuando la empresa esta suspendida o cancelada.

## Catalogos

- Categorias de producto.
- Marcas.
- Unidades.
- Catalogos filtrados por negocio.
- Edicion basica de catalogos desde UI.

## Productos

- Alta y edicion de productos.
- SKU unico por negocio.
- Codigo de barras opcional.
- Unidad base.
- Precio de venta con IVA incluido.
- Costo actual.
- Estado activo/inactivo.
- Ubicacion fisica: pasillo, anaquel y contenedor.
- Stock minimo.
- Venta fraccionada.
- Importacion masiva con plantilla, preview y commit.

## Inventario

- Existencias por producto y sucursal.
- Movimientos auditables de inventario.
- Stock inicial.
- Entradas por compra.
- Ajustes positivos y negativos.
- Merma.
- Salidas por venta.
- Reversion por cancelacion de venta.
- Validacion de stock antes de vender.

## Caja

- Apertura de caja con fondo inicial.
- Una sola sesion activa por caja.
- Registro de movimientos manuales:
  - Salida de efectivo.
  - Abono a credito.
- Recalculo de efectivo esperado por movimientos.
- Cierre normal con efectivo contado, diferencia y notas.
- Bitacora de movimientos de caja.
- Bloqueo de venta si no hay caja abierta.
- Deteccion de caja vencida al cruzar el dia operativo configurado.
- Estado `pending_close` para turnos vencidos.
- Bloqueo de ventas nuevas cuando la caja esta pendiente de cierre.
- Cierre forzado autorizado con motivo.
- Registro de cierre forzado en bitacora con movimiento `forced_closure`.

## Ventas POS

- Busqueda de productos por SKU, codigo o nombre.
- Carrito de venta.
- Validacion de stock disponible.
- Cobro en efectivo.
- Cobro con tarjeta.
- Cobro por transferencia.
- Pago mixto.
- Calculo de cambio.
- Generacion de folio por sucursal y caja.
- Creacion de venta pagada.
- Descuento automatico de inventario.
- Movimiento automatico de caja para pagos en efectivo.
- Idempotencia en checkout para evitar venta duplicada por reintento.
- Ticket final e impresion.

## Historial y cancelaciones

- Listado de ventas recientes.
- Busqueda por folio, cajero, producto o SKU.
- Detalle de venta.
- Cancelacion de venta pagada con motivo.
- Bloqueo de doble cancelacion.
- Reversion de inventario al cancelar.
- Reembolso en caja cuando aplica.
- Registro de usuario y motivo de cancelacion.

## Clientes

- Alta y edicion de clientes.
- Cliente persona o empresa.
- Cliente publico general.
- Datos fiscales y de contacto.
- Estado activo/inactivo.

## Proveedores

- Alta y edicion de proveedores.
- Datos fiscales y de contacto.
- Condiciones de pago.
- Dias de entrega.
- Estado activo/inactivo.

## Compras

- Registro de compras recibidas.
- Partidas por producto.
- Costo unitario.
- Total de compra.
- Entrada automatica a inventario.
- Historial y detalle de compras.
- Anulacion de compra con motivo.
- Reversion de inventario al anular.

## Configuracion y arranque

- Checklist de datos minimos para operar.
- Bloqueo de ventas hasta completar requisitos.
- Pantalla de desbloqueo priorizando el pendiente actual.
- Progreso visual de configuracion.
- Separacion entre pendientes bloqueantes y pasos completados.
- Caso especial para caja vencida: explica que hay un turno anterior abierto y envia directo a cierre.

## Usuarios y trazabilidad

- Listado de usuarios por negocio.
- Alta de usuarios operativos.
- Edicion de rol y estado.
- Permisos base por rol validados en backend.
- Botones de acciones sensibles bloqueados en UI segun rol activo.
- Ventas identifican cajero.
- Cancelaciones identifican usuario y motivo.
- Caja, pagos, compras e inventario conservan referencias de usuario en sus movimientos principales.

## Bitacora y auditoria

- Tabla `audit_events` por empresa.
- Vista `Bitacora` en portal para roles autorizados.
- Registro de actor autenticado, tipo de evento, entidad, metadata, IP y user agent.
- Eventos para cambios de empresa, configuracion, usuarios, productos, catalogos, clientes, proveedores, cancelaciones, anulaciones y cierres forzados.

## Admin Hulul

- Endpoints de empresas protegidos por roles internos.
- Pantalla interna para listar empresas, buscar y ver conteos por estado.
- `hulul_admin` puede activar o suspender empresas desde UI y backend.
- `hulul_support` puede consultar empresas sin cambiar estado.

Pendiente:

- Pagos por empresa con montos y vencimientos distintos.

## Documentacion existente

- Arquitectura general: `docs/ARCHITECTURE.md`.
- Modelo de datos: `docs/DATA_MODEL.md`.
- Caja: `docs/modules/CASH.md`.
- Ventas POS: `docs/modules/SALES_CHECKOUT.md`.
- Historial de ventas: `docs/modules/SALES_HISTORY.md`.
- Cancelacion de ventas: `docs/modules/SALES_CANCELLATION.md`.
- Inventario: `docs/modules/INVENTORY.md`.
- Productos: `docs/modules/PRODUCTS.md`.
- Importacion de productos: `docs/modules/PRODUCT_IMPORT.md`.
- Compras: `docs/modules/PURCHASES.md`.
- Usuarios: `docs/modules/USERS.md`.
- Bitacora: `docs/modules/AUDIT_EVENTS.md`.
- Clientes: `docs/modules/CLIENTS.md`.
- Proveedores: `docs/modules/SUPPLIERS.md`.
- Catalogos base: `docs/modules/CATALOGS_BASE.md`.
