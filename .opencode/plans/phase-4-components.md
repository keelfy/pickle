# Phase 4: Component Architecture Improvements

**Goal:** Reduce duplication, improve scalability of the dialog system, and simplify complex components.

**Effort:** ~4-5 hours | ~10 files touched | Medium risk

**Depends on:** Phase 3 (React Query migration simplifies some component state)

## Tasks

### 4.1 Unify ContentNote Editor/Creator

**Problem:** `content-note-editor-dialog-content.tsx` (259 lines) and `content-note-creator-dialog-content.tsx` (258 lines) are ~90% identical. They share the same form schema, layout, imports, and JSX. The only differences are:

- Creator fetches content by ID; editor fetches the existing note
- Submit calls `createContentNote` vs `updateContentNote`
- Different toast messages
- Editor pre-fills the form; creator starts empty

**Solution:** Merge into a single `ContentNoteFormDialogContent` component.

**File:** `components/view/dialog/content-note-form/content-note-form-dialog-content.tsx`

```typescript
type ContentNoteFormMode = "create" | "edit";

interface ContentNoteFormDialogContentProps<V, R> {
  mode: ContentNoteFormMode;
  category: ContentCategory;
  // For 'create' mode: the content item to create a note for
  contentId?: string;
  // For 'edit' mode: the existing note to edit
  noteId?: string;
  // Type-specific form extension (game-specific fields, etc.)
  formExtension?: React.ReactNode;
  // ... shared props
}
```

Key implementation details:

- Use a `mode` prop to switch between create/edit behavior
- Data fetching: with React Query, use `useContentNote()` for edit mode or `useContent()` for create mode
- Submit: use `useCreateContentNote()` or `useUpdateContentNote()` mutation based on mode
- Both game-note and movie-note specific dialogs continue to extend this base via `formExtension`

**Files to modify:**

- Create: `components/view/dialog/content-note-form/content-note-form-dialog-content.tsx`
- Update: `components/view/dialog/game-note-editor/game-note-editor-dialog-content.tsx` — point to new base
- Update: `components/view/dialog/game-note-creator/game-note-creator-dialog-content.tsx` — point to new base
- Update: `components/view/dialog/movie-note-editor/` — same
- Update: `components/view/dialog/movie-note-creator/` — same
- Delete: `components/view/dialog/content-note-editor/content-note-editor-dialog-content.tsx`
- Delete: `components/view/dialog/content-note-creator/content-note-creator-dialog-content.tsx`

### 4.2 Extract dialog registry from profile layout

**Problem:** `app/(view)/[username]/layout.tsx` imports and renders 14 dialog components (lines 202-221). Every new dialog requires modifying this file.

**Solution:** Extract into a dedicated component.

**Create:** `app/(view)/[username]/components/profile-dialogs.tsx`

```typescript
'use client';

import { GameNoteDialog } from '@/components/view/dialog/game-note/game-note-dialog';
import { MovieNoteDialog } from '@/components/view/dialog/movie-note/movie-note-dialog';
// ... all other dialog imports

export function ProfileDialogs() {
  return (
    <>
      <GameNoteDialog />
      <MovieNoteDialog />
      <GameNoteEditorDialog />
      <MovieNoteEditorDialog />
      <GameNoteCreatorDialog />
      <MovieNoteCreatorDialog />
      <SelectContentItemDialog />
      <ContentCollectionsDialog />
      <ManualNoteCreationDialog />
      <CollectionItemsDialog />
      <ApproveOrderDialog />
      <CreateOrderDialog />
      <ProfileSearchDialog />
      <DenyOrderDialog />
    </>
  );
}
```

**Update:** `app/(view)/[username]/layout.tsx`:

- Remove all 14 dialog imports
- Import and render `<ProfileDialogs />` instead
- Layout file becomes focused on layout concerns only

### 4.3 Consolidate suggestion list entry desktop/mobile duplication

**Problem:** In `app/(view)/[username]/suggestions/suggestion-list-entry.tsx`, lines 94-190, the desktop and mobile rendering of the order decision section is almost fully duplicated, differing only in layout classes and a single emoji.

**Solution:** Extract a shared `OrderDecisionSection` component:

```typescript
interface OrderDecisionSectionProps {
  order: Order;
  variant: 'desktop' | 'mobile';
  onApprove: () => void;
  onDeny: () => void;
  isPending: boolean;
}

function OrderDecisionSection({ order, variant, onApprove, onDeny, isPending }: OrderDecisionSectionProps) {
  const isDesktop = variant === 'desktop';

  return (
    <div className={cn(
      'flex items-center gap-2',
      isDesktop ? 'flex-row' : 'flex-col w-full'
    )}>
      {/* Shared button/status rendering logic */}
    </div>
  );
}
```

### 4.4 Fix unsafe type assertions in form dialogs

**Problem:** The editor/creator dialog contents use `as unknown as R` double assertions (lines 85, 189 in both files) because the generic type relationships between form values, request types, and zod schemas are not properly constrained. The `formExtension` prop is typed as `object`.

**Solution:** After the unification in 4.1, properly constrain the generics:

```typescript
// Define the relationship between form values and request types
interface ContentNoteFormConfig<V extends FieldValues, R> {
  schema: ZodType<V>;
  defaultValues: V;
  toRequest: (values: V) => R;
  formExtension?: (form: UseFormReturn<V>) => React.ReactNode;
}
```

This eliminates the need for `as unknown as` because the `toRequest` function handles the type transformation explicitly and type-safely.

## Verification

- `bun run build` completes successfully
- Creating a game note works end-to-end (uses new unified form component)
- Editing a movie note works end-to-end
- All 14 dialogs still render and function correctly via `<ProfileDialogs />`
- Approve/deny order flow works on both desktop and mobile
- No TypeScript errors — no `as unknown as` assertions remain in form dialogs
