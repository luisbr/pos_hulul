# Deploy web MVP

Este documento deja el proyecto listo para que otro equipo haga el primer deploy de Hulul POS en servidor.

## Estado actual del proyecto

- Backend: Ruby on Rails API.
- Frontend: React + Vite.
- Base de datos: PostgreSQL.
- Etapa actual: web 100%.
- Seed actual de produccion/prueba: monousuario, sin datos demo.

Usuario base actual:

- correo: `luis.buendia@hulul.com.mx`
- password: `Abc123456`

## Lo que ya hace el MVP

- Login.
- Caja.
- Venta.
- Productos.
- Inventario.
- Clientes.
- Proveedores.
- Compras.
- Importacion base de productos por Excel.

## Recomendacion de despliegue

Para esta etapa conviene separar:

1. Backend Rails en servidor Linux con Docker/Kamal.
2. Frontend Vite como sitio estatico.
3. PostgreSQL administrado o en servidor aparte.

No conviene en esta fase intentar modo offline ni instalable local. Eso queda para etapa 2.

## Arquitectura recomendada de servidor

### Opcion simple

- `api.hulul.com.mx` -> backend Rails
- `app.hulul.com.mx` -> frontend Vite compilado
- PostgreSQL administrado

### Opcion mas simple aun

- mismo dominio para frontend
- subdominio para API

Ejemplo:

- `https://app.hulul.com.mx`
- `https://api.hulul.com.mx`

## Requisitos del servidor

### Backend

- Ubuntu 22.04 o 24.04 LTS
- Docker
- acceso SSH
- dominio apuntando al servidor
- certificado SSL
- acceso a PostgreSQL

### Frontend

- cualquier hosting estatico:
  - Vercel
  - Netlify
  - Cloudflare Pages
  - Nginx en VPS

## Variables y secretos

### Backend obligatorias

- `RAILS_MASTER_KEY`
- `BACKEND_DATABASE_PASSWORD`

### Backend recomendadas

Si la base no vive en el mismo servidor o si se quiere dejar explicito:

- `DB_HOST`
- `DB_PORT`
- `RAILS_ENV=production`
- `RAILS_LOG_LEVEL=info`

### Frontend obligatoria

- `VITE_API_BASE_URL`

Valor esperado en produccion:

```bash
VITE_API_BASE_URL=https://api.hulul.com.mx
```

## Punto importante antes de salir a servidor

Hoy el backend tiene CORS limitado a localhost en [cors.rb](/Users/osx/Documents/HULUL/ventas/backend/config/initializers/cors.rb).

Si frontend y backend van en dominios distintos, antes del deploy se debe ampliar esa lista con el dominio real del frontend.

Ejemplo:

```rb
origins "https://app.hulul.com.mx"
```

Si todo se sirve bajo el mismo origen, este ajuste puede ser menor, pero igual hay que validarlo.

## Backend con Kamal

Ya existe archivo base de Kamal en [deploy.yml](/Users/osx/Documents/HULUL/ventas/backend/config/deploy.yml), pero es plantilla y hay que cambiarlo.

### Cambios obligatorios en `backend/config/deploy.yml`

Reemplazar:

- `image: your-user/backend`
- `servers.web`
- `proxy.host`
- `registry.username`

Quedaria algo de este estilo:

```yml
service: backend
image: hulul/backend

servers:
  web:
    - TU_IP_DEL_SERVIDOR

proxy:
  ssl: true
  host: api.hulul.com.mx

registry:
  username: TU_USUARIO_DE_REGISTRY
  password:
    - KAMAL_REGISTRY_PASSWORD
```

## Secrets de Kamal

Crear/llenar `.kamal/secrets` con al menos:

```bash
KAMAL_REGISTRY_PASSWORD=...
RAILS_MASTER_KEY=...
BACKEND_DATABASE_PASSWORD=...
```

Si la base va fuera del servidor, agregar tambien:

```bash
DB_HOST=...
DB_PORT=5432
```

Y referenciarlo en `deploy.yml` si hace falta.

## Base de datos de produccion

Este proyecto usa PostgreSQL en produccion con multiples bases logicas:

- `backend_production`
- `backend_production_cache`
- `backend_production_queue`
- `backend_production_cable`

Eso viene de [database.yml](/Users/osx/Documents/HULUL/ventas/backend/config/database.yml).

El usuario de PostgreSQL esperado hoy es:

- usuario: `backend`

Antes del deploy hay que asegurar:

1. que ese usuario exista en PostgreSQL
2. que tenga permiso para crear y migrar esas bases
3. que `BACKEND_DATABASE_PASSWORD` coincida

## Primer deploy backend

Desde `backend/`:

```bash
bundle install
bin/kamal setup
bin/kamal deploy
```

Notas:

- El `Dockerfile` ya es de produccion.
- El entrypoint ya corre `rails db:prepare` cuando arranca el servidor.
- Si el servidor no puede crear la base por permisos, el deploy va a fallar y hay que preparar PostgreSQL primero.

## Seed inicial

La seed actual ya no mete datos demo. Solo deja lo minimo:

- negocio base
- sucursal base
- caja base
- usuario `luis.buendia@hulul.com.mx`
- cliente `Publico en general`

Si despues del deploy quieren cargar esa base minima manualmente:

```bash
bin/kamal app exec --interactive --reuse "bin/rails db:seed"
```

Si la base es nueva, normalmente `db:prepare` y luego `db:seed` es suficiente para arrancar pruebas.

## Frontend produccion

Desde `frontend/`:

```bash
npm install
VITE_API_BASE_URL=https://api.hulul.com.mx npm run build
```

Eso genera `frontend/dist/`.

Ese directorio se puede publicar en cualquier hosting estatico.

## Opcion Nginx para frontend

Publicar el contenido de `frontend/dist/` y configurar fallback a `index.html`.

Ejemplo minimo:

```nginx
server {
  listen 80;
  server_name app.hulul.com.mx;

  root /var/www/hulul-frontend/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## Flujo recomendado de salida a pruebas reales

1. Levantar PostgreSQL de produccion.
2. Configurar `backend/config/deploy.yml`.
3. Cargar secrets de Kamal.
4. Hacer deploy backend.
5. Ejecutar `db:seed`.
6. Compilar frontend con `VITE_API_BASE_URL` real.
7. Publicar `frontend/dist`.
8. Validar login y flujo operativo.

## Smoke test minimo despues del deploy

### Acceso

- abrir frontend
- login con `luis.buendia@hulul.com.mx`
- validar que carga negocio, sucursal y menu completo

### Caja

- abrir caja
- registrar movimiento
- cerrar caja

### Catalogos

- alta de cliente
- alta de proveedor
- alta de producto

### Compras

- registrar compra
- validar aumento de inventario

### Venta

- abrir nueva venta
- elegir cliente
- vender producto
- validar descuento de stock
- validar historial de venta

## Riesgos conocidos antes de deploy real

- CORS sigue preparado para localhost, no para dominio final.
- No hay aun usuarios/roles; el MVP actual es monousuario operativo.
- No hay sync offline todavia.
- No hay pipeline automatizado de CI/CD documentado; el primer deploy sera manual.

## Recomendacion operativa

Antes de ponerlo frente a usuario final, hacer una corrida completa desde cero:

1. base limpia
2. seed minima
3. alta de producto
4. alta de proveedor
5. compra
6. apertura de caja
7. venta con cliente
8. cierre de caja

Si ese recorrido pasa en servidor, ya tienen una primera salida usable para pruebas controladas.
