# NutriCommunity

Plataforma web para una comunidad de recetas y hábitos de alimentación administrada por un nutriólogo.

> Alcance documentado: backend base, PostgreSQL, migraciones de Drizzle y schemas iniciales.

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
| `backend` | API Express | `http://localhost:8080` |

Dentro de Docker el backend usa `db:5432`. Desde el host se utiliza `localhost:5433`.

## Base de datos y relaciones

Actualmente el esquema de Drizzle contempla 17 tablas. Las claves primarias y foráneas utilizan `uuid`; los valores `smallint` se reservan para cantidades, minutos y ordenamientos.

> La ruta `/health` está disponible en la base inicial. Las rutas restantes forman parte del contrato de los módulos del sistema.

<details>
<summary>Ver tablas y responsabilidades</summary>

| Tabla | Responsabilidad | Relaciones principales |
|---|---|---|
| `users` | Usuarios, credenciales y estado | 1:N con `posts`, `comments`, `reactions`, `audit_logs`; N:N con `roles` y `tags` |
| `roles` | Roles del sistema | N:N con `users` mediante `user_roles` |
| `user_roles` | Asignación de roles | Une `users` con `roles` |
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
  "name": "Ana López",
  "email": "ana@example.com",
  "password": "UnaClaveSegura123!"
}
```

Respuesta `201 Created`:

```json
{
  "user": {
    "id": "uuid",
    "name": "Ana López",
    "email": "ana@example.com",
    "roles": ["participant"]
  },
  "accessToken": "jwt"
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
    "name": "Ana López",
    "email": "ana@example.com",
    "roles": ["participant"]
  },
  "accessToken": "jwt",
  "expiresIn": "30m"
}
```

</details>

<details>
<summary><code>GET /api/auth/me</code> — usuario autenticado</summary>

Acceso: JWT requerido.

Respuesta `200 OK`:

```json
{
  "id": "uuid",
  "name": "Ana López",
  "email": "ana@example.com",
  "roles": ["participant"],
  "status": "active"
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

### Publicaciones

<details>
<summary><code>GET /api/posts</code> — listar publicaciones</summary>

Acceso: público para publicaciones `published`.

Query parameters disponibles:

```text
?content_type=recipe
&goal=weight_loss
&category=post_workout
&condition=diabetes
&exclude_allergen=peanut
&preference=vegan
&ingredient=chicken
&page=1
&limit=20
```

Respuesta `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Bowl de pollo",
      "description": "Receta alta en proteína",
      "status": "published",
      "contentType": {
        "code": "recipe",
        "name": "Receta"
      },
      "author": {
        "id": "uuid",
        "name": "Nutriólogo"
      },
      "tags": [],
      "publishedAt": "2026-11-12T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

</details>

<details>
<summary><code>GET /api/posts/:postId</code> — consultar detalle</summary>

Acceso: público si la publicación está publicada; el autor y el administrador pueden consultar borradores propios o administrados.

Respuesta `200 OK`:

```json
{
  "id": "uuid",
  "title": "Bowl de pollo",
  "description": "Receta alta en proteína",
  "status": "published",
  "contentType": "recipe",
  "author": {
    "id": "uuid",
    "name": "Nutriólogo"
  },
  "recipe": {
    "servings": 2,
    "prepMinutes": 15,
    "cookMinutes": 20,
    "ingredients": [],
    "steps": []
  },
  "nutritionFacts": null,
  "tags": [],
  "reactionCounts": {
    "like": 0,
    "love": 0,
    "amaze": 0
  },
  "commentsCount": 0
}
```

</details>

<details>
<summary><code>POST /api/posts</code> — crear publicación</summary>

Acceso: usuario autenticado.

Request:

```json
{
  "title": "Bowl de pollo",
  "description": "Receta alta en proteína",
  "contentTypeId": "uuid",
  "servings": 2,
  "prepMinutes": 15,
  "cookMinutes": 20,
  "ingredients": [
    {
      "ingredientId": "uuid",
      "quantity": "250.000",
      "unitId": "uuid",
      "notes": "Sin piel",
      "sortOrder": 1
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Cocinar el pollo."
    }
  ],
  "tagIds": ["uuid"]
}
```

La publicación se crea inicialmente con estado `draft`.

Respuesta `201 Created`: devuelve el recurso creado con su `id` y estado `draft`.

</details>

<details>
<summary><code>PATCH /api/posts/:postId</code> — editar publicación</summary>

Acceso: autor o administrador.

El cuerpo admite cualquier subconjunto editable del cuerpo de creación.

```json
{
  "title": "Bowl de pollo y verduras",
  "description": "Descripción actualizada"
}
```

Respuesta `200 OK`: devuelve la publicación actualizada.

Cada modificación registra una entrada `update` en `audit_logs`.

</details>

<details>
<summary><code>POST /api/posts/:postId/publish</code> — publicar</summary>

Acceso: autor o administrador.

El cuerpo de la solicitud es opcional. La operación cambia el estado a `published` y establece `publishedAt`.

Respuesta `200 OK`:

```json
{
  "id": "uuid",
  "status": "published",
  "publishedAt": "2026-11-12T12:00:00.000Z"
}
```

</details>

<details>
<summary><code>DELETE /api/posts/:postId</code> — eliminación lógica</summary>

Acceso: autor o administrador.

La operación aplica eliminación lógica, cambia `status` a `deleted` y registra la acción.

Respuesta `204 No Content`.

</details>

### Catálogos y filtros

<details>
<summary><code>GET /api/content-types</code>, <code>GET /api/tags</code>, <code>GET /api/ingredients</code>, <code>GET /api/units</code></summary>

Acceso: usuario autenticado para catálogos administrativos; lectura pública para catálogos activos usados en filtros.

Ejemplo de respuesta:

```json
{
  "data": [
    {
      "id": "uuid",
      "code": "weight_loss",
      "name": "Pérdida de peso",
      "type": "goal",
      "status": "active"
    }
  ]
}
```

La administración de tags se realiza desde el backend. Los participantes seleccionan tags existentes.

</details>

<details>
<summary><code>POST /api/tags</code>, <code>PATCH /api/tags/:tagId</code>, <code>DELETE /api/tags/:tagId</code></summary>

Acceso: administrador/nutriólogo.

Request de creación:

```json
{
  "type": "allergen",
  "code": "peanut",
  "name": "Cacahuate"
}
```

`DELETE` desactiva el tag (`inactive`) cuando existen relaciones históricas, en lugar de eliminarlo físicamente.

</details>

### Reacciones

<details>
<summary><code>PUT /api/posts/:postId/reaction</code> — crear o actualizar reacción</summary>

Acceso: usuario autenticado.

Request:

```json
{
  "type": "love"
}
```

Respuesta `200 OK`:

```json
{
  "postId": "uuid",
  "userId": "uuid",
  "type": "love"
}
```

Al seleccionar el mismo tipo nuevamente, la reacción puede eliminarse.

</details>

<details>
<summary><code>DELETE /api/posts/:postId/reaction</code> — eliminar reacción</summary>

Acceso: usuario autenticado.

Respuesta `204 No Content`.

</details>

### Comentarios

<details>
<summary><code>GET /api/posts/:postId/comments</code> — listar comentarios</summary>

Acceso: público si la publicación está publicada.

Respuesta `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "body": "La receta quedó muy bien.",
      "author": {
        "id": "uuid",
        "name": "Ana López"
      },
      "createdAt": "2026-11-12T12:00:00.000Z"
    }
  ]
}
```

</details>

<details>
<summary><code>POST /api/posts/:postId/comments</code> — crear comentario</summary>

Acceso: usuario autenticado.

Request:

```json
{
  "body": "La receta quedó muy bien."
}
```

Respuesta `201 Created`: devuelve el comentario con su autor y fecha.

</details>

<details>
<summary><code>DELETE /api/comments/:commentId</code> — eliminar comentario</summary>

Acceso: autor del comentario o administrador.

La operación aplica eliminación lógica mediante `status = deleted`.

Respuesta `204 No Content`.

</details>

### Preferencias del usuario

<details>
<summary><code>PUT /api/me/preferences</code> — guardar preferencias</summary>

Acceso: usuario autenticado.

Request:

```json
{
  "preferences": [
    {
      "tagId": "uuid",
      "mode": "exclude"
    },
    {
      "tagId": "uuid",
      "mode": "prefer"
    }
  ]
}
```

Las alergias utilizan `exclude` y se excluyen automáticamente en las consultas de publicaciones.

</details>

### Administración y dashboard

<details>
<summary><code>GET /api/admin/dashboard</code> — métricas administrativas</summary>

Acceso: administrador/nutriólogo.

Respuesta `200 OK`:

```json
{
  "participants": 24,
  "posts": {
    "total": 42,
    "published": 36,
    "draft": 4,
    "archived": 2
  },
  "activity": {
    "comments": 120,
    "reactions": 310
  }
}
```

</details>

<details>
<summary><code>GET /api/admin/users</code>, <code>PATCH /api/admin/users/:userId/status</code></summary>

Acceso: administrador/nutriólogo.

Request para cambiar estado:

```json
{
  "status": "suspended"
}
```

Respuesta: usuario actualizado sin incluir `passwordHash`.

</details>

## Herramientas

- Node.js y TypeScript.
- Express 5.
- pnpm.
- PostgreSQL 16.
- Drizzle ORM y Drizzle Kit.
- JWT y bcrypt.
- Zod, Helmet, CORS y rate limiting.
- ESLint con Standard.
- Jest y Supertest.
- Docker Engine y Docker Compose V2.
- DBeaver, opcional para inspeccionar PostgreSQL.

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
JWT_EXPIRES_IN=30m
FRONTEND_URL=http://localhost:5173
```

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
├── Dockerfile
├── docker-compose.yml
├── drizzle.config.ts
├── eslint.config.js
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── src/
│   ├── db/
│   │   ├── index.ts
│   │   ├── migrations/
│   │   ├── schema/
│   │   └── seed.ts
│   └── server.ts
└── tsconfig.json
```
