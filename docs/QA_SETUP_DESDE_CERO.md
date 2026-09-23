# QA manual: configurar una empresa desde cero

Este documento guía una prueba completa desde el acceso como **Admin Hulul** hasta dejar una empresa lista para operar ventas.

## Alcance

El tester recibe una cuenta `hulul_admin` creada previamente. A partir de ahí debe:

1. Crear una empresa.
2. Crear su primera sucursal y caja.
3. Crear al propietario.
4. Entrar como propietario.
5. Completar la configuración operativa.
6. Confirmar que la empresa queda lista para vender.

No se deben crear registros directamente en la base de datos.

## Requisitos previos

- PostgreSQL y la aplicación deben estar levantados.
- URL del portal: `http://localhost:5175/`.
- API esperada: `http://127.0.0.1:3001/`.
- Si es necesario levantar ambos servicios, desde la raíz del proyecto ejecutar:

```bash
./levantar.sh
```
- El responsable de la prueba debe proporcionar:
  - Email de Admin Hulul: `____________________________`
  - Contraseña: `____________________________`
  - Identificador de ejecución: fecha, iniciales o número de prueba.

## Datos sugeridos

Agregar un identificador único al nombre y al email para evitar duplicados. Ejemplo: `QA-20260920-01`.

### Empresa

| Campo | Valor sugerido |
|---|---|
| Nombre comercial | Ferretería QA-20260920-01 |
| Razón social | Ferretería QA-20260920-01 S.A. de C.V. |
| RFC | FQA260920A01 |
| Contacto principal | Patricia Pruebas |
| Teléfono | 5550101001 |
| WhatsApp | 5550101001 |
| Email | empresa.qa.20260920.01@example.test |
| Estado | Activa |
| Licencia | Prueba |

### Sucursal

| Campo | Valor sugerido |
|---|---|
| Nombre | Matriz QA |
| Código | MTZ |
| Dirección | Av. Pruebas 100, Centro |
| Zona horaria | America/Mexico_City |
| Moneda | MXN |
| Inicio de jornada | 00:00 |
| Nombre de caja | Caja principal |
| Código de caja | 001 |
| Ancho de ticket | 80 |

### Propietario

| Campo | Valor sugerido |
|---|---|
| Nombre | Olivia Propietaria QA |
| Email | propietaria.qa.20260920.01@example.test |
| Contraseña temporal | Provisional123! |
| Tipo de acceso | Propietario |

### Catálogo y operación

| Registro | Valor sugerido |
|---|---|
| Unidad | Pieza / pza |
| Categoría | Herramientas |
| Marca | QA Tools |
| Producto | Martillo de prueba |
| SKU | MART-QA-001 |
| Precio de venta | 199.00 |
| Costo | 120.00 |
| Stock mínimo | 5 |
| Proveedor | Proveedor QA |
| Cantidad inicial | 20 |
| Fondo inicial de caja | 1,000.00 |

## Caso 1: acceder a la consola interna

1. Abrir `http://localhost:5175/`.
2. Iniciar sesión con la cuenta Admin Hulul proporcionada.

Resultado esperado:

- Se muestra la **Consola interna**.
- El menú contiene únicamente **Empresas** y **Mi perfil**.
- No aparecen Venta, Caja, Inventario ni datos operativos de alguna empresa.

## Caso 2: crear la empresa

1. Entrar en **Empresas**.
2. Seleccionar **Nueva empresa**.
3. Capturar todos los datos sugeridos para la empresa.
4. Seleccionar **Crear empresa**.

Resultado esperado:

- La empresa se crea sin errores.
- Se abre su ficha administrativa.
- El nombre, RFC, contacto, estado y licencia coinciden con lo capturado.
- La empresa todavía no aparece como lista para operar porque no tiene configuración operativa.

## Caso 3: crear la primera sucursal y caja

1. En la ficha de la empresa, abrir **Sucursales**.
2. Seleccionar **Nueva sucursal**.
3. Capturar los datos sugeridos de la sucursal y su primera caja.
4. Guardar.

Resultado esperado:

- Aparece una sola sucursal llamada **Matriz QA**.
- El código mostrado es `MTZ`.
- La sucursal aparece activa.
- Se muestra una caja llamada **Caja principal**.
- El inicio de jornada aparece como `00:00`, no como un número de minutos.

## Caso 4: crear al propietario

1. Abrir la pestaña **Usuarios**.
2. Seleccionar **Nuevo usuario**.
3. Capturar nombre, email y contraseña temporal.
4. En **Tipo de acceso**, elegir **Propietario**.
5. Guardar.

Resultado esperado:

- No existe un campo llamado “Rol base” o “Rol general”.
- Para el propietario no se solicita elegir sucursales.
- El usuario aparece como **Propietario** con acceso a todas las sucursales.

## Caso 5: comprobar usuarios de sucursal

Este caso valida el modelo de permisos, aunque el usuario creado aquí no es necesario para terminar el setup.

1. Crear otro usuario.
2. Elegir **Usuario de sucursal**.
3. Marcar **Matriz QA**.
4. Seleccionar el rol **Cajero** para esa sucursal.
5. Guardar.

Resultado esperado:

- Es obligatorio seleccionar al menos una sucursal.
- El rol se elige dentro de la sucursal, no como rol general.
- El listado muestra `Matriz QA · Cajero`.
- No aparecen simultáneamente un rol general y otro rol de sucursal.

## Caso 6: entrar como propietario

1. Cerrar la sesión de Admin Hulul.
2. Iniciar sesión con el propietario creado en el Caso 4.

Resultado esperado:

- Se muestra el portal de la empresa recién creada.
- El encabezado identifica la empresa y la sucursal activa.
- El rol visible es **Propietario**.
- El sistema indica que todavía existen pasos de configuración pendientes.

## Caso 7: revisar Empresa y Sucursal activa

1. Abrir **Configuración**.
2. Revisar el bloque **Empresa**.
3. Revisar el bloque **Sucursal activa**.

Resultado esperado:

- Los datos de empresa ya aparecen precargados.
- Empresa y sucursal están claramente separadas.
- El bloque Empresa indica que sus datos se comparten entre todas las sucursales.
- El propietario puede modificar ambos bloques.
- La sucursal muestra **Matriz QA** y su dirección.
- El checklist solicita **Sucursal configurada**, no volver a crear o nombrar la empresa.

Si algún dato está incompleto, completarlo y usar el botón correspondiente:

- **Guardar empresa** modifica únicamente la información general.
- **Guardar sucursal** modifica únicamente la sucursal activa.

## Caso 8: completar catálogos

1. Abrir **Catálogos**.
2. Crear la unidad `Pieza`, abreviación `pza`.
3. Crear la categoría `Herramientas`.
4. Crear la marca `QA Tools` si el flujo la solicita.

Resultado esperado:

- Los registros quedan disponibles únicamente dentro de la empresa de prueba.
- El checklist marca unidad y categoría como completadas.

## Caso 9: crear el producto

1. Abrir **Productos**.
2. Crear `Martillo de prueba` con los datos sugeridos.
3. Confirmar que esté activo.

Resultado esperado:

- El producto aparece en el listado.
- El SKU es único dentro de la empresa.
- Inicialmente no tiene existencias en la sucursal.
- El catálogo del producto pertenece a la empresa, mientras el stock pertenece a la sucursal.

## Caso 10: crear proveedor

1. Abrir **Proveedores**.
2. Crear `Proveedor QA` con estado activo.

Resultado esperado:

- El proveedor aparece activo.
- El checklist marca el proveedor como completado.

## Caso 11: cargar inventario de la sucursal

Usar una de estas opciones:

### Opción A: compra recibida

1. Abrir **Compras**.
2. Registrar una compra para `Proveedor QA`.
3. Agregar `Martillo de prueba`, cantidad `20`, costo unitario `120.00`.
4. Guardar.

### Opción B: carga inicial

1. Abrir **Inventario**.
2. Elegir **Stock inicial**.
3. Seleccionar `Martillo de prueba`.
4. Registrar cantidad `20` y costo `120.00`.

Resultado esperado:

- Matriz QA muestra `20` unidades.
- Se genera un movimiento de inventario.
- El stock no se mezcla con otras sucursales.
- El checklist marca inventario como completado.

## Caso 12: abrir caja

1. Abrir **Caja**.
2. Seleccionar **Abrir**.
3. Capturar fondo inicial `1,000.00`.
4. Confirmar la apertura.

Resultado esperado:

- Antes de completar sucursal, catálogos, proveedor, producto e inventario, Caja debe permanecer bloqueada.
- Después de completar los pasos anteriores, permite abrirla.
- La caja queda abierta en **Matriz QA**.
- El efectivo esperado inicia en `$1,000.00`.
- El checklist queda completo y Venta se habilita.

## Caso 13: prueba final de venta

1. Abrir **Venta**.
2. Agregar una unidad de `Martillo de prueba`.
3. Cobrar en efectivo con `$200.00`.
4. Confirmar la venta.

Resultado esperado:

- Se genera un folio con sucursal y caja, por ejemplo `MTZ-001-000001`.
- Total: `$199.00`.
- Cambio: `$1.00`.
- El inventario queda en `19` unidades.
- El efectivo esperado de caja aumenta en `$199.00`.

## Caso 14: aislamiento básico de roles

1. Cerrar sesión.
2. Iniciar sesión con el cajero creado en el Caso 5.

Resultado esperado:

- El menú muestra únicamente Inicio, Venta, Clientes y Caja.
- No aparecen Compras, Productos, Catálogos, Inventario, Proveedores, Usuarios, Configuración ni Bitácora.
- El cajero solo puede trabajar en las sucursales donde está asignado.
- Si la sucursal no está lista, Venta y Caja permanecen bloqueadas.

## Criterio de aceptación

La prueba se considera aprobada cuando:

- La empresa existe una sola vez.
- Empresa y sucursal se administran por separado.
- Existe al menos una sucursal activa con caja.
- Existe un propietario global.
- Los demás usuarios tienen rol exclusivamente por sucursal.
- Catálogos, producto, proveedor e inventario están configurados.
- La caja puede abrirse únicamente después de completar los prerrequisitos.
- Se puede completar una venta y se actualizan caja e inventario.
- No aparecen errores de CORS, respuestas `500` ni pantallas en blanco.

## Formato para reportar incidencias

```text
Título:
Caso y paso:
Usuario/rol:
Empresa y sucursal:
Resultado esperado:
Resultado obtenido:
Mensaje de error:
Captura de pantalla:
¿Se reproduce nuevamente?: Sí / No
Fecha y hora:
```
