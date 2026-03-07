# Phase 1: Cleanup & Hygiene

**Goal:** Remove noise, fix inconsistencies, establish a clean baseline before bigger changes.

**Effort:** ~2-3 hours | ~20 files touched | Low risk

## Tasks

### 1.1 Remove dead code

Delete commented-out code blocks and unreachable code:

- `components/ui/content-note/content-note-card.tsx` — commented-out blocks around lines 274-285, 312-318
- `components/view/dialog/content-note-editor/content-note-editor-dialog-content.tsx` — commented-out lines ~112-126 (will be refactored in Phase 4 but clean up now)
- `components/view/dialog/content-note-creator/content-note-creator-dialog-content.tsx` — same pattern
- `components/view/dialog/create-order/create-order-dialog-content.tsx` — commented-out lines ~133-157
- `components/view/dialog/manual-note-creation/manual-note-creation-dialog-content.tsx` — commented-out lines ~33-47
- `app/auth/components/ory-nodes.tsx` — large commented-out `handleGetFlowError` function
- `app/(view)/[username]/page.tsx` — unreachable JSX after `return redirect(...)` (lines 10-14)
- `middleware.ts` — commented-out old middleware
- `next.config.js` — commented-out experimental features

Delete stale/accidental files:

- `app/auth/login/page1.tsx` (if exists) — alternative page file
- `app/auth/registration/page1.tsx` (if exists) — alternative page file
- `app/(view)/components/menu-sheet-sign-out-btn copy.tsx` — accidental file duplicate (note the space + "copy" in the filename)

### 1.2 Remove duplicate ESLint config

- Delete `.eslintrc.json` (legacy format)
- Keep `eslint.config.mjs` (flat config, the Next.js 15 standard)

### 1.3 Consolidate duplicate utilities

**Duplicate `cn()` utility:**

- Remove `utils/cn.ts`
- Update all imports currently pointing to `@/utils/cn` to use `@/lib/utils` instead
- Search for: `from "@/utils/cn"` or `from '@/utils/cn'`

**Duplicate `Paginated<T>` and `SearchHit<T>` types:**

- Keep canonical definitions in `lib/model/types.ts`
- Update `utils/api/response.ts` to re-export from `lib/model/types`:
  ```typescript
  export { Paginated, SearchHit } from "@/lib/model/types";
  ```
- Update all imports across the codebase to ensure consistency

### 1.4 Normalize file naming

Rename to match the kebab-case convention used throughout the project:

- `hooks/useSidebarToggle.ts` -> `hooks/use-sidebar-toggle.ts`
- `hooks/useStore.ts` -> `hooks/use-store.ts`
- Update all imports referencing these files

### 1.5 Fix import path inconsistencies

In `app/(view)/[username]/layout.tsx`, lines 22-25 use relative paths like `../../../components/view/dialog/...` while lines 3-12 use `@/components/view/dialog/...`. Replace all relative paths with `@/` prefixed absolute imports for consistency.

### 1.6 Pin dependency versions

In `package.json`, replace `"latest"` with specific pinned versions:

| Package                          | Current    | Action                                           |
| -------------------------------- | ---------- | ------------------------------------------------ |
| `react`                          | `"latest"` | Pin to `"^19.0.0"` (or current resolved version) |
| `react-dom`                      | `"latest"` | Pin to `"^19.0.0"`                               |
| `zustand`                        | `"latest"` | Pin to `"^5.0.0"` (or current resolved version)  |
| `@icons-pack/react-simple-icons` | `"latest"` | Pin to resolved version from `bun.lockb`         |

Run `bun install` after changes to verify resolution.

### 1.7 Clean up package manager

- Delete `package-lock.json` from the project
- Verify `.gitignore` contains an entry for `package-lock.json`
- Ensure `bun.lockb` is the only lock file

### 1.8 Update `.env.example`

Add all required environment variables with descriptive comments:

```env
# App domain (used for metadata, links)
NEXT_PUBLIC_DOMAIN=localhost:3000

# Backend API base URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# Backend WebSocket URL
NEXT_PUBLIC_BACKEND_WS=ws://localhost:8080

# Ory Kratos SDK URL
NEXT_PUBLIC_ORY_SDK_URL=http://localhost:4433

# Ory project API token (leave empty for local dev)
ORY_PROJECT_API_TOKEN=

# Environment (development / production)
NODE_ENVIRONMENT=development
```

### 1.9 Add lint script

Add to `package.json` scripts:

```json
"scripts": {
  "dev": "NODE_OPTIONS='--inspect' next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "lint:fix": "next lint --fix"
}
```

## Verification

- `bun run lint` passes without errors
- `bun run build` completes successfully
- No import resolution errors
- All `@/utils/cn` imports have been updated
- No `page1.tsx` or "copy" files remain
