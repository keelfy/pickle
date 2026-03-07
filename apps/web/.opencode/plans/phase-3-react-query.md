# Phase 3: React Query Migration

**Goal:** Replace manual `fetch` + `useState` + `useEffect` patterns with React Query (TanStack Query) for automatic caching, deduplication, retry, stale-while-revalidate, and better loading/error states.

**Effort:** ~8-12 hours | ~40-50 files touched | High impact, moderate risk

**Depends on:** Phase 2

## Why React Query?

The current codebase has these data-fetching problems that React Query solves:

1. **No caching** — every navigation re-fetches data already loaded
2. **No deduplication** — multiple components fetching the same data make redundant requests
3. **No retry** — transient network failures silently fail
4. **Manual loading/error state** — every component manages its own `isLoading`/`error` state
5. **Race conditions** — `useSortFilterFetch` has no request cancellation when filters change rapidly
6. **Stale closures** — `useEffect` dependency arrays in `sort-filter-fetch.ts` are incomplete

## Tasks

### 3.1 Install and configure React Query

```bash
bun add @tanstack/react-query @tanstack/react-query-devtools
```

Create `lib/query-client.ts`:

```typescript
import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false, // can enable later
      },
    },
  });
}
```

Add `QueryClientProvider` to `app/root-providers.tsx`:

```typescript
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "@/lib/query-client";

// Use a module-level ref for SSR stability
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return createQueryClient();
  if (!browserQueryClient) browserQueryClient = createQueryClient();
  return browserQueryClient;
}
```

### 3.2 Create query key factory

Create `lib/query-keys.ts` with a structured key factory for type-safe cache management:

```typescript
export const queryKeys = {
  users: {
    me: () => ["users", "me"] as const,
    avatar: (size?: number) => ["users", "avatar", { size }] as const,
  },
  profiles: {
    byUsername: (username: string) => ["profiles", username] as const,
  },
  contentNotes: {
    list: (userId: string, category: string, filters?: object, sort?: string) =>
      ["content-notes", userId, category, { filters, sort }] as const,
    detail: (userId: string, category: string, noteId: string) =>
      ["content-notes", userId, category, noteId] as const,
    reactions: (noteId: string) =>
      ["content-notes", "reactions", noteId] as const,
    batchReactions: (noteIds: string[]) =>
      ["content-notes", "reactions", "batch", noteIds] as const,
  },
  collections: {
    list: (userId: string) => ["collections", userId] as const,
    detail: (collectionId: string) =>
      ["collections", "detail", collectionId] as const,
    items: (collectionId: string) =>
      ["collections", collectionId, "items"] as const,
  },
  orders: {
    list: (userId: string) => ["orders", userId] as const,
    detail: (orderId: string) => ["orders", "detail", orderId] as const,
  },
  content: {
    search: (category: string, query: string) =>
      ["content", "search", category, query] as const,
    detail: (category: string, contentId: string) =>
      ["content", category, contentId] as const,
  },
  follows: {
    status: (userId: string) => ["follows", userId] as const,
  },
  moderators: {
    list: (userId: string) => ["moderators", userId] as const,
  },
  twitch: {
    rewards: (userId: string) => ["twitch", "rewards", userId] as const,
    preferences: (userId: string) => ["twitch", "preferences", userId] as const,
  },
} as const;
```

### 3.3 Migrate server-side fetches

For pages using Server Components (profile layout, navbar, etc.), use React Query's `HydrationBoundary` pattern:

1. In server components, prefetch data and dehydrate the cache:

```typescript
// app/(view)/[username]/layout.tsx (server component)
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function ProfileLayout({ params }) {
  const queryClient = createQueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.profiles.byUsername(params.username),
    queryFn: () => fetchProfileByUsername(params.username),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileContent username={params.username} />
    </HydrationBoundary>
  );
}
```

2. Client components then use `useQuery` and get the prefetched data instantly (no loading flash).

### 3.4 Migrate client-side reads to `useQuery`

Create custom query hooks in a new `hooks/queries/` directory. Each hook wraps a `useQuery` call with the appropriate key and fetcher.

**Examples:**

```typescript
// hooks/queries/use-profile.ts
export function useProfile(username: string) {
  return useQuery({
    queryKey: queryKeys.profiles.byUsername(username),
    queryFn: () => fetchProfileByUsername(username),
    enabled: !!username,
  });
}

// hooks/queries/use-content-note.ts
export function useContentNote(
  userId: string,
  category: string,
  noteId: string,
) {
  return useQuery({
    queryKey: queryKeys.contentNotes.detail(userId, category, noteId),
    queryFn: () => fetchContentNote(userId, category, noteId),
    enabled: !!noteId,
  });
}

// hooks/queries/use-collections.ts
export function useCollections(userId: string) {
  return useQuery({
    queryKey: queryKeys.collections.list(userId),
    queryFn: () => fetchCollections(userId),
  });
}
```

**Functions to convert** (from `hooks/api-endpoints-client.ts`):

- `fetchMe` -> `useMe()`
- `fetchMyAvatar` -> `useMyAvatar(size)`
- `fetchContentNote` -> `useContentNote(userId, category, noteId)`
- `fetchCollections` -> `useCollections(userId)`
- `fetchCollectionItems` -> `useCollectionItems(collectionId)`
- `fetchOrders` -> `useOrders(userId, params)`
- `fetchContentNoteReactions` -> `useContentNoteReactions(noteId)`
- `fetchBatchContentNoteReactions` -> `useBatchContentNoteReactions(noteIds)`
- `searchContent` -> `useContentSearch(category, query)` (with `keepPreviousData: true`)
- `searchProfiles` -> `useProfileSearch(query)` (with `keepPreviousData: true`)

### 3.5 Migrate mutations to `useMutation`

Create mutation hooks in `hooks/mutations/`:

```typescript
// hooks/mutations/use-create-content-note.ts
export function useCreateContentNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, category, data }: CreateContentNoteParams) =>
      createContentNote(userId, category, data),
    onSuccess: (_, { userId, category }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contentNotes.list(userId, category),
      });
    },
    onError: (error) => {
      toastError("Failed to create note", error);
    },
  });
}
```

**Functions to convert:**

- `createContentNote` -> `useCreateContentNote()`
- `updateContentNote` -> `useUpdateContentNote()`
- `deleteContentNote` -> `useDeleteContentNote()`
- `followUser` / `unfollowUser` -> `useToggleFollow()` (with optimistic update)
- `createOrder` -> `useCreateOrder()`
- `approveOrder` / `denyOrder` -> `useUpdateOrderStatus()`
- `createCollection` / `updateCollection` / `deleteCollection` -> collection mutation hooks
- `addCollectionItem` / `removeCollectionItem` -> collection item mutation hooks
- `updateProfile` -> `useUpdateProfile()`
- `reactToContentNote` -> `useReactToContentNote()` (optimistic update)

### 3.6 Refactor `useSortFilterFetch` to use `useInfiniteQuery`

Replace the custom cursor-based pagination in `lib/sort-filter-fetch.ts` with React Query's `useInfiniteQuery`:

```typescript
// lib/use-content-notes-infinite.ts
export function useContentNotesInfinite(
  userId: string,
  category: string,
  sort: string,
  filters: FilterState,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.contentNotes.list(userId, category, filters, sort),
    queryFn: ({ pageParam }) =>
      fetchContentNotes(userId, category, { cursor: pageParam, sort, filters }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}
```

This automatically fixes:

- **Race condition** (Finding #8): React Query cancels stale requests when queryKey changes
- **Stale closures** (Finding #6): No manual `useEffect` dependency arrays needed
- **Loading states**: `isLoading`, `isFetchingNextPage`, `hasNextPage` provided automatically

The intersection observer integration remains the same — call `fetchNextPage()` when the sentinel enters the viewport.

### 3.7 Fix batch reactions over-fetching

**Problem:** `content-note-sort-filter-grid.tsx` re-fetches reactions for ALL items when new items are added (because `contents` array changes).

**Solution:** With `useInfiniteQuery`, reactions can be fetched per-page:

```typescript
// Fetch reactions only for the current page's note IDs
const allNoteIds = pages.flatMap((page) => page.items.map((item) => item.id));

const { data: reactions } = useQuery({
  queryKey: queryKeys.contentNotes.batchReactions(allNoteIds),
  queryFn: () => fetchBatchContentNoteReactions(allNoteIds),
  // Only refetch when the list of IDs actually changes
  enabled: allNoteIds.length > 0,
});
```

Alternatively, use individual `useQuery` per note for granular caching.

### 3.8 Fix debounce inconsistency

**`components/view/dialog/profile-search/profile-search-dialog-content.tsx`:**

Replace the manual `setTimeout` debounce (lines 35-46) with the existing `useDebounce` hook:

```typescript
const [query, setQuery] = useState("");
const debouncedQuery = useDebounce(query, 300);

const { data: results, isLoading } = useProfileSearch(debouncedQuery);
```

This is much cleaner than the current manual approach and consistent with how `select-content-item-dialog-content.tsx` works.

## Migration Strategy

1. Start with `QueryClientProvider` setup (3.1) and key factory (3.2)
2. Migrate one simple read query end-to-end (e.g., `useCollections`) to validate the pattern
3. Migrate remaining reads (3.4) in batches by feature area
4. Migrate `useSortFilterFetch` to `useInfiniteQuery` (3.6) — this is the most complex migration
5. Migrate mutations (3.5) last, since they depend on query invalidation keys being in place
6. Clean up — remove now-unused `useState`/`useEffect` patterns from components

## Verification

- `bun run build` completes successfully
- Profile pages load without flash (hydration from server prefetch)
- Infinite scroll continues to work on content notes grid
- Navigating away and back to a profile shows cached data instantly
- Creating/updating/deleting content notes invalidates the list and shows updated data
- Rapid filter changes don't show stale results (race condition fixed)
- React Query DevTools shows expected cache entries in development
