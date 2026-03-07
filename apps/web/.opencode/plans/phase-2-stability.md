# Phase 2: Stability & Error Handling

**Goal:** Prevent crashes and surface errors properly. This phase establishes reliability before larger refactors.

**Effort:** ~3-4 hours | ~15 files touched | Medium risk

**Depends on:** Phase 1

## Tasks

### 2.1 Add Next.js error boundaries

Create `error.tsx` files in key route segments. Each should be a client component that renders a user-friendly error state with a retry button.

**Files to create:**

- `app/error.tsx` — root-level catch-all
- `app/(view)/error.tsx` — main app shell errors
- `app/(view)/[username]/error.tsx` — profile page errors
- `app/(view)/settings/error.tsx` — settings page errors

**Template structure:**

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

Customize each with context-appropriate messaging (e.g., "Profile not found" for `[username]/error.tsx`).

### 2.2 Add `not-found.tsx` pages

Create custom 404 pages:

- `app/not-found.tsx` — generic 404
- `app/(view)/[username]/not-found.tsx` — "Profile not found" with link back to home

In the profile layout (`app/(view)/[username]/layout.tsx`), replace the inline error rendering with a call to `notFound()` from `next/navigation` when the profile fetch fails with a 404.

### 2.3 Add environment variable validation

Create `lib/env.ts`:

```typescript
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_BACKEND_URL: z.string().url(),
  NEXT_PUBLIC_BACKEND_WS: z.string().min(1),
  NEXT_PUBLIC_ORY_SDK_URL: z.string().url(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_BACKEND_WS: process.env.NEXT_PUBLIC_BACKEND_WS,
  NEXT_PUBLIC_ORY_SDK_URL: process.env.NEXT_PUBLIC_ORY_SDK_URL,
});
```

- Import `env` in `utils/api/fetcher.ts` instead of reading `process.env.NEXT_PUBLIC_BACKEND_URL` directly
- Import in `ory.config.ts` instead of reading `process.env.NEXT_PUBLIC_ORY_SDK_URL` directly
- This ensures the app fails fast with clear error messages at startup instead of cryptic runtime errors

### 2.4 Fix silent error swallowing

**`app/(view)/navbar.tsx` (lines 49-54):**

- Replace empty catch with `console.error` logging
- Render a degraded navbar state (e.g., no user avatar) instead of silently hiding the failure

**`app/layout.tsx` (line 25):**

- Replace `.catch(() => undefined)` with proper error logging
- The `undefined` fallback is acceptable (unauthenticated state) but the error should be logged for debugging

**`app/(view)/[username]/layout.tsx` `generateMetadata` (lines 37-39):**

- Clean up the `.catch((error) => error.message)` pattern which resolves the Promise with a string instead of a Profile
- Use a proper try/catch with explicit handling

### 2.5 Fix store providers not updating on prop changes

**Problem:** Both `providers/auth-store.tsx` and `providers/profile-store.tsx` use `useRef` to create the store once. If the server re-renders with new data (e.g., after navigation), the store retains stale data.

**`providers/auth-store.tsx` (line 25):**

Add an effect to sync server props to the store:

```typescript
const storeRef = React.useRef<AuthStoreApi>(createAuthStore(props));

React.useEffect(() => {
  storeRef.current.setState({
    user: props.user,
    session: props.session,
  });
}, [props.user, props.session]);
```

**`providers/profile-store.tsx` (line 23):**

Same pattern:

```typescript
const storeRef = React.useRef<ProfileStoreApi>(createProfileStore(props));

React.useEffect(() => {
  storeRef.current.setState({
    profile: props.profile,
  });
}, [props.profile]);
```

### 2.6 Add typed modal params

**Problem:** Modal params are accessed with unsafe assertions like `modalParams!.noteId as string` throughout dialog components.

**Solution:** Define a discriminated union type mapping each `ModalType` to its expected params shape.

In `stores/modal.ts`, add:

```typescript
type GameNoteParams = { noteId: string; category: ContentCategory };
type MovieNoteParams = { noteId: string; category: ContentCategory };
type ContentNoteEditorParams = { noteId: string; category: ContentCategory };
type ContentNoteCreatorParams = {
  contentId: string;
  category: ContentCategory;
};
type SelectContentItemParams = { category: ContentCategory };
type ProfileSearchParams = { query?: string };
// ... etc for each ModalType

type ModalParamsMap = {
  [ModalType.GAME_NOTE]: GameNoteParams;
  [ModalType.MOVIE_NOTE]: MovieNoteParams;
  [ModalType.CONTENT_NOTE_EDITOR]: ContentNoteEditorParams;
  // ... etc
};
```

Add a typed accessor function:

```typescript
function getModalParams<T extends ModalType>(
  type: T,
  params: ModalParamValue | undefined,
): ModalParamsMap[T] | undefined;
```

Update dialog components to use the typed accessor instead of raw assertions.

## Verification

- `bun run build` completes successfully
- Navigate to a non-existent profile URL -> shows custom 404 page
- Remove `NEXT_PUBLIC_BACKEND_URL` from `.env.local` -> app fails with a clear Zod validation error at startup
- Navigate between profiles -> profile store updates correctly (no stale data)
- Trigger a rendering error in a component -> error boundary catches it and shows retry UI
