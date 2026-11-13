# NutriCommunity

Plataforma web para una comunidad de recetas y hábitos de alimentación administrada por un nutriólogo.

> Alcance actual: MVP de autenticación, publicaciones, comentarios, reacciones y administración básica de usuarios.

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
<summary><code>POST /api/auth/register</code> — registrar participante</summary>

Acceso: público.

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

La respuesta excluye `password_hash`.

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

Acceso: JWT requerido.

Respuesta `204 No Content` o:

```json
{
  "message": "Sesión cerrada correctamente"
}
```

</details>

### Yaak

La colección de autenticación se encuentra en:

```text
docs/yaak/nutricommunity-auth.postman_collection.json
```

El entorno local se encuentra en:

```text
docs/yaak/nutricommunity-local.postman_environment.json
```

Para importarlos en Yaak:

1. Importa `nutricommunity-auth.postman_collection.json`.
2. Importa `nutricommunity-mvp.postman_collection.json`.
3. Importa el archivo de entorno en el mismo workspace.
4. Activa `NutriCommunity - Local`.
5. Inicia el backend con `pnpm dev` o `pnpm run compile`.
6. Ejecuta `Register participant` o configura las credenciales del usuario administrador en `Login`.
7. Copia el `accessToken` de la respuesta de login en la variable `access_token`.
8. Copia el valor de la cookie `csrf_token` en la variable `csrf_token`.

La cookie `refresh_token` debe conservarse en el cookie jar de Yaak. Las solicitudes `Refresh token` y `Logout` requieren también el header `X-CSRF-Token`.

### Rutas activas del MVP

Actualmente están implementadas estas rutas:

| Método | Ruta | Acceso |
|---|---|---|
| GET | /health | Público |
| POST | /api/auth/register | Público |
| POST | /api/auth/login | Público |
| GET | /api/auth/me | Usuario autenticado |
| POST | /api/auth/refresh | Refresh token + CSRF |
| POST | /api/auth/logout | JWT + CSRF |
| GET | /api/posts | Público |
| GET | /api/posts/:postId | Público; solo publicaciones `published` |
| POST | /api/posts | Usuario autenticado + CSRF |
| PATCH | /api/posts/:postId | Autor/admin + CSRF |
| DELETE | /api/posts/:postId | Autor/admin + CSRF |
| GET | /api/post/:postId/comments | Público |
| POST | /api/posts/:postId/comments | Usuario autenticado + CSRF |
| DELETE | /api/comments/:commentId | Autor/admin + CSRF |
| PUT | /api/posts/:postId/reaction | Usuario autenticado + CSRF |
| GET | /api/admin/users | Admin |
| PATCH | /api/admin/users/:userId/status | Admin + CSRF |

El plan detallado de implementación está en:

```text
../plan-rutas-mvp.md
```

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

FRONTEND_URL=http://localhost:5173
```

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

Reemplaza `REPLACE_WITH_A_STRONG_PASSWORD` antes de ejecutarlo.

## Comandos del backend

| Comando | Descripción |
|---|---|
| `pnpm dev` | Desarrollo con recarga automática |
| `pnpm build` | Compila TypeScript a `dist/` |
| `pnpm start` | Ejecuta la compilación |
| `pnpm run compile` | Construye, recrea e inicia los contenedores y ejecuta las migraciones |
| `pnpm typecheck` | Valida TypeScript |
| `pnpm lint` | Ejecuta ESLint |
| `pnpm lint:fix` | Corrige problemas compatibles |
| `pnpm test` | Ejecuta Jest |
| `pnpm db:generate` | Genera migraciones SQL |
| `pnpm db:migrate` | Aplica migraciones pendientes |
| `pnpm db:seed` | Carga datos iniciales |
| `pnpm db:studio` | Abre Drizzle Studio |

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
