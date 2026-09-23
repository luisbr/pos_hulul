# Hulul POS Ferretero - Plan Hibrido de Implementacion

Este documento es el plan vivo para avanzar el MVP. Se basa en:

- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/MVP_BACKLOG.md`

La estrategia hibrida combina dos prioridades:

- Cerrar flujos verticales que hagan el POS usable de punta a punta.
- Agregar ABC minimo en los modulos que ya existen para no depender de seeds o cambios manuales.

## Estado Actual

Ya existe base funcional para:

- Rails API + PostgreSQL.
- React + Vite.
- Portal cliente con navegacion interna.
- Multi-tenant por `business_id`.
- Negocio base, sucursal, usuario operativo, caja y catalogo inicial.
- Productos listados desde API.
- Inventario por movimientos.
- Caja con apertura y movimientos.
- Venta con carrito, validacion de stock, folio, pago e impacto en inventario/caja.

## Principios de Orden

- Si una entidad ya aparece en UI, debe poder administrarse pronto desde UI.
- El stock no se edita directo: cambia por movimientos.
- Las ventas no se borran: se cancelan o se compensan con movimientos.
- Caja se maneja por sesiones de apertura/cierre.
- Primero hacemos flujos simples completos; luego control interno, reportes y casos avanzados.

## Roadmap Operativo

### Etapa 1 - Salida operativa monousuario

Objetivo: salir a uso real cuanto antes con un solo usuario final y flujo de contado.

#### 1. ABC Productos Minimo

Objetivo: dejar de depender de seeds para operar catalogo.

Estado: completado. Detalle en `docs/modules/PRODUCTS.md`.

- Listar productos.
- Crear producto.
- Editar producto.
- Activar/desactivar producto.
- Capturar SKU, codigo de barras, nombre, categoria, marca, unidad, precio, costo, IVA, stock minimo y ubicacion.
- Validar SKU unico por negocio.
- Validar codigo de barras unico cuando exista.

Criterio de aceptacion:

- Un usuario puede dar de alta un producto nuevo y venderlo en POS sin tocar consola ni seeds.

#### 2. Inventario Minimo Desde UI

Objetivo: operar existencias reales.

Estado: completado. Detalle en `docs/modules/INVENTORY.md`.

- Ver stock por producto.
- Registrar entrada inicial.
- Registrar ajuste positivo.
- Registrar ajuste negativo con motivo.
- Registrar merma con motivo.
- Ver historial reciente de movimientos.

Criterio de aceptacion:

- Todo cambio de stock genera `inventory_movement`.
- El saldo visible cambia despues del movimiento.

#### 3. Caja Operativa Desde UI

Objetivo: controlar turno de caja sin API manual.

Estado: completado. Detalle en `docs/modules/CASH.md`.

- Abrir caja.
- Ver caja abierta.
- Registrar entrada/salida de efectivo.
- Cerrar caja.
- Mostrar diferencia esperada vs contada.

Criterio de aceptacion:

- No se puede vender sin caja abierta.
- El cierre calcula diferencia y bloquea nuevos movimientos del turno cerrado.

#### 4. Cobro Real y Ticket Final

Objetivo: completar venta de mostrador con experiencia POS.

Estado: completado. Detalle en `docs/modules/SALES_CHECKOUT.md`.

- Abrir modal/pantalla de cobro.
- Elegir efectivo, tarjeta, transferencia o mixto.
- En efectivo, capturar recibido y calcular cambio.
- Confirmar venta.
- Mostrar ticket/resumen final con folio.
- Preparar impresion web.

Criterio de aceptacion:

- Una venta queda pagada, descuenta inventario, afecta caja si hay efectivo y muestra ticket final.

#### 5. Historial de Ventas

Objetivo: dar trazabilidad diaria.

Estado: completado. Detalle en `docs/modules/SALES_HISTORY.md`.

- Listar ventas recientes.
- Buscar por folio.
- Ver detalle de venta.
- Ver pagos.
- Ver cajero, caja y fecha.

Criterio de aceptacion:

- Se puede consultar cualquier venta generada desde POS.

#### 6. Cancelacion y Devolucion Basica

Objetivo: corregir ventas sin borrar historial.

Estado: completado. Detalle en `docs/modules/SALES_CANCELLATION.md`.

- Cancelar venta con motivo.
- Revertir inventario.
- Registrar salida/devolucion de caja cuando aplique.
- Bloquear doble cancelacion.

Criterio de aceptacion:

- La venta queda en estado cancelado y genera movimientos contrarios auditables.

#### 7. Catalogos Base

Objetivo: soportar productos reales sin datos rigidos.

Estado: completado. Detalle en `docs/modules/CATALOGS_BASE.md`.

- ABC categorias.
- ABC marcas.
- ABC unidades.
- Conversiones de unidad basicas.

Criterio de aceptacion:

- Productos pueden usar catalogos creados desde UI.

#### 8. Importacion Excel

Objetivo: arranque rapido para ferreterias reales.

Estado: completado. Detalle en `docs/modules/PRODUCT_IMPORT.md`.

- Descargar plantilla.
- Subir Excel.
- Validar datos.
- Preview.
- Reporte de errores.
- Confirmar importacion.
- Crear productos, catalogos faltantes y stock inicial por movimiento.

Criterio de aceptacion:

- Una ferreteria puede cargar catalogo inicial sin capturar producto por producto.

#### 9. Clientes

Objetivo: registrar comprador recurrente y preparar base de datos comercial.

Estado: completado. Detalle en `docs/modules/CLIENTS.md`.

- ABC clientes.
- Nombre, telefono, email, RFC, notas y estatus.
- Busqueda rapida.
- Seleccion desde venta en siguientes iteraciones.

Criterio de aceptacion:

- El negocio puede registrar y consultar clientes desde UI sin consola.

#### 10. Proveedores

Objetivo: registrar origen de compra y preparar flujo de abastecimiento.

Estado: completado. Detalle en `docs/modules/SUPPLIERS.md`.

- ABC proveedores.
- Nombre comercial, contacto, telefono, email, RFC, notas y estatus.
- Busqueda rapida.

Criterio de aceptacion:

- El negocio puede registrar y consultar proveedores desde UI sin consola.

#### 11. Compras

Objetivo: registrar abastecimiento real con impacto en inventario y costo.

Estado: completado. Detalle en `docs/modules/PURCHASES.md`.

- Alta de compra con proveedor.
- Captura de productos, cantidades y costos.
- Referencia o folio de compra.
- Entrada automatica a inventario.
- Actualizacion de costo actual de producto.

Criterio de aceptacion:

- Una compra registrada actualiza inventario y deja trazabilidad suficiente para operar.

#### 12. Cierre Operativo MVP

Objetivo: quitar textos de desarrollo y cerrar huecos visibles antes de uso diario.

- Logout visible.
- Copy limpio para usuario final.
- Mensajes y placeholders no tecnicos.
- Ajustes menores de flujo en login, caja y venta.

Criterio de aceptacion:

- El usuario final no ve texto de prototipo o desarrollo durante operacion normal.

### Etapa 2 - Robustecer operacion

Objetivo: mientras entra retro del usuario final, preparar control interno y visibilidad.

#### 1. Usuarios, Roles y Permisos

Objetivo: proteger acciones sensibles.

- Estado usuarios: modulo ABC inicial completado. Detalle en `docs/modules/USERS.md`.
- Estado multiempresa operativo: base protegida por membresia activa, selector de empresa activa y bloqueo operativo por estado de empresa.
- Estado selector empresa activa: completado en frontend.
- Estado permisos: matriz base completada en backend y reflejada en UI.
- Estado Admin Hulul: API protegida por roles internos y pantalla interna para listar empresas y activar/suspender.

- Crear usuarios operativos.
- Asignar rol por negocio.
- Activar o desactivar membresia.
- Selector de empresa activa en frontend para usuarios con varias empresas. Estado: completado.
- Persistir empresa activa elegida por usuario. Estado: completado.
- Bloquear operacion de empresas suspendidas o canceladas. Estado: completado por `business.status`; pagos/licencia queda para el final.
- Proteger endpoints admin Hulul con rol interno. Estado: completado.
- Crear pantalla Admin Hulul para ver empresas y activar/suspender desde UI. Estado: completado.
- Definir pagos por empresa: monto, periodicidad, vencimiento, historial y regla de suspension automatica.
- Permiso para cancelar venta.
- Permiso para ajustar inventario.
- Permiso para cerrar caja.
- Permiso para administrar productos y precios.
- Validacion en backend, no solo frontend.

Criterio de aceptacion:

- Un usuario sin permiso no puede ejecutar la accion desde API.
- Un usuario con varias empresas puede cambiar de empresa sin cerrar sesion.
- La API no permite leer ni modificar informacion de una empresa donde el usuario no tenga membresia activa.
- Las acciones operativas quedan registradas con el usuario autenticado, no con un ID enviado por el navegador.

#### 2. Reportes Basicos

Objetivo: visibilidad minima para el dueno.

- Ventas del dia.
- Ventas por metodo de pago.
- Productos mas vendidos.
- Stock bajo.
- Movimientos de caja.

Criterio de aceptacion:

- El dueno puede revisar operacion diaria sin exportar base de datos.

### Etapa 3 - Credito y CxC

Objetivo: extender el sistema a ventas no liquidadas al momento.

- Credito por cliente.
- Abonos.
- Saldos y vencimientos.
- Impacto en caja y reportes.

### Etapa Final - Sync hibrido/local

Objetivo: permitir continuidad operativa sin depender totalmente de red.

- Instalador local.
- Venta offline.
- Sync bidireccional.
- Resolucion de conflictos.

## Pendiente Fuera de Salida Inicial

Se mantiene fuera de la salida operativa inicial:

- Impresion directa ESC/POS.

Pero se debe seguir respetando desde etapa 1:

- UUIDs.
- `idempotency_key` en operaciones criticas.
- Folios legibles.
- Movimientos auditables.
- Futuro `sync_events`.

## Siguiente Decision

Siguiente bloque recomendado:

1. Cierre operativo MVP.
2. Clientes.
3. Proveedores.
4. Compras.

Despues de eso, pasar a Etapa 2 con usuarios/permisos y reportes.
