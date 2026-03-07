# Pickle Frontend

Pickle is a web application for streamers and content creators to track games, movies, and other media they consume, share their opinions, and receive content suggestions from their audience.

## What is Pickle?

Pickle gives streamers personal profile pages where they can log and rate games they've played, movies they've watched, and more. Viewers can suggest content for streamers to try (called "orders" or "suggestions"), optionally through Twitch channel point redemptions. Streamers can approve or reject suggestions, manage moderators, create curated collections, and receive emoji reactions on their content notes.

## Features

- **Content Notes** -- Track games (playing/paused/dropped/finished/skipped/planned) and movies (planned/dropped/watched/skipped) with ratings, comments, and dates
- **Suggestions / Orders** -- Viewers can suggest content for streamers via the web or Twitch channel points; streamers approve or reject suggestions
- **Public Profiles** -- Each user gets a `/{username}` profile page with tabs for content notes and suggestions, social links, avatar, and follower counts
- **Collections** -- User-curated named lists of content items
- **Reactions** -- Emoji reactions on content notes from visitors
- **Moderation** -- Streamers can assign moderators to help manage content and orders
- **Twitch Integration** -- Track Twitch channel point reward redemptions as content suggestions
- **Internationalization** -- English and Russian language support
- **Dark Mode** -- System-aware theme with manual toggle

## Tech Stack

| Concern          | Technology                                    |
| ---------------- | --------------------------------------------- |
| Framework        | Next.js 16 (App Router, Turbopack, RSC)       |
| Language         | TypeScript 5.9 (strict mode)                  |
| Runtime          | Bun                                           |
| UI Components    | shadcn/ui (New York style) + Radix primitives |
| Styling          | Tailwind CSS 3.4 + CVA + tailwind-merge       |
| Icons            | Lucide React                                  |
| Data Fetching    | TanStack React Query 5 + native fetch         |
| State Management | Zustand 5                                     |
| URL State        | nuqs 2                                        |
| Forms            | react-hook-form 7 + Zod 4                     |
| Auth             | Ory Kratos                                    |
| i18n             | next-intl 4                                   |
| Theming          | next-themes                                   |
| Toasts           | Sonner                                        |
| Tables           | TanStack Table 8                              |
| Drag & Drop      | dnd-kit                                       |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (package manager and runtime)
- Node.js 18+
- A running Pickle backend (default: `http://localhost:8080`)
- A running Ory Kratos instance (default: `http://localhost:4433`)

### Setup

1. Clone the repository and install dependencies:

```bash
bun install
```

2. Copy the environment template and fill in the values:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
bun dev
```

### Scripts

| Command         | Description                                        |
| --------------- | -------------------------------------------------- |
| `bun dev`       | Start dev server with Turbopack and Node inspector |
| `bun run build` | Production build                                   |
| `bun start`     | Start production server                            |
| `bun lint`      | Run ESLint                                         |
| `bun lint:fix`  | Run ESLint with auto-fix                           |

## Project Structure

```
pickle/frontend/
├── app/                        # Next.js App Router (pages, layouts, route groups)
│   ├── (view)/                 # Main app layout group (navbar, auth, footer)
│   │   ├── [username]/         # User profile pages
│   │   │   ├── notes/          # Content notes (by category, by ID)
│   │   │   └── suggestions/    # Suggestion/order queue
│   │   ├── settings/           # Settings page with tabs (general, security, moderation, etc.)
│   │   └── suggest/[username]/ # Public suggestion form
│   ├── auth/                   # Authentication flows (login, registration, verification, recovery)
│   ├── privacy/                # Privacy policy
│   ├── terms/                  # Terms of service
│   ├── globals.css             # CSS variables + Tailwind directives
│   ├── layout.tsx              # Root layout (fonts, providers, i18n)
│   └── root-providers.tsx      # Client providers (theme, query, nuqs, modal)
├── components/                 # Shared components
│   ├── ui/                     # shadcn/ui primitives + custom UI components
│   │   ├── content-note/       # Content note cards, grids, filters, posters, reactions
│   │   ├── content-collections/# Collection CRUD and display components
│   │   └── icons/              # Custom SVG icons (Pickle, Steam, IGDB, etc.)
│   └── view/dialog/            # Feature-specific dialog components (26 dialog types)
├── hooks/                      # Custom React hooks
│   ├── mutations/              # TanStack Query mutation hooks
│   └── queries/                # TanStack Query query hooks
├── lib/                        # Shared utilities and infrastructure
│   ├── model/                  # TypeScript domain models (Content, ContentNote, User, Order, etc.)
│   ├── env.ts                  # Zod-validated environment variables
│   ├── query-keys.ts           # Centralized query key factory
│   ├── query-options.ts        # Reusable query option factories
│   ├── query-client.ts         # QueryClient factory with defaults
│   ├── sort-filter-fetch.ts    # Infinite scroll + sort/filter abstraction
│   └── utils.ts                # cn() class merge utility
├── stores/                     # Zustand store definitions (auth, modal, profile, order)
├── providers/                  # React context providers wrapping Zustand stores
├── query-params/               # URL query state management via nuqs (sort, filter, modal)
├── utils/                      # API layer and session utilities
│   └── api/                    # Fetch clients (client/server), request/response types, constants
├── i18n/                       # Internationalization config (locales, routing, detection)
├── messages/                   # Translation files (en.json, ru.json)
├── public/                     # Static assets
├── components.json             # shadcn/ui configuration
├── tailwind.config.ts          # Tailwind theme (CSS variables, semantic colors)
├── next.config.js              # Next.js config (next-intl plugin, image domains)
├── tsconfig.json               # TypeScript config (strict, path aliases)
└── eslint.config.mjs           # ESLint flat config
```

## Routes

| Route                               | Description                                                           |
| ----------------------------------- | --------------------------------------------------------------------- |
| `/`                                 | Landing page                                                          |
| `/auth/login`                       | Login (Ory Kratos)                                                    |
| `/auth/registration`                | Registration                                                          |
| `/auth/verification`                | Email verification                                                    |
| `/auth/recovery`                    | Password recovery                                                     |
| `/auth/error`                       | Auth error page                                                       |
| `/privacy`                          | Privacy policy                                                        |
| `/terms`                            | Terms of service                                                      |
| `/{username}`                       | User profile (redirects to notes)                                     |
| `/{username}/notes`                 | Content notes index (redirects to default category)                   |
| `/{username}/notes/{category}`      | Content notes filtered by category (games, movies)                    |
| `/{username}/notes/{category}/{id}` | Individual note detail page                                           |
| `/{username}/suggestions`           | User's suggestion/order queue                                         |
| `/suggest/{username}`               | Submit a content suggestion to a user                                 |
| `/settings`                         | Account settings (general, security, moderation, suggestions, Twitch) |
| `/profile/reset-password`           | Password reset (authenticated)                                        |

## Environment Variables

| Variable                  | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_DOMAIN`      | Application domain (e.g., `localhost:3000`)         |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL (e.g., `http://localhost:8080`)     |
| `NEXT_PUBLIC_BACKEND_WS`  | Backend WebSocket URL (e.g., `ws://localhost:8080`) |
| `NEXT_PUBLIC_ORY_SDK_URL` | Ory Kratos SDK URL (e.g., `http://localhost:4433`)  |
| `ORY_PROJECT_API_TOKEN`   | Ory API token (server-only)                         |
| `NODE_ENVIRONMENT`        | Environment mode (`development` / `production`)     |
