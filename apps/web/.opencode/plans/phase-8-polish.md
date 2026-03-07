# Phase 8: Remaining DX & Infrastructure

**Goal:** Final polish, remove remaining tech debt, and future-proof the developer experience.

**Effort:** ~2-3 hours | ~8 files touched | Low risk

**Depends on:** Phase 3 (React Query should be in place)

## Tasks

### 8.1 Simplify modal/URL sync

**Problem:** `query-params/modal.tsx` uses a fragile bidirectional sync between Zustand and `nuqs` with two `useEffect` hooks and a `useRef` guard (`isInternalChange`). The `JSON.stringify` comparison is brittle and the pattern is prone to infinite render loops.

**Solution:** Make `nuqs` the single source of truth. The Zustand modal store becomes a thin derived layer.

**Approach:**

1. Keep the `nuqs` query params (`?m=` and `?mps=`) as the authoritative state
2. Replace the Zustand modal store with a hook that reads from `nuqs`:

```typescript
// hooks/use-modal.ts
import { useQueryState } from "nuqs";

export function useModal() {
  const [modalType, setModalType] = useQueryState("m");
  const [modalParams, setModalParams] = useQueryState("mps", {
    parse: deserializeParams,
    serialize: serializeParams,
  });

  const openModal = useCallback(
    (type: ModalType, params?: ModalParamValue) => {
      setModalType(type);
      if (params) setModalParams(params);
    },
    [setModalType, setModalParams],
  );

  const closeModal = useCallback(() => {
    setModalType(null);
    setModalParams(null);
  }, [setModalType, setModalParams]);

  return {
    modalType: modalType as ModalType | null,
    modalParams,
    openModal,
    closeModal,
    isOpen: (type: ModalType) => modalType === type,
  };
}
```

3. Update all consumers that currently use `useModalStore()` to use `useModal()` instead
4. Delete `stores/modal.ts` and `providers/modal-provider.tsx`
5. Delete `query-params/modal.tsx` (the sync layer)

**Impact:** This eliminates the bidirectional sync entirely, removes a store + provider, and makes the modal system simpler to reason about.

### 8.2 Add `AbortController` to search inputs

**Problem:** When users type quickly in search dialogs, multiple in-flight requests race and the UI may show results for a stale query.

**Solution:** With React Query (Phase 3), the `queryKey` changes cancel stale queries automatically. However, the underlying fetch should also support the `signal` for proper network-level cancellation.

**Update `utils/api/fetcher.ts`:**

```typescript
export async function apiFetcher<T>(
  path: string,
  params: URLSearchParams,
  options: RequestInit,
  cookies?: string,
): Promise<T> {
  // The signal from React Query is passed through options.signal
  const response = await fetch(url, {
    ...options,
    signal: options.signal, // Already available if passed by caller
  });
  // ...
}
```

**Update `utils/api/client.ts` and `utils/api/server.ts`:**

Ensure the `signal` option is forwarded through the `fetchApi` wrapper:

```typescript
export async function fetchApi<T>(
  path: string,
  options?: RequestInit & { signal?: AbortSignal },
): Promise<T> {
  return apiFetcher<T>(path, new URLSearchParams(), {
    ...options,
    signal: options?.signal,
  });
}
```

React Query automatically provides `signal` to `queryFn` via the context parameter:

```typescript
useQuery({
  queryKey: queryKeys.content.search(category, query),
  queryFn: ({ signal }) => searchContent(category, query, { signal }),
});
```

### 8.3 Remove unused `ws` dependency

**Investigation:** The `ws` WebSocket package is listed as a dependency but no WebSocket usage was found in the frontend code.

**Action:**

1. Search for any imports of `ws` or WebSocket usage: `grep -r "import.*ws\|require.*ws\|WebSocket" --include="*.ts" --include="*.tsx"`
2. If no usage found, remove it: `bun remove ws && bun remove @types/ws` (if `@types/ws` exists)
3. If WebSocket functionality is planned for the future (e.g., real-time notifications), document this in a comment or remove and re-add when needed

### 8.4 Add Prettier config

**Problem:** The ESLint config references Prettier (`eslint-config-prettier`) but no `.prettierrc` config file exists. Developers may have different local Prettier settings.

**Create `.prettierrc`:**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

```bash
bun add -D prettier prettier-plugin-tailwindcss
```

**Add scripts to `package.json`:**

```json
"scripts": {
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

**Create `.prettierignore`:**

```
node_modules
.next
bun.lockb
public
```

**Initial formatting run:**

- Run `bun run format` once to normalize all existing files
- Commit the formatting changes separately so it doesn't pollute the git blame

## Verification

- `bun run build` completes successfully
- Modals open/close correctly via URL params (test browser back/forward)
- Sharing a modal URL (e.g., `?m=game-note&mps=noteId%3Dabc`) opens the correct dialog
- Search dialogs cancel stale requests when typing quickly (verify in Network tab)
- `bun run format:check` passes (all files consistently formatted)
- `ws` package no longer in `node_modules` (if removed)
