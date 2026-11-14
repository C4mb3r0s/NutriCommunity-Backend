# NutriCommunity Backend

API REST para NutriCommunity, una plataforma de recetas y hábitos de alimentación administrada por un profesional de la nutrición.

El backend proporciona autenticación segura, publicaciones, comentarios, reacciones y administración básica de usuarios. Actualmente se encuentra en la etapa MVP.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle%20ORM-0.45-C5F74F?logo=drizzle&logoColor=111827" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Jest-Testing-C21325?logo=jest&logoColor=white" alt="Jest" />
  <img src="https://img.shields.io/badge/ESLint-Standard-4B32C3?logo=eslint&logoColor=white" alt="ESLint" />
</p>

## Navegación

- [Arquitectura](#arquitectura)
- [Contrato de la API](#contrato-de-la-api)
- [Pruebas con Yaak y Postman](#pruebas-con-yaak-y-postman)
- [Instalación](#instalación)
- [Docker](#docker)
- [Comandos del backend](#comandos-del-backend)

## Arquitectura

```text
NutriCommunity/
├── nutricommunity_backend/
│   ├── db          PostgreSQL 16
│   ├── migrate     Ejecuta migraciones y termina
│   └── backend     API Express
└── nutriCommunity_frontend/
    └── frontend    Aplicación React
```

| Servicio | Responsabilidad | Acceso |
|---|---|---|
| `db` | PostgreSQL | `localhost:5433` desde el host |
| `migrate` | Ejecuta migraciones | Solo dentro de Docker |
| `backend` | API Express | `http://localhost:3000` |

Dentro de Docker el backend usa `db:5432`. Desde el host se utiliza `localhost:5433`.

## Base de datos y relaciones

Actualmente el esquema de Drizzle contempla 18 tablas. Ocho son utilizadas por el MVP y diez están preparadas para funcionalidades futuras. Las claves primarias y foráneas utilizan `uuid`; los valores `smallint` se reservan para cantidades, minutos y ordenamientos.

> Todas las rutas descritas en la sección de endpoints están implementadas actualmente.

<details>
<summary>Ver tablas y responsabilidades</summary>

| Tabla | Responsabilidad | Relaciones principales |
|---|---|---|
| `users` | Usuarios, credenciales y estado | 1:N con `posts`, `comments`, `reactions`, `audit_logs`; N:N con `roles` y `tags` |
| `roles` | Roles del sistema | N:N con `users` mediante `user_roles` |
| `user_roles` | Asignación de roles | Une `users` con `roles` |
| `refresh_sessions` | Sesiones y refresh tokens hasheados | N:1 con `users` |
| `content_types` | Tipos de publicación | 1:N con `posts` |
| `posts` | Publicaciones y recetas | Pertenece a `users` y `content_types` |
| `recipe_details` | Porciones y tiempos | 1:1 con `posts` |
| `recipe_steps` | Pasos ordenados | N:1 con `posts` |
| `ingredients` | Catálogo de ingredientes | N:N con `posts` mediante `recipe_ingredients` |
| `units` | Unidades de medida | 1:N con `recipe_ingredients` |
| `recipe_ingredients` | Ingredientes, cantidades y unidades | Une `posts`, `ingredients` y `units` |
| `tags` | Objetivos, condiciones, alergias y categorías | N:N con `posts` y `users` |
| `post_tags` | Tags asignados a publicaciones | Une `posts` con `tags` |
| `user_preferences` | Preferencias y exclusiones del usuario | Une `users` con `tags` |
| `nutrition_facts` | Nutrición por porción | 1:1 con `posts` |
| `reactions` | `like`, `love` y `amaze` | N:1 con `posts` y `users`; una por usuario y publicación |
| `comments` | Comentarios y estado de moderación | N:1 con `posts` y `users` |
| `audit_logs` | Historial de acciones importantes | Opcionalmente referencia a `users` y `posts` |

</details>

<details>
<summary>Ver relaciones del modelo</summary>

```text
users 1 ─── N posts
users N ─── N roles              mediante user_roles
posts N ─── 1 content_types
posts 1 ─── 0..1 recipe_details
posts 1 ─── N recipe_steps
posts N ─── N ingredients        mediante recipe_ingredients
recipe_ingredients N ─── 1 units
posts N ─── N tags               mediante post_tags
users N ─── N tags               mediante user_preferences
posts 1 ─── 0..1 nutrition_facts
posts 1 ─── N reactions
users 1 ─── N reactions
posts 1 ─── N comments
users 1 ─── N comments
users 1 ─── N audit_logs
posts 1 ─── N audit_logs
```

Reglas importantes:

- Una publicación siempre tiene un autor y un tipo de contenido.
- `recipe_details` es opcional porque una guía no necesariamente es una receta.
- Una publicación puede tener muchos pasos, ingredientes y tags.
- Un usuario solo puede tener una reacción activa por publicación.
- Las publicaciones eliminadas se conservan con estado `deleted`.
- Los tags inactivos no se ofrecen para nuevos registros, pero no rompen relaciones históricas.

</details>

## Contrato de la API

La API utilizará el prefijo:

```text
/api
```

Los endpoints protegidos requieren:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Formato general de error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos",
    "details": {}
  }
}
```

### Salud del servicio

<details>
<summary><code>GET /health</code></summary>

Endpoint disponible para comprobar que la API está ejecutándose.

Respuesta `200 OK`:

```json
{
  "status": "ok",
  "service": "nutricommunity-backend"
}
```

</details>

### Autenticación

<details>
<summary><code>POST /api/admin/users</code> — registrar usuario</summary>

Acceso: administrador autenticado y CSRF.

Request:

```json
{
  "firstName": "Ana",
  "secondName": "María",
  "lastName": "López",
  "secondLastName": "García",
  "email": "ana@example.com",
  "password": "UnaClaveSegura123!"
}
```

Respuesta `201 Created`:

```json
{
  "user": {
    "id": "uuid",
    "firstName": "Ana",
    "secondName": "María",
    "lastName": "López",
    "secondLastName": "García",
    "email": "ana@example.com",
    "roles": ["participant"]
  }
}
```

La respuesta excluye `password_hash`. Los participantes deben registrarse desde el dashboard del administrador; esta ruta no es pública.

</details>

<details>
<summary><code>POST /api/auth/login</code> — iniciar sesión</summary>

Acceso: público.

Request:

```json
{
  "email": "ana@example.com",
  "password": "UnaClaveSegura123!"
}
```

Respuesta `200 OK`:

```json
{
  "user": {
    "id": "uuid",
    "firstName": "Ana",
    "secondName": "María",
    "lastName": "López",
    "secondLastName": "García",
    "email": "ana@example.com",
    "roles": ["participant"]
  },
  "accessToken": "jwt"
}
```

</details>

<details>
<summary><code>GET /api/auth/me</code> — usuario autenticado</summary>

Acceso: JWT requerido.

Respuesta `200 OK`:

```json
{
  "user": {
    "id": "uuid",
    "firstName": "Ana",
    "secondName": "María",
    "lastName": "López",
    "secondLastName": "García",
    "email": "ana@example.com",
    "roles": ["participant"],
    "status": "active"
  }
}
```

</details>

<details>
<summary><code>POST /api/auth/logout</code> — cerrar sesión</summary>

Acceso: JWT y CSRF requeridos. La sesión se revoca en `refresh_sessions` y se limpian las cookies.

Respuesta `204 No Content` o:

```json
{
  "message": "Sesión cerrada correctamente"
}
```

</details>

<details>
<summary><code>POST /api/auth/refresh</code> — renovar sesión</summary>

Acceso: cookie `refresh_token` y header `X-CSRF-Token`.

El endpoint valida el refresh token, revoca la sesión anterior, crea una nueva sesión y devuelve un access token nuevo. También actualiza las cookies `refresh_token` y `csrf_token`.

Respuesta `200 OK`:

```json
{
  "accessToken": "new-jwt"
}
```

</details>

### Administración de tokens

El access token es un JWT firmado con `JWT_SECRET` y dura por defecto `15m`. Se envía en el header `Authorization` y no se almacena en la base de datos.

El refresh token se firma con `REFRESH_TOKEN_HMAC_SECRET`, dura por defecto `7d` y se guarda en la cookie `httpOnly` `refresh_token`. En PostgreSQL solo se conserva su hash en `refresh_sessions`, junto con el `jti`, usuario, expiración y estado de revocación.

Cuando el access token expira, el frontend llama automáticamente a `/api/auth/refresh`. El backend rota la sesión anterior y entrega nuevos tokens. Si el refresh token expiró, fue revocado o no coincide con su hash, la sesión se limpia y el usuario debe iniciar sesión otra vez.

El CSRF token se firma con `CSRF_SECRET`, se guarda en la cookie legible `csrf_token` y debe repetirse en el header `X-CSRF-Token`. El backend compara ambos valores y valida su firma para las operaciones que modifican información.

### Pruebas con Yaak y Postman

Las colecciones utilizan el formato Postman Collection v2.1 y se pueden importar en Postman o Yaak:

```text
docs/yaak/nutricommunity-auth.postman_collection.json
docs/yaak/nutricommunity-mvp.postman_collection.json
docs/yaak/nutricommunity-local.postman_environment.json
```

El nombre de la carpeta `docs/yaak` conserva la organización original del proyecto. Los archivos `.postman_collection.json` también son compatibles con Postman.

#### Configuración inicial

1. Inicia el backend con `pnpm dev` o `pnpm run compile`.
2. Importa las dos colecciones y el entorno `NutriCommunity - Local`.
3. Activa el entorno en Yaak o Postman.
4. Confirma que `base_url` sea `http://localhost:3000`.
5. Habilita el almacenamiento de cookies del cliente HTTP.
6. Ejecuta `Health check` para comprobar que la API responde.

#### Flujo de autenticación

1. Ejecuta `Login` con las credenciales de un usuario existente.
2. Conserva la cookie `refresh_token` en el cookie jar.
3. Copia el valor `accessToken` de la respuesta a `access_token`.
4. Copia el valor de la cookie `csrf_token` a `csrf_token`.
5. Ejecuta `Current user` para validar el access token y los roles.
6. Ejecuta las solicitudes protegidas usando `Authorization: Bearer {{access_token}}`.
7. Envía `X-CSRF-Token: {{csrf_token}}` en las solicitudes que modifican información.

La solicitud `Refresh token` utiliza la cookie `refresh_token` y el header `X-CSRF-Token`. El backend rota la sesión, actualiza las cookies y devuelve un access token nuevo. Después de ejecutarla, actualiza `access_token` con el valor de la respuesta. Si la sesión expiró o fue revocada, ejecuta `Login` nuevamente.

La solicitud `Logout` requiere el access token, el token CSRF y la cookie de refresh. Al terminar, el backend revoca la sesión y limpia las cookies.

#### Orden recomendado para probar el MVP

| Orden | Solicitud | Requisito |
|---:|---|---|
| 1 | `Health check` | Ninguno |
| 2 | `Login` | Usuario existente |
| 3 | `List content types` | Ninguno; copia un ID en `content_type_id` |
| 4 | `List published posts` | Ninguno |
| 5 | `Create post` | Access token y CSRF |
| 6 | `Get post detail` | Copia el ID creado en `post_id` |
| 7 | `Toggle post reaction` | Access token y CSRF |
| 8 | `List post comments` | `post_id` |
| 9 | `Create comment` | Access token y CSRF |
| 10 | `List users` | Usuario con rol `admin` |
| 11 | `Create user` | Usuario con rol `admin` y CSRF |
| 12 | `Update user status` | `user_id`, rol `admin` y CSRF |
| 13 | `Delete comment` o `Delete post` | ID correspondiente, autor o admin |
| 14 | `Logout` | Access token, CSRF y cookie de refresh |

Las solicitudes de creación, actualización y eliminación requieren `Content-Type: application/json` cuando envían cuerpo. Las respuestas más comunes son `200 OK`, `201 Created` y `204 No Content`. Un `400` indica datos inválidos, `401` una sesión o credencial inválida, `403` permisos o CSRF insuficientes, `404` un recurso inexistente y `409` un correo ya registrado.

### Rutas activas del MVP

Actualmente están implementadas estas rutas:

| Método | Ruta | Acceso |
|---|---|---|
| GET | /health | Público |
| POST | /api/auth/login | Público |
| GET | /api/auth/me | Usuario autenticado |
| POST | /api/auth/refresh | Refresh token + CSRF |
| POST | /api/auth/logout | JWT + CSRF |
| GET | /api/content-types | Público |
| GET | /api/posts | Público |
| GET | /api/posts/:postId | Público; solo publicaciones `published` |
| POST | /api/posts | Usuario autenticado + CSRF |
| PATCH | /api/posts/:postId | Autor/admin + CSRF |
| DELETE | /api/posts/:postId | Autor/admin + CSRF |
| GET | /api/post/:postId/comments?page=1&limit=10 | Público |
| POST | /api/posts/:postId/comments | Usuario autenticado + CSRF |
| DELETE | /api/comments/:commentId | Autor/admin + CSRF |
| PUT | /api/posts/:postId/reaction | Usuario autenticado + CSRF |
| GET | /api/admin/users | Admin |
| POST | /api/admin/users | Admin + CSRF |
| PATCH | /api/admin/users/:userId/status | Admin + CSRF |

El registro de participantes no es público. Se realiza desde el dashboard del administrador con `POST /api/admin/users`. La cuenta inicial del administrador se crea mediante el script SQL documentado en la sección de DBeaver.

Las publicaciones devuelven información legible del autor y del tipo de contenido:

```json
{
  "authorName": "Ana López",
  "contentTypeName": "Receta",
  "title": "Ensalada de pollo",
  "content": "Preparación de la receta"
}
```

Los comentarios se consultan de 10 en 10 y devuelven `authorName`, `body` y una propiedad `pagination.hasMore`. Para cargar más comentarios se incrementa el parámetro `page` sin eliminar los anteriores en el frontend.

Las reacciones aceptan `like`, `love` y `amaze`. El usuario solo puede tener una reacción por publicación: una nueva reemplaza la anterior y repetir la misma reacción la elimina.

Las tablas de recetas, ingredientes, nutrición, tags, preferencias y auditoría están preparadas para una segunda etapa, pero todavía no tienen endpoints implementados.

## Dependencias de producción

- Express 5.
- CORS.
- Helmet.
- Express Rate Limit.
- Dotenv.
- Zod.
- JSON Web Token.
- Bcrypt.
- Drizzle ORM.
- Postgres.

## Herramientas necesarias

- Node.js y TypeScript.
- pnpm.
- PostgreSQL 16 mediante Docker.
- Docker Engine y Docker Compose V2.
- DBeaver, opcional para inspeccionar PostgreSQL.
- Yaak, opcional para probar la API.

## Uso en Windows

La opción recomendada en Windows es ejecutar el proyecto dentro de WSL2 con una distribución Linux. No necesitas Docker Desktop si instalas Docker Engine directamente dentro de WSL2; Docker Desktop con integración WSL2 también es una alternativa. Los comandos de Linux del resto de este documento deben ejecutarse dentro de WSL, no en `cmd.exe`.

### WSL2

Desde PowerShell como administrador:

```powershell
wsl --install
```

Después de reiniciar, abre la distribución instalada, clona el repositorio dentro del entorno Linux y ejecuta:

```bash
cd ~/turing/nutriCommunity_backend
cp .env.example .env
pnpm install
pnpm run compile
```

Valida Docker desde WSL:

```bash
docker version
docker compose version
```

### PowerShell

Si ejecutas los comandos desde PowerShell, usa estas equivalencias:

```powershell
Copy-Item .env.example .env
pnpm install
pnpm run compile
```

Para generar secretos puedes usar OpenSSL desde WSL o Git Bash:

```bash
openssl rand -hex 32
```

Si no tienes OpenSSL disponible, usa Node.js:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Repite el comando para `JWT_SECRET`, `REFRESH_TOKEN_HMAC_SECRET` y `CSRF_SECRET`, usando un valor diferente para cada variable.

### Puertos en Windows

Desde el navegador y DBeaver se utilizan los puertos publicados en el host:

```text
Backend: http://localhost:3000
PostgreSQL: localhost:5433
```

Dentro de Docker, el backend usa `db:5432` para conectarse a PostgreSQL y escucha internamente en el puerto `4000`.

## Instalación

En Arch Linux:

```bash
sudo pacman -Syu nodejs npm docker docker-compose
sudo npm install --global pnpm
sudo systemctl enable --now docker.service
sudo usermod -aG docker "$USER"
newgrp docker
```

Verifica las herramientas:

```bash
node --version
pnpm --version
docker --version
docker compose version
```

Instalación de dependencias:

```bash
cd nutricommunity_backend
pnpm install
```

Si pnpm bloquea el build nativo de bcrypt:

```bash
pnpm approve-builds bcrypt
pnpm rebuild bcrypt
```

El selector interactivo debe incluir únicamente `bcrypt`.

## Variables de entorno

Creación del archivo local:

```bash
cp .env.example .env
```

Configuración mínima para Docker:

```env
NODE_ENV=development
PORT=3000
POSTGRES_DB=nutricommunity
POSTGRES_USER=nutricommunity_user
POSTGRES_PASSWORD=cambia_esta_contraseña

JWT_SECRET=genera_un_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_HMAC_SECRET=genera_otro_secreto_largo_y_aleatorio
REFRESH_TOKEN_EXPIRES_IN=7d
CSRF_SECRET=genera_un_tercer_secreto_largo_y_aleatorio

FRONTEND_URL=http://localhost:4000
```

Cuando ejecutas el backend directamente con `pnpm dev`, `PORT=3000` hace que la API escuche en `localhost:3000`. En Docker, `docker-compose.yml` sobrescribe el puerto interno con `4000` y publica `localhost:3000` mediante el mapeo `3000:4000`.

Para generar secretos seguros, ejecuta el siguiente comando una vez por cada variable
(`JWT_SECRET`, `REFRESH_TOKEN_HMAC_SECRET` y `CSRF_SECRET`):

```bash
openssl rand -hex 32
```

Cada variable debe utilizar un valor diferente. No compartas estos valores ni los subas al repositorio.

`DATABASE_URL` no es necesaria para `docker compose up`: Compose la construye internamente para `backend` y `migrate` usando `db:5432`.

Sí es necesaria si ejecutas Drizzle desde el host:

```env
DATABASE_URL=postgresql://nutricommunity_user:cambia_esta_contraseña@localhost:5433/nutricommunity
```

Desde el host, la conexión requiere `localhost:5433`; el nombre `db` solo se resuelve dentro de Docker.

## Docker

Los comandos de esta sección se ejecutan desde `nutricommunity_backend`.

Construir imágenes, recrear los contenedores e iniciar el entorno completo:

```bash
pnpm run compile
```

Este comando reconstruye las imágenes, recrea los contenedores e inicia PostgreSQL, migraciones y backend en segundo plano.

El contenedor `migrate` espera a que PostgreSQL esté saludable, ejecuta `pnpm db:migrate` y termina con código `0`. Si no hay migraciones pendientes, termina correctamente sin cambios. El backend inicia después de que `migrate` termina correctamente.

Iniciar manualmente el entorno completo:

```bash
docker compose up
```

Para volver a comprobar y aplicar migraciones después de cambiar el código o agregar una migración, usa:

```bash
pnpm run compile
```

El flujo es:

```text
PostgreSQL saludable → migrate aplica migraciones → backend inicia
```

Comandos frecuentes:

```bash
docker compose up -d
docker compose up --build
docker compose logs -f backend
docker compose logs -f migrate
docker compose down
docker compose down -v
```

`docker compose down -v` elimina el volumen local y la base de datos almacenada en él.

## Migraciones

Los schemas están en `src/db/schema/`.

Al modificar un schema:

```bash
pnpm db:generate
pnpm run compile
```

`db:generate` crea el SQL y `migrate` lo aplica. Las migraciones de `src/db/migrations/` deben subirse al repositorio.

Para aplicar desde el host:

```bash
docker compose up -d db
pnpm db:migrate
```

En este caso `.env` requiere `DATABASE_URL` con `localhost:5433`.

## Datos iniciales

El seed carga roles, unidades y tipos de contenido:

```bash
pnpm db:seed
```

Dentro de Docker:

```bash
docker compose run --rm backend pnpm db:seed
```

## DBeaver

Con PostgreSQL iniciado:

```bash
docker compose up -d db
```

Usa una conexión PostgreSQL con:

```text
Host: localhost
Port: 5433
Database: nutricommunity
User: nutricommunity_user
Password: el valor de POSTGRES_PASSWORD
```

Después de migrar, abre `public` y la pestaña `Diagram` para ver las tablas y sus relaciones.

Para crear el usuario administrador desde DBeaver, utiliza el script:

```text
docs/sql/create-admin.sql
```

Antes de ejecutar el script, actualiza estos valores en el bloque `VALUES`:

| Campo | Qué modificar |
|---|---|
| `first_name` | Primer nombre del administrador |
| `second_name` | Segundo nombre o `NULL` |
| `last_name` | Primer apellido |
| `second_last_name` | Segundo apellido o `NULL` |
| `email` | Correo con el que iniciarás sesión |
| `REPLACE_WITH_A_STRONG_PASSWORD` | Contraseña real del administrador |

La contraseña se genera con `pgcrypto` usando `bcrypt` y 14 rounds:

```sql
crypt('TU_CONTRASEÑA', gen_salt('bf', 14))
```

El script ejecuta `CREATE EXTENSION IF NOT EXISTS pgcrypto`, crea el rol `admin` si no existe y asigna ese rol al usuario. Si el correo ya existe, únicamente activa el usuario y conserva sus datos actuales; no reemplaza automáticamente su nombre ni su contraseña. Para cambiar una contraseña existente, ejecuta una actualización controlada:

```sql
UPDATE users
SET password_hash = crypt('NUEVA_CONTRASEÑA', gen_salt('bf', 14)),
    status = 'active',
    updated_at = now()
WHERE email = 'admin@nutricommunity.com';
```

Después de ejecutar el script, inicia sesión con el correo y la contraseña configurados. El usuario debe tener una fila relacionada en `user_roles` con el rol `admin`.

## Comandos del backend

Los comandos se ejecutan desde la carpeta `nutriCommunity_backend` después de instalar las dependencias con `pnpm install`.

### Desarrollo y compilación

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia el backend en modo desarrollo con recarga automática. |
| `pnpm build` | Compila TypeScript y genera los archivos en `dist/`. |
| `pnpm start` | Ejecuta el backend compilado. Requiere haber ejecutado `pnpm build`. |
| `pnpm run compile` | Construye las imágenes Docker, recrea e inicia los contenedores, ejecuta las migraciones y carga los datos iniciales. |

`pnpm run compile` inicia PostgreSQL, el contenedor de migraciones y el backend. El contenedor `migrate` termina después de aplicar las migraciones y ejecutar el seed. El backend queda disponible en `http://localhost:3000` y PostgreSQL en `localhost:5433` desde el host.

### Calidad del código

| Comando | Descripción |
|---|---|
| `pnpm typecheck` | Valida los tipos de TypeScript sin generar archivos. |
| `pnpm lint` | Ejecuta ESLint sobre el proyecto. |
| `pnpm lint:fix` | Corrige automáticamente los problemas de ESLint que se puedan resolver. |

### Pruebas generales

| Comando | Descripción |
|---|---|
| `pnpm test` | Ejecuta todas las pruebas una vez. |
| `pnpm test:watch` | Ejecuta Jest en modo observación y repite las pruebas cuando cambian los archivos. |
| `pnpm test:coverage` | Ejecuta todas las pruebas y genera el reporte de cobertura. |
| `pnpm test:ci` | Ejecuta las pruebas con cobertura en modo CI. |

### Pruebas por módulo

| Comando | Descripción |
|---|---|
| `pnpm test:schemas` | Prueba los schemas de validación. |
| `pnpm test:tokens` | Prueba la creación y validación de tokens. |
| `pnpm test:middlewares` | Prueba los middlewares de autenticación, autorización, cookies y CSRF. |
| `pnpm test:services` | Prueba los servicios de la aplicación. |
| `pnpm test:http` | Prueba los controladores HTTP. |
| `pnpm test:auth` | Ejecuta las pruebas relacionadas con autenticación, tokens y CSRF. |
| `pnpm test:posts` | Ejecuta las pruebas de publicaciones. |
| `pnpm test:comments` | Ejecuta las pruebas de comentarios. |
| `pnpm test:reactions` | Ejecuta las pruebas de reacciones. |
| `pnpm test:admin` | Ejecuta las pruebas administrativas. |

### Cobertura por módulo

| Comando | Descripción |
|---|---|
| `pnpm test:coverage:auth` | Genera cobertura de autenticación, tokens, CSRF, middleware y controlador de autenticación. |
| `pnpm test:coverage:controllers` | Genera cobertura de los controladores HTTP. |
| `pnpm test:coverage:services` | Genera cobertura de los servicios y tokens. |
| `pnpm test:coverage:schemas` | Genera cobertura de los schemas de validación. |

### Base de datos

| Comando | Descripción |
|---|---|
| `pnpm db:generate` | Genera una nueva migración SQL a partir de los cambios en los schemas de Drizzle. |
| `pnpm db:migrate` | Aplica las migraciones pendientes usando `DATABASE_URL`. |
| `pnpm db:seed` | Carga o actualiza los datos iniciales. |
| `pnpm db:studio` | Abre Drizzle Studio para inspeccionar la base de datos. |

Después de modificar un schema, ejecuta `pnpm db:generate` y luego `pnpm db:migrate`. Si trabajas con Docker, `pnpm run compile` ejecuta el flujo de migración y seed automáticamente.

## Estructura

```text
nutricommunity_backend/
├── docs/
│   ├── sql/
│   │   └── create-admin.sql
│   └── yaak/
│       ├── nutricommunity-auth.postman_collection.json
│       ├── nutricommunity-local.postman_environment.json
│       └── nutricommunity-mvp.postman_collection.json
├── docker/
│   └── postgres/
│       └── init/
├── Dockerfile
├── docker-compose.yml
├── drizzle.config.ts
├── eslint.config.js
├── package.json
├── pnpm-lock.yaml
├── src/
│   ├── controllers/
│   │   ├── admin.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── post.controller.ts
│   │   └── reaction.controller.ts
│   ├── db/
│   │   ├── index.ts
│   │   ├── migrations/
│   │   ├── schema/
│   │   └── seed.ts
│   ├── middlewares/
│   │   ├── authenticate.ts
│   │   ├── authorize.ts
│   │   ├── cookies.ts
│   │   └── csrf.ts
│   ├── routes/
│   │   ├── admin.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── comment.routes.ts
│   │   └── post.routes.ts
│   ├── schemas/
│   │   ├── admin.schema.ts
│   │   ├── auth.schema.ts
│   │   ├── comment.schema.ts
│   │   ├── post.schema.ts
│   │   └── reaction.schema.ts
│   ├── services/
│   │   ├── admin.service.ts
│   │   ├── auth.service.ts
│   │   ├── comment.service.ts
│   │   ├── post.service.ts
│   │   ├── reaction.service.ts
│   │   └── token.service.ts
│   ├── types/
│   │   ├── bcrypt.d.ts
│   │   └── express.d.ts
│   └── server.ts
└── tsconfig.json
```
