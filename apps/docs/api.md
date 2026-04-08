# Pickle API -- Endpoint Reference

**Base URL:** `/v1`
**Content-Type:** `application/json` (unless otherwise noted)

---

## Table of Contents

- [Authentication](#authentication)
- [Common Patterns](#common-patterns)
- [Health](#health)
- [Webhooks](#webhooks)
- [Triggers](#triggers)
- [Profiles](#profiles)
- [Users](#users)
- [Followers](#followers)
- [Content](#content)
- [Content Notes](#content-notes)
- [Content Note Reactions](#content-note-reactions)
- [Orders](#orders)
- [Order Events (WebSocket)](#order-events-websocket)
- [Collections](#collections)
- [Moderators](#moderators)
- [Poster Previews](#poster-previews)
- [Response Schemas](#response-schemas)

---

## Authentication

### Session-Based (Ory Kratos)

Most endpoints use Ory Kratos session cookies. The client sends the session cookie with each request. The server validates the session by calling the Ory Kratos `toSession` API.

- **Protected routes**: Require a valid session. Return `401 Unauthorized` if no valid session.
- **Unprotected routes**: Optionally accept a session. If present, the authenticated user's context is available (e.g., "is following", "is moderator").

In the endpoint tables below:
- **Auth: Required** = Protected route (401 if no session)
- **Auth: Optional** = Unprotected route (session used if present)
- **Auth: None** = No session middleware applied

### API Key

Webhook and trigger endpoints require the `x-api-key` header matching the `API_KEY` environment variable. Returns `403 Forbidden` if invalid.

---

## Common Patterns

### Path Parameters

All UUIDs in paths are standard UUID v4 format.

| Param | Type | Description |
|---|---|---|
| `{userId}` | UUID | User ID |
| `{username}` | string | Username (3-50 chars, alphanumeric + `-_`) |
| `{category}` | string | Content category: `games`, `movies`, `series`, `anime`, `videos` |
| `{contentNoteId}` | UUID | Content note ID |
| `{contentId}` | UUID | Content ID |
| `{orderId}` | UUID | Order ID |
| `{collectionId}` | UUID | Collection ID |
| `{itemId}` | UUID | Collection item ID |
| `{moderatorId}` | UUID | Moderator user ID |
| `{previewId}` | UUID | Poster preview ID |

### Common Query Parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `avatarSize` | string | `md` | Avatar image size: `sm` (32px), `md` (64px), `lg` (128px) |
| `coverSize` | string | `md` | Cover image size: `sm` (108x144), `md` (168x224), `lg` (336x448), `tn_sm` (35x35), `tn_md` (90x90) |
| `locale` | string | `en` | Content language: `en`, `ru`, `de`, `es` |

### Pagination (Page-Based)

Used by search and list endpoints.

| Param | Type | Default | Max | Description |
|---|---|---|---|---|
| `page` | int | `0` | - | Zero-indexed page number |
| `size` | int | `20` | `100` | Items per page |

**Response shape:**
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalPages": 5,
  "totalElements": 100
}
```

### Cursor-Based Pagination

Used by sorted content notes and orders.

| Param | Type | Description |
|---|---|---|
| `cursor` | string | Cursor value from previous response (type depends on sort column) |
| `limit` | int | Number of items to fetch |
| `column` | string | Column to sort by (endpoint-specific) |
| `direction` | string | `asc` or `desc` |

Cursor types vary by column: `int`, `float`, `datetime` (RFC 3339), or `string`.

**Response shape:**
```json
{
  "content": [...],
  "totalElements": 100
}
```

### Filters

Some endpoints accept a `filters` query parameter with comma-separated `key:value` pairs.

Example: `?filters=status:approved,category:games`

### Error Responses

Errors are returned as plain text with the appropriate HTTP status code.

| Status | Meaning |
|---|---|
| `400` | Bad Request (validation failure, business rule violation) |
| `401` | Unauthorized (no valid session) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (duplicate resource) |
| `500` | Internal Server Error |

---

## Health

### `GET /v1/health`

**Auth:** None

Health check endpoint. Tests connectivity to all backing services.

**Response `200`:**
```json
{
  "api": "ok",
  "database": "ok",
  "storage": "ok",
  "search": "ok",
  "cache": "ok",
  "authentication": "ok"
}
```

Each field is either `"ok"` or an error message string.

---

## Webhooks

All webhook endpoints require the `x-api-key` header.

### `POST /v1/webhooks/ory/users`

**Auth:** API Key

Called by Ory Kratos after user registration. Creates the user profile in Pickle's database.

**Request Body:**
```json
{
  "identityId": "uuid-string",
  "traits": {
    "email": "user@example.com",
    "username": "optional-username",
    "avatar_url": "optional-avatar-url"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `identityId` | string (UUID) | Yes | Ory Kratos identity ID |
| `traits.email` | string (email) | Yes | User's email |
| `traits.username` | string | No | Preferred username (will be validated/generated) |
| `traits.avatar_url` | string | No | External avatar URL to download |

**Behavior:**
- If `username` is not provided or invalid, a username is auto-generated from the email prefix or a random petname.
- If `avatar_url` is provided, the image is downloaded, validated, and uploaded to S3.
- Creates the profile, avatar record, suggestion preferences (default: enabled, all categories), and an internal orderer.

**Response:** `200 OK` (empty body)

### `POST /v1/webhooks/orders/{userId}`

**Auth:** API Key

Creates an order (suggestion) from an external source (e.g., Twitch channel points).

**Path Parameters:** `{userId}` -- the receiver's user ID.

**Request Body:**
```json
{
  "isAnonymously": false,
  "category": "games",
  "contentId": "uuid-or-null",
  "message": "Please play this game!",
  "source": "twitch-channel-points",
  "ordererUsername": "twitch_viewer_name",
  "reference": "optional-json-string",
  "referenceUserId": "optional-external-user-id",
  "idempotencyKey": "unique-key-for-dedup"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `isAnonymously` | bool | Yes | Whether the orderer is anonymous |
| `category` | string | Yes | Content category |
| `contentId` | UUID | No | Specific content to suggest (null for open suggestion) |
| `message` | string | Yes | Message from orderer (max 250 chars) |
| `source` | string | Yes | `pickle-manual`, `pickle-suggestion`, or `twitch-channel-points` |
| `ordererUsername` | string | Yes | Display name of the orderer |
| `reference` | string | No | JSON reference data |
| `referenceUserId` | string | No | External user ID (e.g., Twitch user ID) |
| `idempotencyKey` | string | Yes | Idempotency key to prevent duplicate orders |

**Response:** `200 OK` (empty body)

---

## Triggers

All trigger endpoints require the `x-api-key` header.

### `POST /v1/triggers/igdb-sync`

**Auth:** API Key

Manually triggers a game sync from IGDB. Accepts a `type` query parameter: `full` or `incremental` (defaults to `full`).

**Response:** `200 OK` (empty body, sync runs asynchronously)

### `POST /v1/triggers/tmdb-sync`

**Auth:** API Key

Manually triggers a movie sync from TMDB. Same `type` query parameter as IGDB sync.

**Response:** `200 OK` (empty body, sync runs asynchronously)

---

## Profiles

### `GET /v1/profiles/{username}`

**Auth:** Optional (session used for context if present)

Fetches a user's full public profile by username. Concurrently loads profile counts, avatar, and user context.

**Path Parameters:** `{username}` -- the user's username.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `avatarSize` | string | `md` | Avatar size |

**Response `200`:**
```json
{
  "id": "uuid",
  "displayName": "John",
  "avatarUrl": "https://...",
  "username": "john",
  "description": "I stream games",
  "suggestionPreferences": {
    "enabled": true,
    "allowedFree": true,
    "allowedAnonymously": true,
    "categories": ["games", "movies"]
  },
  "socialLinks": [
    {
      "id": "uuid",
      "name": "Twitter",
      "url": "https://twitter.com/john",
      "position": 0
    }
  ],
  "context": {
    "isFollowing": false,
    "isAuthorized": true,
    "isModerator": false
  },
  "createdAt": "2025-01-15T10:30:00Z",
  "counts": {
    "played": 42,
    "watched": 15,
    "ordered": 100,
    "followers": 500
  }
}
```

The `context` field depends on the authenticated user:
- `isFollowing`: Whether the authenticated user follows this profile
- `isAuthorized`: Whether the authenticated user is the profile owner
- `isModerator`: Whether the authenticated user is a moderator of this profile

---

## Users

### `GET /v1/users/validate-username`

**Auth:** None

Validates a username for availability and format rules.

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `username` | string | Yes | Username to validate |

**Validation Rules:**
- Length: 3-50 characters
- Allowed characters: alphanumeric, `-`, `_`
- Must not be in the restricted words list
- Must be unique

**Response `200`:**
```json
{
  "valid": true,
  "message": "Username is available"
}
```

Or:
```json
{
  "valid": false,
  "message": "Username is already taken"
}
```

### `GET /v1/users/me`

**Auth:** Required

Returns the authenticated user's full profile (same shape as `GET /v1/users/{userId}`).

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `avatarSize` | string | `md` | Avatar size |

**Response `200`:** See [DetailedUser schema](#detaileduser).

### `PATCH /v1/users/me`

**Auth:** Required

Updates the authenticated user's profile. Also confirms any pending avatar preview (moves from preview bucket to final bucket) and updates the orderer display name if changed.

**Request Body:**
```json
{
  "displayName": "New Name",
  "username": "new-username",
  "description": "Updated description",
  "socialLinks": [
    {
      "id": "uuid",
      "name": "Twitter",
      "url": "https://twitter.com/me",
      "position": 0
    }
  ],
  "suggestionPreferences": {
    "enabled": true,
    "allowedFree": true,
    "allowedAnonymously": false,
    "categories": ["games", "movies"]
  }
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `displayName` | string | Yes | 1-100 chars |
| `username` | string | Yes | 3-50 chars, alphanumeric + `-_` |
| `description` | string | No | 0-1000 chars |
| `socialLinks` | array | No | Max 10 links. Each: name 1-50, URL 1-255 (valid URL) |
| `suggestionPreferences.enabled` | bool | Yes | - |
| `suggestionPreferences.allowedFree` | bool | Yes | - |
| `suggestionPreferences.allowedAnonymously` | bool | Yes | - |
| `suggestionPreferences.categories` | string[] | Yes | Valid content categories |

**Response:** `200 OK` (empty body)

### `GET /v1/users/{userId}`

**Auth:** None

Returns a user's public profile.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `avatarSize` | string | `md` | Avatar size |

**Response `200`:** See [DetailedUser schema](#detaileduser).

### `GET /v1/users/{userId}/avatar`

**Auth:** None

Returns the avatar URL for a user.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `avatarSize` | string | `md` | Avatar size |

**Response `200`:**
```json
{
  "url": "https://imgproxy.example.com/..."
}
```

### `GET /v1/users/me/avatar`

**Auth:** Required

Returns the authenticated user's avatar URL.

**Query Parameters:** Same as `GET /v1/users/{userId}/avatar`.

**Response `200`:** Same as above.

### `POST /v1/users/me/avatar`

**Auth:** Required

Uploads a new avatar image as a preview. The avatar is not finalized until the user saves their profile (`PATCH /v1/users/me`).

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | Yes | Image file (JPEG, PNG, GIF, WebP, BMP) |

**Validation:**
- Accepted MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/bmp`
- Max file size: configurable via `MAX_FILE_SIZE_MB` (default: 5 MB)

**Response `200`:**
```json
{
  "url": "https://imgproxy.example.com/preview/..."
}
```

---

## Followers

### `POST /v1/users/{userId}/follows`

**Auth:** Required

Follow a user.

**Path Parameters:** `{userId}` -- the user to follow.

**Response:** `200 OK` (empty body)

### `DELETE /v1/users/{userId}/follows`

**Auth:** Required

Unfollow a user.

**Path Parameters:** `{userId}` -- the user to unfollow.

**Response:** `200 OK` (empty body)

---

## Content

Content items are games and movies synced from external sources (IGDB, TMDB).

### `GET /v1/content/{category}`

**Auth:** None

Search content by name. Uses Elasticsearch with fuzzy matching and popularity-weighted scoring.

**Path Parameters:** `{category}` -- `games` or `movies`.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | string | Yes | - | Search query (1-200 chars) |
| `userId` | UUID | Yes | - | User ID (used for noting which items the user already has notes for) |
| `page` | int | No | `0` | Page number |
| `size` | int | No | `20` | Items per page (max 100) |
| `coverSize` | string | No | `md` | Cover image size |

**Response `200`:**
```json
{
  "content": [
    {
      "id": "uuid",
      "title": "The Witcher 3",
      "coverUrl": "https://...",
      "category": "games",
      "releaseDate": "2015-05-19T00:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalElements": 5
}
```

Content items are polymorphic -- games and movies both include `releaseDate`. The `title` is resolved based on the request locale.

### `GET /v1/content/{category}/{contentId}`

**Auth:** None

Get detailed content by ID.

**Path Parameters:** `{category}`, `{contentId}`.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `coverSize` | string | `md` | Cover image size |

**Response `200`:**
```json
{
  "id": "uuid",
  "title": "The Witcher 3",
  "coverUrl": "https://...",
  "category": "games",
  "releaseDate": "2015-05-19T00:00:00Z",
  "sourceUrl": "https://www.igdb.com/games/the-witcher-3",
  "sourceType": "igdb",
  "websites": [
    {
      "trusted": true,
      "url": "https://store.steampowered.com/app/292030",
      "type": "steam"
    }
  ]
}
```

### `GET /v1/users/{userId}/content`

**Auth:** None

Search content across all categories that a user has notes for. Uses Elasticsearch with filtering by the user's noted content IDs.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | string | No | - | Search query (0-200 chars; empty returns all) |
| `page` | int | No | `0` | Page number |
| `size` | int | No | `20` | Items per page |
| `coverSize` | string | No | `md` | Cover image size |

**Response `200`:**
```json
{
  "content": [
    {
      "id": "uuid",
      "title": "The Witcher 3",
      "coverUrl": "https://...",
      "category": "games",
      "noteId": "uuid"
    }
  ],
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalElements": 3
}
```

Each item includes `noteId` -- the ID of the user's content note for that content.

---

## Content Notes

Content notes represent a user's opinion on a piece of content. They are polymorphic -- game notes have `status` and `lastPlayedAt`, movie notes have `status` and `watchedAt`.

### `POST /v1/users/{userId}/content-notes/{category}`

**Auth:** Required

Create a new content note for a piece of content. Permission: `moderator` (owner or moderators can create).

**Path Parameters:** `{userId}`, `{category}`.

**Request Body (games):**
```json
{
  "contentId": "uuid",
  "status": "playing",
  "rate": 8,
  "comment": "Great game so far!",
  "lastPlayedAt": "2025-01-15T10:30:00Z"
}
```

**Request Body (movies):**
```json
{
  "contentId": "uuid",
  "status": "watched",
  "rate": 9,
  "comment": "Amazing movie",
  "watchedAt": "2025-01-15T10:30:00Z"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `contentId` | UUID | Yes | Must exist in the content catalog |
| `status` | string | Yes | Games: `planned`, `playing`, `paused`, `dropped`, `finished`, `skipped`. Movies: `planned`, `dropped`, `watched`, `skipped` |
| `rate` | int16 | No | 0-10 (null = no rating) |
| `comment` | string | No | 0-10,000 chars |
| `lastPlayedAt` | datetime | No | Games only. RFC 3339 |
| `watchedAt` | datetime | No | Movies only. RFC 3339 |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `coverSize` | string | `md` | Cover image size |
| `avatarSize` | string | `md` | Initial orderer avatar size |

**Business Rules:**
- A user can only have one note per content item per category. Returns error if duplicate.
- The authenticated user is recorded as the initial orderer.

**Response `200`:** See [DetailedContentNote schema](#detailedcontentnote) (polymorphic: `DetailedGameNote` or `DetailedMovieNote`).

### `GET /v1/users/{userId}/content-notes/{category}`

**Auth:** None

Get a user's content notes with cursor-based pagination and filtering.

**Path Parameters:** `{userId}`, `{category}`.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | varies | - | Cursor value for pagination |
| `limit` | int | `20` | Items per page |
| `column` | string | `created_at` | Sort column: `created_at`, `updated_at`, `rate`, `status`, `title` |
| `direction` | string | `desc` | `asc` or `desc` |
| `filters` | string | - | Comma-separated `key:value` pairs. Supported: `status:{value}`, `requester:{userId}` |
| `coverSize` | string | `md` | Cover image size |
| `avatarSize` | string | `md` | Initial orderer avatar size |

**Response `200`:**
```json
{
  "content": [
    {
      "id": "uuid",
      "userId": "uuid",
      "createdAt": "2025-01-15T10:30:00Z",
      "rate": 8,
      "comment": "Great!",
      "status": "playing",
      "ordererCount": 3,
      "initialOrderer": {
        "id": "uuid",
        "userId": "uuid",
        "displayName": "John",
        "source": "pickle",
        "avatarUrl": "https://...",
        "url": "https://pickle.pw/john"
      },
      "content": {
        "id": "uuid",
        "title": "The Witcher 3",
        "coverUrl": "https://...",
        "category": "games",
        "releaseDate": "2015-05-19T00:00:00Z"
      },
      "lastPlayedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "totalElements": 42
}
```

### `GET /v1/content-notes/{category}/{contentNoteId}`

**Auth:** None

Get a single detailed content note by ID.

**Path Parameters:** `{category}`, `{contentNoteId}`.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `coverSize` | string | `md` | Cover size |
| `avatarSize` | string | `md` | Initial orderer avatar size |

**Response `200`:** See [DetailedContentNote schema](#detailedcontentnote).

### `GET /v1/users/{userId}/content-notes/{category}/by-content-id/{contentId}`

**Auth:** None

Get a content note by content ID (instead of note ID) for a specific user.

**Path Parameters:** `{userId}`, `{category}`, `{contentId}`.

**Response `200`:** Returns the content note (basic `ContentNote` shape with nested content).

### `PATCH /v1/content-notes/{category}/{contentNoteId}`

**Auth:** Required

Update a content note. Permission: `moderator` (owner or moderators).

**Path Parameters:** `{category}`, `{contentNoteId}`.

**Request Body:** Same fields as create (without `contentId`). Only `status`, `rate`, `comment`, `lastPlayedAt`/`watchedAt` can be updated.

**Response:** `200 OK` (empty body)

### `DELETE /v1/content-notes/{category}/{contentNoteId}`

**Auth:** Required

Delete a content note. Permission: `moderator` (owner or moderators).

**Path Parameters:** `{category}`, `{contentNoteId}`.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `resetApprovedOrders` | bool | `false` | If true, cancels (soft-deletes) any order decisions linked to this note |

**Response:** `200 OK` (empty body)

### `GET /v1/content-notes/{category}/{contentNoteId}/orders`

**Auth:** None

Get orders (suggestions) linked to a specific content note, paginated.

**Path Parameters:** `{category}`, `{contentNoteId}`.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | `0` | Page number |
| `size` | int | `20` | Items per page |
| `avatarSize` | string | `md` | Orderer avatar size |

**Response `200`:**
```json
{
  "content": [
    {
      "id": "uuid",
      "createdAt": "2025-01-15T10:30:00Z",
      "source": "pickle-suggestion",
      "anonymous": false,
      "orderer": {
        "id": "uuid",
        "userId": "uuid",
        "displayName": "Viewer123",
        "source": "pickle",
        "avatarUrl": "https://...",
        "url": "https://pickle.pw/viewer123"
      }
    }
  ],
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalElements": 3
}
```

---

## Content Note Reactions

Emoji reactions on content notes. Maximum 3 reactions per user per content note.

### `GET /v1/users/{userId}/content-notes/{category}/reactions`

**Auth:** Optional (if session present, `userReacted` reflects the authenticated user)

Get reactions for multiple content notes in batch.

**Path Parameters:** `{userId}`, `{category}`.

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `contentNoteIds` | string | Yes | Comma-separated UUIDs |

**Response `200`:**
```json
[
  {
    "contentNoteId": "uuid",
    "reactions": [
      {
        "emoteId": "thumbsup",
        "source": "unicode_emoji",
        "count": 5,
        "userReacted": true
      }
    ]
  }
]
```

### `POST /v1/content-notes/{category}/{contentNoteId}/reactions`

**Auth:** Required

Add a reaction to a content note.

**Path Parameters:** `{category}`, `{contentNoteId}`.

**Request Body:**
```json
{
  "emoteId": "thumbsup",
  "source": "unicode_emoji"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `emoteId` | string | Yes | 1-50 chars |
| `source` | string | Yes | 1-16 chars. Values: `unicode_emoji`, `custom` |

**Business Rules:**
- Maximum 3 reactions per user per content note. Returns error if limit exceeded.

**Response:** `200 OK` (empty body)

### `DELETE /v1/content-notes/{category}/{contentNoteId}/reactions`

**Auth:** Required

Remove a reaction from a content note.

**Path Parameters:** `{category}`, `{contentNoteId}`.

**Request Body:**
```json
{
  "emoteId": "thumbsup",
  "source": "unicode_emoji"
}
```

**Response:** `200 OK` (empty body)

---

## Orders

Orders are content suggestions from viewers/followers to streamers.

### `GET /v1/users/{userId}/orders`

**Auth:** None

Get sorted orders for a user with cursor-based pagination and filtering.

**Path Parameters:** `{userId}`.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | varies | - | Cursor value |
| `limit` | int | `20` | Items per page |
| `column` | string | `created_at` | Sort column |
| `direction` | string | `desc` | `asc` or `desc` |
| `filters` | string | - | Comma-separated `key:value`. Supported filters: `status` (`approved`/`rejected`/`pending`), `category`, `requester` (user ID), `source` |
| `avatarSize` | string | `md` | Avatar size |
| `coverSize` | string | `md` | Cover size |

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "createdAt": "2025-01-15T10:30:00Z",
    "source": "pickle-suggestion",
    "anonymous": false,
    "orderer": {
      "id": "uuid",
      "userId": "uuid",
      "displayName": "Viewer",
      "source": "pickle",
      "avatarUrl": "https://...",
      "url": "https://pickle.pw/viewer"
    },
    "category": "games",
    "content": {
      "id": "uuid",
      "title": "Elden Ring",
      "coverUrl": "https://...",
      "category": "games"
    },
    "message": "Please play this!",
    "decision": {
      "contentNote": {
        "id": "uuid",
        "userId": "uuid"
      },
      "decidedAt": "2025-01-16T12:00:00Z",
      "decidedBy": {
        "id": "uuid",
        "displayName": "Streamer",
        "avatarUrl": "https://...",
        "username": "streamer"
      },
      "status": "approved"
    }
  }
]
```

Note: This endpoint returns an **array** (not paginated wrapper), since it uses cursor-based pagination. The `decision` field is `null` if the order has not been decided yet.

### `GET /v1/users/{userId}/orders/{orderId}`

**Auth:** Required

Get a single order by ID.

**Path Parameters:** `{userId}`, `{orderId}`.

**Response `200`:** See [OrderWithDecision schema](#orderwith-decision). Returns the detailed order with orderer info and content.

### `POST /v1/users/{userId}/orders/suggest`

**Auth:** Required

Create a suggestion order from the authenticated Pickle user.

**Path Parameters:** `{userId}` -- the receiver (streamer).

**Request Body:**
```json
{
  "isAnonymously": false,
  "category": "games",
  "contentId": "uuid-or-null",
  "message": "You should play this!"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `isAnonymously` | bool | Yes | - |
| `category` | string | Yes | Valid content category |
| `contentId` | UUID | No | Must exist if provided |
| `message` | string | Yes | 0-250 chars |

**Business Rules:**
- The receiver's `suggestionPreferences.enabled` must be `true`.
- If `isAnonymously` is `true`, `suggestionPreferences.allowedAnonymously` must be `true`.
- The `category` must be in the receiver's `suggestionPreferences.categories`.
- If `contentId` is provided, the content must exist in the catalog.
- The authenticated user becomes the orderer (source: `pickle`, type: `pickle-suggestion`).

**Response:** `200 OK` (empty body)

### `POST /v1/users/{userId}/orders/{orderId}/approve`

**Auth:** Required

Approve an order (suggestion). Permission: `moderator` (owner or moderators of the receiver).

**Path Parameters:** `{userId}`, `{orderId}`.

**Request Body:**
```json
{
  "category": "games",
  "contentId": "uuid"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `category` | string | Yes | Content category |
| `contentId` | UUID | Yes | Content ID to approve for |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `coverSize` | string | - | Cover image size |
| `avatarSize` | string | - | Avatar size |

**Business Rules:**
- Order must not already have a decision.
- If no content note exists for the content, one is automatically created (with the original orderer as the initial orderer).
- If a content note already exists, the order decision is linked to it.
- Creates an `approved` order decision in a transaction.

**Response `200`:** See [OrderWithDecision schema](#orderwith-decision).

### `POST /v1/users/{userId}/orders/{orderId}/reject`

**Auth:** Required

Reject an order (suggestion). Permission: `moderator` (owner or moderators of the receiver).

**Path Parameters:** `{userId}`, `{orderId}`.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `avatarSize` | string | - | Avatar size |

**Business Rules:**
- Order must not already have a decision.

**Response `200`:** See [OrderWithDecision schema](#orderwith-decision).

---

## Order Events (WebSocket)

### `GET /v1/users/{userId}/orders/ws`

**Auth:** Required

WebSocket endpoint for real-time order notifications. When a new order is created for the specified user, it is pushed to all connected WebSocket clients.

**Protocol:** WebSocket (upgrade from HTTP)

**Behavior:**
- On connect, subscribes to the in-memory order broker for the user.
- Receives order events as JSON messages.
- Ping/pong heartbeat with 60-second intervals.
- Write deadline: 10 seconds.
- On disconnect, unsubscribes from the broker.

**Message format (server -> client):**
```json
{
  "id": "uuid",
  "createdAt": "2025-01-15T10:30:00Z",
  "source": "pickle-suggestion",
  "anonymous": false,
  "orderer": { ... },
  "category": "games",
  "content": { ... },
  "message": "Please play this!"
}
```

---

## Collections

Named groups of content notes belonging to a user.

### `GET /v1/users/{userId}/collections`

**Auth:** None

Get all collections for a user.

**Path Parameters:** `{userId}`.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "createdAt": "2025-01-15T10:30:00Z",
    "name": "Favorites"
  }
]
```

### `POST /v1/users/{userId}/collections`

**Auth:** Required

Create a new collection. Permission: `moderator`.

**Path Parameters:** `{userId}`.

**Request Body:**
```json
{
  "name": "My Favorites"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | Yes | 1-100 chars |

**Response `200`:** Returns the created [Collection](#collection) object.

### `GET /v1/collections/{collectionId}`

**Auth:** None

Get a collection by ID.

**Response `200`:** Returns a [Collection](#collection) object.

### `PATCH /v1/collections/{collectionId}`

**Auth:** Required

Update a collection's name. Permission: `moderator` (of the collection owner).

**Request Body:**
```json
{
  "name": "Updated Name"
}
```

**Response:** `200 OK` (empty body)

### `DELETE /v1/collections/{collectionId}`

**Auth:** Required

Delete a collection and all its items. Permission: `moderator` (of the collection owner). Runs in a transaction.

**Response:** `200 OK` (empty body)

### `GET /v1/collections/{collectionId}/items`

**Auth:** None

Get items in a collection (paginated).

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | `0` | Page number |
| `size` | int | `20` | Items per page |
| `coverSize` | string | `md` | Cover image size |

**Response `200`:**
```json
{
  "content": [
    {
      "id": "uuid",
      "createdAt": "2025-01-15T10:30:00Z",
      "collectionId": "uuid",
      "content": {
        "id": "uuid",
        "title": "The Witcher 3",
        "coverUrl": "https://...",
        "category": "games"
      }
    }
  ],
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalElements": 5
}
```

### `POST /v1/users/{userId}/collections/{collectionId}/items`

**Auth:** Required

Add a content note to a collection. Permission: `moderator`.

**Request Body:**
```json
{
  "itemId": "uuid",
  "category": "games"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `itemId` | UUID | Yes | The content note ID to add |
| `category` | string | Yes | Content category of the note |

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `coverSize` | string | `md` | Cover image size |

**Response `200`:** Returns the created [CollectionItem](#collectionitem) object.

### `DELETE /v1/collections/{collectionId}/items/{itemId}`

**Auth:** Required

Remove an item from a collection. Permission: `moderator`.

**Response:** `200 OK` (empty body)

### `GET /v1/users/{userId}/collections/items`

**Auth:** None

Get all collection items for a user across all collections (paginated). Uses a CTE with `ROW_NUMBER` windowing to limit items per collection.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | `0` | Page number |
| `size` | int | `20` | Items per page |
| `coverSize` | string | `md` | Cover image size |

**Response `200`:** Returns an array of `BatchCollectionItems`, each containing a `collectionId` and paginated items.

---

## Moderators

### `POST /v1/users/{userId}/moderators`

**Auth:** Required

Add a moderator to the authenticated user's profile. Permission: `only_owner`.

**Path Parameters:** `{userId}`.

**Request Body:**
```json
{
  "username": "moderator_username"
}
```

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `avatarSize` | string | `md` | Avatar size |

**Business Rules:**
- The moderator must be a valid user.
- Cannot add yourself as a moderator.
- If the moderator was previously soft-deleted, the record is reverted instead of creating a new one.

**Response `200`:** Returns a [Moderator](#moderator) object.

### `GET /v1/users/{userId}/moderators`

**Auth:** Required

Get all moderators for a user.

**Path Parameters:** `{userId}`.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `avatarSize` | string | `md` | Avatar size |

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "moderatorUserId": "uuid",
    "addedAt": "2025-01-15T10:30:00Z",
    "username": "mod_user",
    "displayName": "Mod User",
    "avatarUrl": "https://..."
  }
]
```

### `DELETE /v1/users/{userId}/moderators/{moderatorId}`

**Auth:** Required

Remove a moderator. Permission: `only_owner`. Soft-deletes the moderator record and invalidates the cache.

**Path Parameters:** `{userId}`, `{moderatorId}` (the moderator's user ID).

**Response:** `200 OK` (empty body)

---

## Poster Previews

Temporary poster image previews that can be uploaded before being assigned to content notes.

### `GET /v1/users/{userId}/posters/previews`

**Auth:** Required

Get all poster previews for the authenticated user.

**Response `200`:**
```json
[
  {
    "previewId": "uuid",
    "createdAt": "2025-01-15T10:30:00Z",
    "url": "https://..."
  }
]
```

### `POST /v1/users/{userId}/posters/previews`

**Auth:** Required

Upload a poster preview image.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | Yes | Image file |

**Business Rules:**
- Maximum 5 active previews per user.
- Old previews (older than configurable time, default 24h) are cleaned up.

**Response `200`:** Returns the created [CoverPreview](#coverpreview) object.

### `GET /v1/users/{userId}/posters/previews/{previewId}/image`

**Auth:** Required

Get the image URL for a poster preview.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `coverSize` | string | `md` | Cover size |

**Response `200`:**
```json
{
  "url": "https://..."
}
```

### `DELETE /v1/users/{userId}/posters/previews/{previewId}`

**Auth:** Required

Delete a poster preview.

**Response:** `200 OK` (empty body)

---

## Response Schemas

### User

```json
{
  "id": "uuid",
  "displayName": "John",
  "avatarUrl": "https://...",
  "username": "john"
}
```

### DetailedUser

```json
{
  "id": "uuid",
  "displayName": "John",
  "avatarUrl": "https://...",
  "username": "john",
  "description": "I stream games",
  "suggestionPreferences": {
    "enabled": true,
    "allowedFree": true,
    "allowedAnonymously": true,
    "categories": ["games", "movies"]
  },
  "socialLinks": [
    { "id": "uuid", "name": "Twitter", "url": "https://...", "position": 0 }
  ],
  "context": {
    "isFollowing": false,
    "isAuthorized": true,
    "isModerator": false
  }
}
```

### Profile

Extends `DetailedUser` with:
```json
{
  "...DetailedUser fields...",
  "createdAt": "2025-01-15T10:30:00Z",
  "counts": {
    "played": 42,
    "watched": 15,
    "ordered": 100,
    "followers": 500
  }
}
```

`played` counts game notes with status in `playing`, `finished`, `dropped`, `paused`.
`watched` counts movie notes with status `watched`.
`ordered` counts orders received.

### Content

Base content (polymorphic):
```json
{
  "id": "uuid",
  "title": "Title",
  "coverUrl": "https://...",
  "category": "games"
}
```

Game adds: `"releaseDate": "2015-05-19T00:00:00Z"`
Movie adds: `"releaseDate": "2025-01-15T00:00:00Z"`

### DetailedContent

Extends Content with:
```json
{
  "...Content fields...",
  "sourceUrl": "https://www.igdb.com/games/...",
  "sourceType": "igdb",
  "websites": [
    { "trusted": true, "url": "https://...", "type": "steam" }
  ]
}
```

Website types (IGDB): `official`, `steam`, `epicgames`, `gog`, `wikipedia`, `twitch`, `youtube`, `twitter`, `facebook`, `instagram`, `reddit`, `discord`, `wikia`.
Website types (TMDB): `imdb`, `homepage`.

### UserContent

Extends Content with:
```json
{
  "...Content fields...",
  "noteId": "uuid"
}
```

### ContentNote

```json
{
  "id": "uuid",
  "userId": "uuid",
  "content": { "...Content..." }
}
```

### DetailedContentNote

Extends ContentNote (polymorphic):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "createdAt": "2025-01-15T10:30:00Z",
  "rate": 8,
  "comment": "Great!",
  "status": "playing",
  "ordererCount": 3,
  "initialOrderer": { "...Orderer..." },
  "content": { "...DetailedContent..." }
}
```

`DetailedGameNote` adds: `"lastPlayedAt": "2025-01-15T10:30:00Z"`
`DetailedMovieNote` adds: `"watchedAt": "2025-01-15T10:30:00Z"`

### Orderer

```json
{
  "id": "uuid",
  "userId": "uuid-or-null",
  "displayName": "ViewerName",
  "source": "pickle",
  "avatarUrl": "https://...",
  "url": "https://pickle.pw/viewername"
}
```

`source` values: `pickle` (internal user) or `twitch` (external Twitch user).
`url` is constructed from env formats: `ORDERER_PICKLE_URL_FORMAT` (e.g., `https://pickle.pw/%s`) or `ORDERER_TWITCH_URL_FORMAT` (e.g., `https://twitch.tv/%s`).
For `pickle` source, `url` uses the user's username. For `twitch` source, `url` uses the orderer's display name.

### Order

```json
{
  "id": "uuid",
  "createdAt": "2025-01-15T10:30:00Z",
  "source": "pickle-suggestion",
  "anonymous": false,
  "orderer": { "...Orderer..." }
}
```

`source` values: `pickle-manual`, `pickle-suggestion`, `twitch-channel-points`.

### DetailedOrder

Extends Order with:
```json
{
  "...Order fields...",
  "category": "games",
  "content": { "...Content..." },
  "message": "Please play this!"
}
```

### OrderWithDecision

```json
{
  "...DetailedOrder fields...",
  "decision": {
    "contentNote": { "...ContentNote..." },
    "decidedAt": "2025-01-16T12:00:00Z",
    "decidedBy": { "...User..." },
    "status": "approved"
  }
}
```

`decision` is `null` if the order has not been decided.
`decision.status` values: `approved`, `rejected`.
For `approved` decisions, `contentNote` links to the created/existing content note.

### Collection

```json
{
  "id": "uuid",
  "createdAt": "2025-01-15T10:30:00Z",
  "name": "Favorites"
}
```

### CollectionItem

```json
{
  "id": "uuid",
  "createdAt": "2025-01-15T10:30:00Z",
  "collectionId": "uuid",
  "content": { "...Content..." }
}
```

### Moderator

```json
{
  "id": "uuid",
  "userId": "uuid",
  "moderatorUserId": "uuid",
  "addedAt": "2025-01-15T10:30:00Z",
  "username": "mod_user",
  "displayName": "Mod User",
  "avatarUrl": "https://..."
}
```

### ContentNoteReaction

```json
{
  "emoteId": "thumbsup",
  "source": "unicode_emoji",
  "count": 5,
  "userReacted": true
}
```

### CoverPreview

```json
{
  "previewId": "uuid",
  "createdAt": "2025-01-15T10:30:00Z",
  "url": "https://..."
}
```

---

## Endpoint Summary Table

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/health` | None | Health check |
| `POST` | `/v1/webhooks/ory/users` | API Key | Ory registration webhook |
| `POST` | `/v1/webhooks/orders/{userId}` | API Key | External order creation webhook |
| `POST` | `/v1/triggers/igdb-sync` | API Key | Trigger IGDB game sync |
| `POST` | `/v1/triggers/tmdb-sync` | API Key | Trigger TMDB movie sync |
| `GET` | `/v1/profiles/{username}` | Optional | Get profile by username |
| `GET` | `/v1/users/validate-username` | None | Validate username |
| `GET` | `/v1/users/me` | Required | Get my profile |
| `PATCH` | `/v1/users/me` | Required | Update my profile |
| `POST` | `/v1/users/me/avatar` | Required | Upload avatar preview |
| `GET` | `/v1/users/me/avatar` | Required | Get my avatar URL |
| `GET` | `/v1/users/{userId}` | None | Get user by ID |
| `GET` | `/v1/users/{userId}/avatar` | None | Get user avatar URL |
| `POST` | `/v1/users/{userId}/follows` | Required | Follow user |
| `DELETE` | `/v1/users/{userId}/follows` | Required | Unfollow user |
| `GET` | `/v1/users/{userId}/content-notes/{category}` | None | List content notes (cursor) |
| `POST` | `/v1/users/{userId}/content-notes/{category}` | Required | Create content note |
| `GET` | `/v1/users/{userId}/content-notes/{category}/by-content-id/{contentId}` | None | Get note by content ID |
| `GET` | `/v1/users/{userId}/content-notes/{category}/reactions` | Optional | Batch get reactions |
| `GET` | `/v1/content-notes/{category}/{contentNoteId}` | None | Get content note by ID |
| `PATCH` | `/v1/content-notes/{category}/{contentNoteId}` | Required | Update content note |
| `DELETE` | `/v1/content-notes/{category}/{contentNoteId}` | Required | Delete content note |
| `GET` | `/v1/content-notes/{category}/{contentNoteId}/orders` | None | Get orders for note |
| `POST` | `/v1/content-notes/{category}/{contentNoteId}/reactions` | Required | Add reaction |
| `DELETE` | `/v1/content-notes/{category}/{contentNoteId}/reactions` | Required | Remove reaction |
| `GET` | `/v1/content/{category}` | None | Search content catalog |
| `GET` | `/v1/content/{category}/{contentId}` | None | Get content by ID |
| `GET` | `/v1/users/{userId}/content` | None | Search user's content |
| `GET` | `/v1/users/{userId}/orders` | None | List orders (cursor) |
| `POST` | `/v1/users/{userId}/orders/suggest` | Required | Create suggestion order |
| `GET` | `/v1/users/{userId}/orders/ws` | Required | WebSocket order events |
| `GET` | `/v1/users/{userId}/orders/{orderId}` | Required | Get order by ID |
| `POST` | `/v1/users/{userId}/orders/{orderId}/approve` | Required | Approve order |
| `POST` | `/v1/users/{userId}/orders/{orderId}/reject` | Required | Reject order |
| `GET` | `/v1/users/{userId}/posters/previews` | Required | List poster previews |
| `POST` | `/v1/users/{userId}/posters/previews` | Required | Upload poster preview |
| `GET` | `/v1/users/{userId}/posters/previews/{previewId}/image` | Required | Get preview image URL |
| `DELETE` | `/v1/users/{userId}/posters/previews/{previewId}` | Required | Delete poster preview |
| `GET` | `/v1/users/{userId}/collections` | None | List collections |
| `POST` | `/v1/users/{userId}/collections` | Required | Create collection |
| `GET` | `/v1/users/{userId}/collections/items` | None | List all collection items |
| `POST` | `/v1/users/{userId}/collections/{collectionId}/items` | Required | Add item to collection |
| `GET` | `/v1/collections/{collectionId}` | None | Get collection by ID |
| `PATCH` | `/v1/collections/{collectionId}` | Required | Update collection |
| `DELETE` | `/v1/collections/{collectionId}` | Required | Delete collection |
| `GET` | `/v1/collections/{collectionId}/items` | None | List collection items |
| `DELETE` | `/v1/collections/{collectionId}/items/{itemId}` | Required | Remove item from collection |
| `POST` | `/v1/users/{userId}/moderators` | Required | Add moderator |
| `GET` | `/v1/users/{userId}/moderators` | Required | List moderators |
| `DELETE` | `/v1/users/{userId}/moderators/{moderatorId}` | Required | Remove moderator |
