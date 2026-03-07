# Pickle Frontend -- Agent Guidelines

Rules, conventions, and context for anyone (human or AI) working on the Pickle frontend codebase.

---

## Tech Stack

| Technology                   | Version        | Role                                              |
| ---------------------------- | -------------- | ------------------------------------------------- |
| **Next.js**                  | 16             | Framework (App Router, RSC, Turbopack)            |
| **React**                    | 19             | UI library                                        |
| **TypeScript**               | 5.9            | Language (strict mode enabled)                    |
| **Bun**                      | latest         | Package manager and runtime (`bun.lockb`)         |
| **Tailwind CSS**             | 3.4            | Utility-first styling with CSS variable theming   |
| **shadcn/ui**                | New York style | Component library built on Radix primitives       |
| **class-variance-authority** | latest         | Component variant definitions (CVA)               |
| **tailwind-merge + clsx**    | latest         | Class name merging via `cn()` utility             |
| **TanStack React Query**     | 5              | Server state management, caching, mutations       |
| **TanStack Table**           | 8              | Table rendering and logic                         |
| **Zustand**                  | 5              | Client-side state management (4 stores)           |
| **nuqs**                     | 2              | Type-safe URL query parameter state               |
| **react-hook-form**          | 7              | Form state management                             |
| **Zod**                      | 4              | Schema validation (forms + environment variables) |
| **Ory Kratos**               | --             | Authentication and identity management            |
| **next-intl**                | 4              | Internationalization (English, Russian)           |
| **next-themes**              | --             | Dark/light theme switching (class strategy)       |
| **Lucide React**             | --             | Icon library                                      |
| **Sonner**                   | --             | Toast notifications                               |
| **dnd-kit**                  | --             | Drag and drop (sortable lists)                    |
| **date-fns**                 | 3              | Date formatting and manipulation                  |

---

## Core Concepts / Domain Model

### Content

A piece of media (game, movie, anime, series, video) from an **external database** -- IGDB for games, TMDB for movies. Content is not created by users. Users search for it and create notes about it.

```
Content { id, title, category, coverUrl? }
DetailedContent extends Content { sourceUrl?, sourceType, websites[] }
Game extends Content { releaseDate? }
Movie extends Content { releaseDate? }
```

### ContentCategory

```
'games' | 'movies' | 'anime' | 'series' | 'videos' | 'custom' | 'any'
```

Currently only **games** and **movies** are active. Anime, series, and videos are globally disabled but exist in the type system for future use.

### ContentNote

The **central domain entity**. A ContentNote is a user's personal log entry / review about a piece of content. When a streamer plays a game or watches a movie, they create a ContentNote to record it.

```
ContentNote { id, userId, content? }
DetailedContentNote extends ContentNote {
  createdAt, rate? (0-10), comment, status,
  ordererCount, initialOrderer?, content?
}
GameNote extends DetailedContentNote { lastPlayedAt? }
MovieNote extends DetailedContentNote { watchedAt? }
```

**Statuses by category:**

| Category | Statuses                                                         |
| -------- | ---------------------------------------------------------------- |
| Games    | `planned`, `playing`, `paused`, `dropped`, `finished`, `skipped` |
| Movies   | `planned`, `dropped`, `watched`, `skipped`                       |

### Order (Suggestion)

A content suggestion from a viewer to a streamer. The terms "order" (code) and "suggestion" (UI) are interchangeable.

```
Order { id, createdAt, source, anonymous, orderer? }
DetailedOrder extends Order { category, message }
OrderWithDecision extends DetailedOrder { decision? }
OrderDecision { contentNote?, decidedAt, decidedBy?, status: 'approved' | 'rejected' }
```

Sources: `'pickle-suggestion'` (web form) or `'twitch-channel-points'` (Twitch integration).

When an order is **approved**, a ContentNote is created for that content. When **rejected**, the order is marked with a rejection decision.

### Orderer

The person who submitted a suggestion. May or may not be a registered Pickle user.

```
Orderer { id, userId?, displayName, source, avatarUrl, url? }
```

### User / Profile

```
User { id, displayName, avatarUrl, username }
DetailedUser extends User { description, socialLinks[], suggestionPreferences, context }
Profile extends DetailedUser { createdAt, counts: { played, watched, ordered, followers } }
```

**UserContext** (attached to every profile, relative to the viewer):

```
UserContext { isFollowing, isAuthorized (is owner), isModerator }
```

**SuggestionPreferences** (streamer settings):

```
SuggestionPreferences { enabled, allowedFree, allowedAnonymously, categories[] }
```

### Collection

A user-curated named list of content items. Separate from the note-based tracking system.

```
Collection { id, createdAt, name }
CollectionItem { id, createdAt, collectionId, content }
```

### Moderator

A user who can help manage another user's content and orders.

```
Moderator { id, userId, moderatorUserId, addedAt, username, displayName, avatarUrl }
```

### ContentNoteReaction

Emoji reactions that visitors can add to content notes.

```
ContentNoteReaction { emoteId, source: 'unicode_emoji', count, userReacted }
```

### Pagination

Two pagination models used by the backend:

```
Paginated<T> { content[], page, size, totalPages, totalElements }         -- offset-based
CursorPaginated<T> { content[], totalElements }                           -- cursor-based (infinite scroll)
SearchHit<T> { id, source: T, score }                                     -- search results
```

### Entity Relationships

```
User --has--> Profile (public view with counts)
User --creates--> ContentNote[] (their game/movie log entries)
User --creates--> Collection[] (curated lists)
User --has--> Moderator[] (people who help manage their content)
User --receives--> Order[] (suggestions from viewers)

ContentNote --references--> Content (the media item from IGDB/TMDB)
ContentNote --has--> ContentNoteReaction[] (emoji reactions from visitors)
ContentNote --linked-to--> Order? (if created via approved suggestion)

Order --submitted-by--> Orderer (viewer or anonymous Twitch user)
Order --has--> OrderDecision? (approved/rejected, links to ContentNote if approved)

Collection --contains--> CollectionItem[] --references--> Content
```

---

## Project Structure Conventions

### Flat Layout

The project uses a **flat layout** -- no `src/` directory. All source directories (`app/`, `components/`, `hooks/`, `lib/`, `stores/`, `providers/`, `query-params/`, `utils/`, `i18n/`, `messages/`) live at the project root.

### File Naming

- **All files use kebab-case**: `content-note-card.tsx`, `use-debounce.ts`, `auth-store.ts`
- **`.tsx`** for files containing JSX, **`.ts`** for pure logic/types/data
- No PascalCase filenames anywhere in the project

### No Barrel Exports

There are **no `index.ts` barrel files** anywhere. Every module is imported directly by its file path:

```ts
// Correct
import { Button } from "@/components/ui/button";
import { ContentNote } from "@/lib/model/content-note";

// Wrong -- no barrel files exist
import { Button } from "@/components/ui";
import { ContentNote } from "@/lib/model";
```

### Import Path Alias

The `@/` alias maps to the project root. All internal imports use this alias:

```ts
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/providers/auth-store";
```

### Component Co-location

- **Shared/reusable components** go in `components/`
- **Page-specific components** are co-located with their route in `app/`, either as sibling files or in a local `components/` subdirectory
- **Dialog components** go in `components/view/dialog/{dialog-name}/`

### Logic Separation

Non-component logic associated with a page/feature is extracted into `.logic.ts` files:

```
app/(view)/settings/page.logic.ts          -- tab enums, types, config data
app/(view)/settings/general-tab/general-settings-form.ts  -- Zod schemas
```

### Route Groups

The `(view)` route group wraps the main authenticated app layout (navbar, footer, auth fetching). Auth routes live in `app/auth/` outside this group.

---

## Component Patterns

### Client vs Server Components

- Add `'use client'` at the top of every client component file. Server components omit it.
- Async server components (pages, layouts) use `export default async function`.
- Keep server components as the default; only add `'use client'` when the component needs interactivity, hooks, or browser APIs.

### Props Typing

Three patterns, used consistently by component type:

**Pattern A -- Extending HTML/Radix attributes (shadcn/ui primitives):**

```tsx
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

**Pattern B -- Simple type (custom feature components):**

```tsx
type Props = {
  className?: string
  user?: DetailedUser
}
export default function ProfileCard({ className, user }: Props) { ... }
```

**Pattern C -- ComponentProps (Radix wrapper components):**

```tsx
const DialogOverlay = ({
  className, ref, ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) => ( ... )
```

### Export Conventions

- **Page components**: Always `export default function` (Next.js requirement)
- **Feature/application components**: `export default function ComponentName()`
- **shadcn/ui primitives**: Named exports, multiple per file: `export { Button, buttonVariants }`
- **Never mix** default + named exports in the same file

### forwardRef and displayName

- shadcn/ui primitives wrapping Radix components use either `React.forwardRef` (older) or the React 19 pattern with `ref` as a regular prop from `React.ComponentProps<>` (newer)
- Always set `displayName` on wrapped/forwarded components
- `React.memo` is not used in the codebase

### Dynamic Imports for Dialogs

Heavy dialog content is lazy-loaded using `next/dynamic` with loading fallbacks:

```tsx
const GameNoteDialogContent = dynamic(
  () => import("./game-note-dialog-content"),
  { loading: () => <LoadingDialogContent /> },
);
```

---

## Styling

### Tailwind CSS + cn()

All styling uses Tailwind utility classes. The `cn()` function from `lib/utils.ts` merges classes safely:

```tsx
import { cn } from "@/lib/utils";

<div className={cn("flex items-center gap-2", className)} />;
```

Always use `cn()` when combining conditional or external className props. Never use raw string concatenation.

### Component Variants with CVA

Use `class-variance-authority` for components with multiple visual variants:

```tsx
const buttonVariants = cva("inline-flex items-center ...", {
  variants: {
    variant: { default: "...", destructive: "...", outline: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

### Theme / Dark Mode

- Dark mode uses the `class` strategy via `next-themes`
- All semantic colors are defined as HSL CSS custom properties in `app/globals.css` (`--background`, `--foreground`, `--primary`, etc.)
- Reference them in Tailwind config via `hsl(var(--...))` -- this is already set up, just use the semantic class names (`bg-background`, `text-foreground`, `bg-primary`, etc.)
- No CSS modules, no styled-components, no separate CSS files (other than `globals.css`)

---

## Data Fetching

### Architecture Overview

Data fetching follows a five-layer architecture:

```
1. Fetch Layer        utils/api/fetcher.ts     -- Core apiFetcher() using native fetch
2. Client/Server      utils/api/client.ts      -- Client-side fetchApi (browser cookies)
                      utils/api/server.ts      -- Server-side fetchApi (forwards cookies from headers)
3. Query Keys         lib/query-keys.ts        -- Centralized key factory
4. Query Options      lib/query-options.ts      -- Reusable queryOptions() factories
5. Hooks              hooks/queries/            -- useQuery/useInfiniteQuery wrappers
                      hooks/mutations/          -- useMutation wrappers
```

### Fetch Layer

`apiFetcher<T>()` is the core function. It prepends `env.NEXT_PUBLIC_BACKEND_URL`, sets `credentials: 'include'`, forwards cookies (when provided), and handles JSON/text response parsing.

There are two wrappers:

- **`utils/api/client.ts`** (`fetchApi`) -- for client components. The browser handles cookies automatically.
- **`utils/api/server.ts`** (`fetchApi`) -- for server components. Reads cookies from `next/headers` and passes them to the fetcher for SSR auth forwarding.

### Query Keys

All query keys are defined in `lib/query-keys.ts` as a centralized factory object:

```ts
import { queryKeys } from "@/lib/query-keys";

queryKeys.users.me(); // ['users', 'me']
queryKeys.profiles.byUsername(username); // ['profiles', username]
queryKeys.contentNotes.list(userId, category); // ['content-notes', userId, category, ...]
queryKeys.content.search(category, query); // ['content', 'search', category, query]
```

Always use this factory. Never hardcode query key arrays.

### Query Options

`lib/query-options.ts` defines reusable `queryOptions()` factories that accept a `FetchApiFn` parameter, enabling the same options to be used from both server and client:

```ts
// Server component
const queryClient = createQueryClient();
await queryClient.fetchQuery(meQueryOptions(fetchApi)); // server fetchApi

// Client hook
const { data } = useQuery(meQueryOptions(fetchApi)); // client fetchApi
```

### SSR Prefetching

Server components prefetch data and pass it to client components via `HydrationBoundary`:

```tsx
// In a server layout/page
const queryClient = createQueryClient();
await queryClient.fetchQuery(profileByUsernameQueryOptions(fetchApi, username));

return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <ClientComponent />
  </HydrationBoundary>
);
```

### Infinite Scroll

`lib/sort-filter-fetch.ts` exports `useSortFilterFetch<T>()` which combines:

- Cursor-based infinite query (`useInfiniteQuery`)
- `react-intersection-observer` for viewport detection
- Automatic next-page fetching when the sentinel element enters the viewport
- URL-synced sort/filter state via nuqs

### Query Client Defaults

Defined in `lib/query-client.ts`:

- `staleTime`: 60 seconds
- `gcTime`: 5 minutes
- `retry`: 1
- `refetchOnWindowFocus`: false

### Mutation Hooks

Mutation hooks live in `hooks/mutations/` and group related operations:

```ts
// hooks/mutations/use-content-note-mutations.ts exports:
useCreateContentNoteMutation();
useUpdateContentNoteMutation();
useDeleteContentNoteMutation();
```

Mutations use `onSuccess` callbacks to invalidate relevant queries via `queryClient.invalidateQueries()`.

### Request / Response Types

- **Request DTOs**: `utils/api/request.ts` (e.g., `CreateGameNoteReq`, `UpdateProfileReq`, `SuggestContentReq`)
- **Response types**: `utils/api/response.ts` (re-exports `Paginated<T>`, `SearchHit<T>`)
- **Constants**: `utils/api/constants.ts` (label mappings for categories and statuses)

---

## State Management

### Zustand Stores

Four Zustand stores, each following the same pattern:

| Store            | File                      | Scope                             | Purpose                            |
| ---------------- | ------------------------- | --------------------------------- | ---------------------------------- |
| **AuthStore**    | `stores/auth-store.ts`    | Global (root layout)              | Current user + Ory session         |
| **ModalStore**   | `stores/modal.ts`         | Global (root providers)           | Which modal is open + typed params |
| **ProfileStore** | `stores/profile-store.ts` | Per-profile (`[username]` layout) | Currently viewed profile data      |
| **OrderStore**   | `stores/order.ts`         | Per-profile (`[username]` layout) | Currently selected order           |

### Store Pattern

Every store follows this architecture:

1. **Store definition** (`stores/*.ts`): `createStore()` with `devtools` middleware
2. **Provider** (`providers/*.tsx`): React Context wrapping `useRef<StoreApi>`, with `useEffect` for prop-to-store sync
3. **Hook** (exported from provider): `useXxxStore(selector)` for consuming components

```ts
// Usage in a component
const user = useAuthStore((s) => s.user);
const openModal = useModalStore((s) => s.openModal);
const profile = useProfileStore((s) => s.profile);
```

### Modal System

The modal store manages 20+ modal types with typed parameters per modal. Modal state is bidirectionally synced with URL query params via nuqs:

- Opening a modal updates the URL: `?m=game-note&mps=noteId%3Dabc123`
- Navigating to a URL with modal params opens the corresponding modal
- `query-params/modal.tsx` (`ModalQuerySync`) handles the two-way sync

### URL State (nuqs)

Sort, filter, and modal states are synced to URL query parameters using nuqs:

- `query-params/sort.tsx` -- `useSortQueryState()` for sort column + direction
- `query-params/filter.tsx` -- `useFilterQueryState()` for active filters
- `query-params/modal.tsx` -- `ModalQuerySync` for modal type + params

---

## Forms and Validation

### Stack

- **react-hook-form** for form state and submission
- **Zod** for schema validation (via `@hookform/resolvers/zod`)
- **shadcn/ui Form components** for rendering (`<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`)

### Pattern

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  displayName: z.string().min(1).max(100),
  username: z.string().min(3).max(50),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { displayName: "", username: "" },
});
```

### Schema Co-location

Zod schemas are defined in dedicated `.ts` files co-located with the form feature:

```
app/(view)/settings/general-tab/general-settings-form.ts   -- schema + types
app/(view)/settings/general-tab/general-settings-tab.tsx    -- form UI component
```

### Form Sub-sections

Large forms are split into sub-components that receive the `form: UseFormReturn<...>` object as a prop:

```tsx
type Props = { form: UseFormReturn<z.infer<typeof schema>> }
export default function DisplayNameField({ form }: Props) { ... }
```

---

## Authentication

### Provider: Ory Kratos

Authentication is handled by a self-hosted Ory Kratos instance. The frontend does **not** implement its own auth logic -- it renders Ory's self-service UI nodes.

### Key Files

- `ory.config.ts` -- Ory SDK configuration, UI route mapping
- `lib/ory.ts` -- `FrontendApi` client instance
- `hooks/getCurrentSession.ts` -- Server-side session fetch
- `utils/session.ts` -- `isSessionActive()` helper

### Auth Flow

1. Auth pages (`/auth/login`, `/auth/registration`, etc.) initiate Ory self-service flows
2. Ory UI nodes are mapped to shadcn/ui components via `utils/ory.tsx`
3. On the `(view)` layout, the server fetches the user via `/v1/users/me` with forwarded cookies
4. `AuthStoreProvider` makes the user/session available to all client components
5. `useRedirectToLogin()` constructs the Ory login URL with a `return_to` parameter

### Cookie Forwarding

For SSR requests to the backend, cookies must be explicitly forwarded from the Next.js server:

```ts
// utils/api/server.ts reads cookies from next/headers and passes them to apiFetcher
import { cookies } from "next/headers";
```

---

## Internationalization

### Setup

- **Locales**: `en` (English), `ru` (Russian)
- **URL strategy**: `localePrefix: 'never'` -- no `/en/` or `/ru/` in URLs
- **Detection**: `NEXT_LOCALE` cookie > `Accept-Language` header > default `en`
- **Switching**: Sets `NEXT_LOCALE` cookie + `router.refresh()`
- **Messages**: `/messages/en.json` and `/messages/ru.json` with nested key structure

### Usage

```tsx
// Server component
const t = await getTranslations("settings");
t("tabs.general");

// Client component
const t = useTranslations("settings");
t("tabs.general");
```

### Localization Helpers

`lib/localize-types.ts` provides functions that return either message keys (for use with `t()`) or direct strings:

```ts
localizeContentCategory(category); // returns translated string
getContentCategoryMessageKey(category); // returns message key for use with t()
localizeContentNoteStatus(status); // returns translated string
```

---

## API Layer

### Backend

All data comes from an external backend at `NEXT_PUBLIC_BACKEND_URL`. The frontend has **no Next.js API routes** -- it is a pure frontend client.

Key backend API prefixes:

- `/v1/` -- Main API (users, profiles, content, notes, orders, collections, moderators)
- `/twitch-harbor/v1/` -- Twitch integration (broadcaster preferences, rewards, redemptions)

### Error Handling

The standard error handling pattern:

```tsx
import { toastError } from "@/lib/toasts";

try {
  await mutation.mutateAsync(data);
} catch (error) {
  toastError("Failed to update profile", error);
}
```

- `apiFetcher` throws `Error` with the message from the response body's `error` field
- `toastError()` extracts `error.message` and displays it via Sonner toast
- Next.js error boundaries (`error.tsx`) exist at root, `(view)`, `[username]`, and `settings` levels

### Error Boundaries

Error boundary files follow the Next.js convention:

- `app/error.tsx` -- root error boundary
- `app/(view)/error.tsx` -- main layout error boundary
- `app/(view)/[username]/error.tsx` -- profile error boundary

Each is a `'use client'` component with `error` + `reset` props, rendering retry and navigation options.

---

## Best Practices

### Do

- **Use `cn()` for class merging** -- never concatenate className strings manually
- **Use `'use client'`** at the top of every client component file
- **Use the query key factory** from `lib/query-keys.ts` -- never hardcode key arrays
- **Use `env` from `lib/env.ts`** to access environment variables -- never use `process.env` directly for validated vars
- **Use `toastError()`** from `lib/toasts.ts` for user-facing error messages
- **Use `fetchApi`** from the appropriate module (`utils/api/client.ts` for client, `utils/api/server.ts` for server)
- **Follow existing store/provider patterns** when creating new Zustand stores
- **Use `next/dynamic`** with loading fallbacks for heavy dialog content
- **Keep mutations grouped** in `hooks/mutations/` by domain (e.g., `use-profile-mutations.ts`)
- **Keep queries** in `hooks/queries/`, one query per file for simple cases
- **Co-locate page-specific components** with their route in `app/`
- **Use shadcn/ui components** as the building blocks -- do not create custom primitives for things shadcn already provides
- **Add `displayName`** to any component using `forwardRef` or Radix wrappers
- **Use Zod schemas** for form validation, co-located with the form feature
- **Invalidate queries** in mutation `onSuccess` callbacks to keep the UI fresh

### Don't

- **Don't create barrel files** (`index.ts`) -- import directly from the source file
- **Don't use CSS modules or styled-components** -- use Tailwind classes
- **Don't use `React.memo`** -- it is not used in this codebase
- **Don't create Next.js API routes** -- the backend is a separate service
- **Don't hardcode strings** -- use `next-intl` translations with message keys
- **Don't access `process.env` directly** for `NEXT_PUBLIC_*` vars -- use the validated `env` object
- **Don't put shared components in `app/`** -- shared components go in `components/`
- **Don't use PascalCase for file names** -- always use kebab-case

### Import Order Convention

Imports are grouped in this order (not mechanically enforced, but follow by convention):

1. `'use client'` directive (if present, always line 1)
2. Third-party libraries (React, Next.js, Radix, TanStack, etc.)
3. Internal `@/` aliased imports (components, lib, hooks, stores, providers, utils)
4. Relative imports (`./`, `../`)

### Adding a New Feature Checklist

1. **Types**: Define domain types in `lib/model/`
2. **API types**: Add request/response DTOs in `utils/api/request.ts` and `utils/api/response.ts`
3. **Query keys**: Add keys to the factory in `lib/query-keys.ts`
4. **Query hooks**: Create in `hooks/queries/`
5. **Mutation hooks**: Create in `hooks/mutations/`
6. **Components**: Shared UI in `components/`, page-specific in `app/` co-located with the route
7. **Dialogs**: If a modal is needed, add the modal type to `stores/modal.ts` and create a dialog in `components/view/dialog/`
8. **Translations**: Add message keys to both `messages/en.json` and `messages/ru.json`
9. **Route**: Add the page in `app/` following the existing layout/page pattern

### Testing

There are currently no tests in the project (no test files, no test framework configured, no test scripts). This is a known gap.

---

## SEO

- Next.js Metadata API is used for `<title>`, OpenGraph, and Twitter card meta tags
- JSON-LD structured data (Schema.org `ProfilePage`) is rendered on profile pages
- `robots.ts` disallows `/auth/` and `/settings/`
- `sitemap.ts` includes `/`, `/privacy`, `/terms`
- Profile pages include canonical URLs and OG images
- Content categories map to Schema.org types: Games -> `VideoGame`, Movies -> `Movie`, Anime/Series -> `TVSeries`, Videos -> `VideoObject`
