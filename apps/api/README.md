# Pickle API -- Project Overview

## What Is Pickle

Pickle is a web application for streamers (and content creators in general) to maintain personal profile pages that showcase games, movies, series, anime, and YouTube videos they have played or watched, along with their opinions (ratings, comments, statuses). Viewers and followers can **suggest** (order) content for the streamer to play/watch, and the streamer (or their moderators) can **approve** or **reject** those suggestions.

The repository contains a **monolithic REST API** written in **Go 1.24** that serves as the backend for the Pickle web client.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Language | Go 1.24 |
| HTTP Router | [go-chi/chi v5](https://github.com/go-chi/chi) |
| Database (relational) | PostgreSQL 16 (driver: `pgx/v5`, connection pool: `pgxpool`) |
| Database (search) | Elasticsearch 8.17 |
| Cache | Redis 6 (`go-redis/v9`) |
| Object Storage | AWS S3 (SDK v2) |
| Image Processing | imgproxy (external service, HMAC-signed URLs) |
| Authentication | [Ory Kratos](https://www.ory.sh/kratos/) (session-cookie based) |
| Dependency Injection | [Google Wire](https://github.com/google/wire) |
| Logging | [Zap](https://github.com/uber-go/zap) (SugaredLogger) |
| API Docs | Swagger/OpenAPI via [swaggo/swag](https://github.com/swaggo/swag) |
| Validation | [ozzo-validation](https://github.com/go-ozzo/ozzo-validation) |
| Deployment | Docker, Railway (nixpacks) |
| Testing | `testing` + `testify` + `miniredis` (for Redis mocks) |

---


## Brief overview of the pickle infrastructure

Note that this is a first version of the infrastructure, and it will be changed in the future.

![Pickle Infrastructure](./docs/architecture%20v1.png)

## Useful links

- [DEPLOYED DEMO](https://pickle.pw/keelfy)
- [frontend repo](https://github.com/keelfy/pickle-front)
- [Swagger](https://staging.api.pickle.pw/swagger/index.html)
- [figma design](https://www.figma.com/design/2X3MAm8ddAmANWGLQHiP5h/Pickle)
- [tasks board on linear](https://linear.app/rubedo/team/PIC)

## Mise quick start

This project ships with `mise.toml` to manage tool versions and common tasks.

1. Install mise: <https://mise.jdx.dev/getting-started.html>
2. Activate mise in your shell (zsh):
   - `echo 'eval "$(mise activate zsh)"' >> ~/.zshrc`
   - `source ~/.zshrc`
3. Install tools from this repo config:
   - `mise install`
4. Run tasks:
   - Start API locally: `mise run run-dev`
   - SQL migrations up: `mise run migrate-up`
   - SQL migrations down: `mise run migrate-down`
   - Add SQL migration: `mise run add-migration -- <migration_name>`
   - Run Elasticsearch migrations: `mise run es-migrate-up`
   - Add Elasticsearch migration: `mise run add-es-migration -- <migration_name>`

## Elasticsearch migrations

Elasticsearch index migrations are managed by a dedicated one-shot CLI binary (`./migrate`).

- Migration files live in `./db/elasticsearch/migration`
- Create a new migration file: `make es-add-migration name=<migration_name>`
- Run migrations locally (containerized): `make es-migrate-up`
- Production flow: run `./migrate` from the image before starting/restarting API containers

Example deployment sequence:

```bash
docker run --rm --env-file .env ghcr.io/<owner>/monolith:latest ./migrate
docker compose up -d
```

## Short-term goals for the API only (2025-01-21)

1. Implement the same logic as for games for the movies, series, anime, and videos.
2. A complete cache layer for the API, using Redis (only imgproxy URLs cached at the moment).
3. Payment processing for the content orders using Paddle.
4. An option to switch on/off the orders.
5. Support for moderators to help content makers to moderate their content.
6. Integration with the DonationAlerts, DonatePay, Streamlabs and StreamElements (maybe other services too, but these for starters).
7. OpenTelementry to track usage.
8. Rate limiting.

-- That's it for the next couple of months :)

---

## Project Structure

All source code lives under `apps/api/`.

```
apps/api/
├── cmd/                        # Application entry point & Wire injection
│   ├── main.go                 # HTTP server bootstrap, graceful shutdown
│   ├── wire.go                 # Wire dependency graph definition
│   └── wire_gen.go             # Wire-generated code (auto-generated)
├── db/
│   ├── migration/              # PostgreSQL DDL migrations (golang-migrate format)
│   └── elasticsearch/
│       └── migration/          # Elasticsearch index definitions (JSON)
├── docs/                       # Swagger generated docs + this documentation
├── internal/
│   ├── api/                    # Router setup (chi), route mounting, middleware wiring
│   ├── clients/                # External API clients (IGDB, TMDB, Ory)
│   ├── commands/               # Command objects (input DTOs with validation)
│   ├── config/                 # Environment variable accessors
│   ├── domain/                 # Domain models (pure structs + enums, no DB deps)
│   ├── handlers/               # HTTP handlers (controllers)
│   ├── logger/                 # Zap logger factory
│   ├── mapper/                 # Domain <-> DB mapping utilities
│   ├── middleware/              # HTTP middleware (CORS, session, API key, locale, timeout)
│   ├── presenter/              # Domain -> HTTP response mappers
│   ├── schedulers/             # Background job schedulers (IGDB/TMDB sync)
│   ├── services/               # Business logic layer
│   ├── storage/                # Data-access layer (PostgreSQL, Elasticsearch, S3, Redis)
│   │   └── sql/                # Hand-written SQL queries as Go constants
│   ├── transport/
│   │   └── http/
│   │       ├── binders/        # HTTP request -> command binding
│   │       ├── requests/       # Inbound request structs (JSON deserialization)
│   │       └── responses/      # Outbound response structs (JSON serialization)
│   ├── usecases/               # Orchestration layer (cross-service use cases)
│   └── utils/                  # Shared utilities (errors, JWT helpers, localization, REST)
├── local-infra/                # Docker Compose for local dev (Postgres, Redis, ES, Kratos)
├── Dockerfile
├── go.mod / go.sum
├── sqlc.yaml                   # SQLC configuration (code generation)
└── .env.example
```

---

## Architecture Overview

The application follows a **layered architecture**:

```
HTTP Request
    │
    ▼
┌───────────┐
│ Middleware │  CORS, Locale, Session (Ory), API Key, Timeout, RequestID
└─────┬─────┘
      │
      ▼
┌───────────┐
│  Handler  │  Binds request → command, calls use-case/service, presents response
└─────┬─────┘
      │
      ▼
┌───────────┐
│  Use Case │  Orchestrates multiple services within a single business operation
└─────┬─────┘
      │
      ▼
┌───────────┐
│  Service  │  Core business logic, caching, permission checks
└─────┬─────┘
      │
      ▼
┌───────────┐
│  Storage  │  PostgreSQL (SQL), Elasticsearch, Redis, S3
└───────────┘
```

### Request Flow (typical)

1. **Middleware** attaches request ID, locale, and optionally an Ory session to context.
2. **Handler** (controller) uses a **binder** to parse path/query/body into a **command** struct, validates it, then delegates to a **use case** or **service**.
3. **Use case** orchestrates multiple services (e.g., create content note involves permission check, duplicate check, orderer creation, note creation, avatar URL fetching).
4. **Service** implements business rules and calls **storage** for data access.
5. **Presenter** maps domain objects into response DTOs.
6. Handler writes the JSON response.

---

## Authentication & Authorization

### Authentication (Ory Kratos)

- The API uses **Ory Kratos** for identity management (registration, login, session management).
- Authentication is **session-cookie based**. The frontend sends cookies with each request.
- The `SessionMiddleware` extracts the `Cookie` header, calls `oryAPI.GetSession()` to validate it, and places the `ory.Session` object into the request context.
- There are two middleware variants:
  - **Protected** (`optional=false`): returns `401 Unauthorized` if no valid session exists.
  - **Unprotected** (`optional=true`): attaches the session if present but does not block unauthenticated requests. Useful for public endpoints that show extra data for logged-in users.
- The user ID is extracted from the session via `session.Identity.Id` (a UUID).

### Authorization (Permissions)

Three permission levels exist:

| Permission | Who Can Act |
|---|---|
| `anyone` | Any user (authenticated) |
| `moderator` | The resource owner **or** any of the owner's moderators |
| `only_owner` | Only the resource owner |

The `PermissionService` checks these permissions. Most write operations on content notes, orders, and collections require `moderator` permission (owner + moderators).

### API Key Authentication

Webhook and trigger endpoints use a static **API key** passed via the `x-api-key` header, validated against the `API_KEY` environment variable.

---

## Database Schema

### PostgreSQL

The database uses PostgreSQL 16 with the following key tables:

| Table | Purpose |
|---|---|
| `profiles` | User profiles (PK: `user_id` UUID). Fields: `display_name`, `username` (unique), `description`, `links` (JSONB), `suggestion_preferences` (JSONB) |
| `profile_avatars` | User avatars (PK: `user_id`). Fields: `avatar_key`, `avatar_url`, `avatar_preview_key` |
| `followers` | Follow relationships (composite PK: `user_id` + `follower_id`) |
| `orderers` | People who suggest content (PK: `id` UUID). Can be internal Pickle users or external Twitch users |
| `orders` | Content suggestions/orders (PK: `id` UUID). Linked to receiver, orderer, and optionally content |
| `order_decisions` | Approve/reject decisions on orders (PK: `id` UUID). Soft-deletable |
| `game_notes` | User opinions on games (PK: `id` UUID). Fields: status, rate (0-10), comment, `last_played_at` |
| `movie_notes` | User opinions on movies (PK: `id` UUID). Fields: status, rate (0-10), comment, `watched_at` |
| `game_note_reactions` | Emoji reactions on game notes (composite PK: `content_note_id` + `user_id` + `emote_id` + `source`) |
| `movie_note_reactions` | Emoji reactions on movie notes (same composite PK pattern) |
| `games` | Game content catalog (PK: `id` UUID). Synced from IGDB |
| `game_localizations` | Localized game titles (composite PK: `content_id` + `locale`) |
| `movies` | Movie content catalog (PK: `id` UUID). Synced from TMDB |
| `movie_localizations` | Localized movie titles (composite PK: `content_id` + `locale`) |
| `collections` | Named collections of content notes (PK: `id` UUID) |
| `collection_items` | Items in collections (PK: `id` UUID). Links to note, content, and category |
| `moderators` | Moderator relationships (PK: `id` UUID). Soft-deletable |
| `poster_previews` | Temporary poster image previews (PK: `id` UUID) |
| `es_migration_logs` | Tracks applied Elasticsearch migrations |
| `external_sync_logs` | Tracks IGDB/TMDB sync runs |

#### Custom ENUM Types

| Enum | Values |
|---|---|
| `content_category` | `games`, `movies`, `video`, `anime`, `series`, `custom`, `any` |
| `game_note_status` | `planned`, `playing`, `paused`, `dropped`, `finished`, `skipped` |
| `movie_note_status` | `planned`, `dropped`, `watched`, `skipped` |
| `order_decision_status` | `approved`, `rejected` |
| `image_key_type` | `igdb`, `tmdb`, `custom` |
| `reaction_source` | `unicode_emoji`, `7tv`, `custom` |
| `content_source` | `igdb`, `tmdb` |
| `external_sync_status` | `pending`, `in_progress`, `completed`, `failed` |
| `external_sync_type` | `full`, `incremental` |

#### JSONB Structures

**`profiles.suggestion_preferences`:**
```json
{
  "enabled": true,
  "allowedFree": true,
  "allowedAnonymously": true,
  "categories": ["games", "movies"]
}
```

**`profiles.links`** (array of social links):
```json
[
  { "id": "uuid", "name": "Twitter", "url": "https://...", "position": 0 }
]
```

### Elasticsearch

Two indices with identical schema structure:

- **`igdb_games`** -- Indexed game content from IGDB
- **`tmdb_movies`** -- Indexed movie content from TMDB

Fields: `popularity` (float, used for relevance scoring), `image_key` (text, not indexed), `image_key_type` (text, not indexed), `name_en` (English analyzer), `name_ru` (Russian analyzer), `name_de` (German analyzer), `name_es` (Spanish analyzer).

Search uses `function_score` with `field_value_factor` on `popularity` (modifier: `log1p`) combined with `multi_match` across the four locale fields with `fuzziness: AUTO`.

---

## Content Categories

The system supports these content categories, though currently only **games** and **movies** have full implementations:

| Category | Source | Status |
|---|---|---|
| `games` | IGDB (via Twitch API) | Fully implemented |
| `movies` | TMDB | Fully implemented |
| `series` | - | Enum defined, not implemented |
| `anime` | - | Enum defined, not implemented |
| `videos` | - | Enum defined, not implemented |
| `custom` | - | Enum defined, not implemented |

Each category has its own `*_notes` table, `*_note_reactions` table, content table, and localization table. The code uses a polymorphic pattern: shared interfaces (`IContent`, `IContentNote`, `IDetailedContentNote`) with category-specific implementations (`Game`/`Movie`, `DetailedGameNote`/`DetailedMovieNote`).

---

## External Integrations

### IGDB (Internet Game Database)

- **Authentication**: Twitch OAuth2 client credentials grant (`https://id.twitch.tv/oauth2/token`).
- **API**: IGDB API v4 with APICALYPSE query syntax (`https://api.igdb.com/v4/games`).
- **Sync**: Scheduled every 24 hours (incremental) or triggered via `/v1/triggers/igdb-sync`. Fetches games in batches of 500, extracts localized names from `alternative_names`, and indexes into Elasticsearch.
- **Images**: IGDB cover art via `https://images.igdb.com/igdb/image/upload/t_{size}/{image_id}.jpg`.

### TMDB (The Movie Database)

- **Authentication**: API key (Bearer token) via `TMDB_API_KEY`.
- **API**: TMDB REST API v3 (`https://api.themoviedb.org/3`).
- **Sync**: Scheduled every 24 hours (incremental) or triggered via `/v1/triggers/tmdb-sync`. Full sync uses `/discover/movie`, incremental uses `/movie/changes`. Fetches translations for `en`, `ru`, `de`, `es`.
- **Images**: TMDB poster images via configurable `TMDB_IMAGE_BASE_URL`.

### Ory Kratos

- **Purpose**: Identity management (user registration, login, sessions).
- **Integration**: Session validation via `FrontendAPI.ToSession` with cookie forwarding. Identity fetching via `IdentityAPI.GetIdentity`.
- **Webhook**: After registration, Ory calls `POST /v1/webhooks/ory/users` which creates the user profile in Pickle's database.

### AWS S3

- **Purpose**: Avatar and poster image storage.
- **Buckets**: Separate buckets for avatars (`AWS_S3_AVATAR_BUCKET_NAME`) and preview avatars (`AWS_S3_PREVIEW_AVATAR_BUCKET_NAME`).
- **Flow**: Upload to preview bucket -> on profile save, copy to main bucket (move operation).

### imgproxy

- **Purpose**: On-the-fly image resizing.
- **Integration**: Generates HMAC-SHA256 signed URLs pointing to imgproxy, which proxies and resizes images from S3.
- **Sizes**: Avatars (`sm`=32px, `md`=64px, `lg`=128px), Covers (`sm`=108x144, `md`=168x224, `lg`=336x448, `tn_sm`=35x35, `tn_md`=90x90).

---

## Localization

The API supports four locales for content names:

| Code | Language |
|---|---|
| `en` | English (default) |
| `ru` | Russian |
| `de` | German |
| `es` | Spanish |

The locale is determined by:
1. `Accept-Language` header (parsing is currently commented out)
2. `locale` query parameter
3. Falls back to `en`

Localization affects:
- Content titles returned from the database (games/movies have per-locale titles via `*_localizations` tables)
- Elasticsearch search field weighting

---

## Caching Strategy

Redis is used for caching with the following patterns:

| Data | TTL | Key Pattern |
|---|---|---|
| Avatar URLs | 30 days | Per user+size |
| Moderator relationships | 24 hours | Per user pair |
| Follower counts | 12 hours | Per user |
| Collection item counts | Varies | Per collection |
| Content note counts (played/watched) | Varies | Per user+category |

All cached data uses **singleflight** (`golang.org/x/sync/singleflight`) to deduplicate concurrent requests for the same key, preventing cache stampedes.

---

## Real-Time Features

### WebSocket: Order Events

- **Endpoint**: `GET /v1/users/{userId}/orders/ws` (protected)
- **Protocol**: WebSocket (via `gorilla/websocket`)
- **Purpose**: Real-time notification when new orders (suggestions) arrive for a user.
- **Implementation**: In-memory pub/sub broker (`OrdersBrokerService`) with buffered channels (size 5). When an order is created, it is published to all subscribers for that receiver. Non-blocking sends -- if the channel buffer is full, the message is dropped.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | HTTP server port (default: 8080) |
| `DEBUG` | Enable debug logging (`true`/`false`) |
| `CONTEXT_TIMEOUT_MS` | Request timeout in milliseconds |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `ELASTICSEARCH_URLS` | Elasticsearch URLs (semicolon-separated) |
| `ELASTICSEARCH_USERNAME` | Elasticsearch username |
| `ELASTICSEARCH_PASSWORD` | Elasticsearch password |
| `ORY_URL` | Ory Kratos public URL |
| `JWT_SECRET` | JWT secret (used for JWTAuth initialization, not primary auth) |
| `API_KEY` | Static API key for webhook/trigger endpoints |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | AWS region |
| `AWS_S3_AVATAR_BUCKET_NAME` | S3 bucket for avatars |
| `AWS_S3_PREVIEW_AVATAR_BUCKET_NAME` | S3 bucket for avatar previews |
| `IMGPROXY_URL` | imgproxy base URL |
| `IMGPROXY_KEY` | imgproxy signing key (hex) |
| `IMGPROXY_SALT` | imgproxy signing salt (hex) |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins (semicolon-separated) |
| `TWITCH_CLIENT_ID` | Twitch API client ID (for IGDB) |
| `TWITCH_CLIENT_SECRET` | Twitch API client secret (for IGDB) |
| `IGDB_IMAGE_URL_FORMAT` | Format string for IGDB cover images |
| `TMDB_API_KEY` | TMDB API key |
| `TMDB_BASE_URL` | TMDB API base URL |
| `TMDB_IMAGE_BASE_URL` | TMDB image base URL |
| `ORDERER_PICKLE_URL_FORMAT` | Format string for Pickle profile URLs |
| `ORDERER_TWITCH_URL_FORMAT` | Format string for Twitch profile URLs |
| `TZ` | Timezone |

---

## Key Business Concepts

### User / Profile
A user is identified by a UUID (from Ory Kratos identity ID). They have a unique username, display name, description, social links, and suggestion preferences. Users are created automatically via the Ory registration webhook.

### Content Note
A content note is a user's opinion about a piece of content (game or movie). It includes a status (e.g., "playing", "finished", "watched"), an optional rating (0-10), and an optional comment (up to 10,000 chars). Each user can have at most one note per content item.

### Order (Suggestion)
An order is a request from someone (the "orderer") for a user to play/watch a piece of content. Orders have three sources:
- **`pickle-suggestion`**: Created by Pickle users via the web UI
- **`pickle-manual`**: Created manually
- **`twitch-channel-points`**: Created by Twitch viewers via channel point redemptions (external webhook)

Orders can be **approved** (which creates/links a content note) or **rejected**. Each order can only be decided once.

### Orderer
An orderer is the person who created an order. They can be:
- **Internal** (`pickle` source): A Pickle user, linked by `user_id`
- **External** (`twitch` source): A Twitch user, linked by `reference_user_id`

### Collection
A named group of content notes. Users can create multiple collections and add their existing content notes to them.

### Moderator
A user can grant moderator access to other users, allowing them to manage content notes, orders, and collections on their behalf.

### Follower
Users can follow other users. Follower counts are displayed on profiles.

---

## SQL Query Pattern

The project does **not** use an ORM. SQL queries are hand-written as Go string constants in `internal/storage/sql/*.go`. While `sqlc.yaml` is configured, the actual queries use raw SQL with `pgx` directly (not SQLC-generated code). Key patterns:

- Dynamic queries built with `fmt.Sprintf` for table name substitution (polymorphic tables per category)
- Cursor-based pagination with dynamic sort columns/directions
- CTEs for complex aggregations (order counts, windowed queries for collections)
- `COALESCE` for locale fallback (defaults to 'Untitled')
- `INSERT ... ON CONFLICT ... DO UPDATE` for upserts (games, movies, orderers)
- Transactions via `pgxpool.BeginTx` with automatic rollback on error
