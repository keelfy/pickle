# Phase 6: Accessibility Hardening

**Goal:** Make the app usable by everyone and prevent accessibility regressions.

**Effort:** ~1-2 hours | ~6 files touched | Low risk

**Depends on:** Phase 3 (minor). Can be done in parallel with Phases 4 and 5.

## Tasks

### 6.1 Upgrade critical a11y ESLint rules to error

**File:** `eslint.config.mjs`

Currently all `jsx-a11y` rules are set to `warn` (lines 36-41). Upgrade critical rules to `error` so they block builds:

```javascript
rules: {
  // Critical — must be errors
  'jsx-a11y/alt-text': 'error',
  'jsx-a11y/aria-props': 'error',
  'jsx-a11y/aria-proptypes': 'error',
  'jsx-a11y/aria-unsupported-elements': 'error',
  'jsx-a11y/role-has-required-aria-props': 'error',
  'jsx-a11y/role-supports-aria-props': 'error',
  'jsx-a11y/img-redundant-alt': 'error',

  // Important — upgrade to error
  'jsx-a11y/click-events-have-key-events': 'error',
  'jsx-a11y/no-noninteractive-element-interactions': 'error',
  'jsx-a11y/no-static-element-interactions': 'error',
  'jsx-a11y/anchor-is-valid': 'error',

  // Keep as warn for now (may need gradual fixes)
  'jsx-a11y/label-has-associated-control': 'warn',
  'jsx-a11y/no-autofocus': 'warn',
}
```

After upgrading, run `bun run lint` and fix any newly surfaced errors before committing.

### 6.2 Add missing aria-labels

**`app/(view)/navbar.tsx` — notification bell button (~line 90-92):**

```tsx
// Before
<Button variant="ghost" size="icon">
  <Bell className="h-5 w-5" />
</Button>

// After
<Button variant="ghost" size="icon" aria-label="Notifications">
  <Bell className="h-5 w-5" />
</Button>
```

**`app/(view)/[username]/suggestions/suggestion-list-entry.tsx` — accept/reject buttons (~lines 68-91):**

```tsx
// Accept button
<Button aria-label={`Accept suggestion from ${order.suggestedBy}`} ...>
  <Check /> Accept
</Button>

// Reject button
<Button aria-label={`Reject suggestion from ${order.suggestedBy}`} ...>
  <X /> Reject
</Button>
```

**`components/view/dialog/show-more-profile/show-more-profile-dialog-content.tsx` — report button (~line 103):**

```tsx
<Button aria-label="Report this profile" ...>
  Report profile
</Button>
```

### 6.3 Fix follower pluralization

**File:** `app/(view)/[username]/layout.tsx` (~lines 151-153)

Replace the hardcoded `follower(-s)` text with proper pluralization:

```typescript
// Before
<span>{followersCount} follower(-s)</span>

// After
<span>
  {followersCount} {followersCount === 1 ? 'follower' : 'followers'}
</span>
```

Note: This will later be replaced by the i18n pluralization system in Phase 7, but fixing it now ensures correctness.

### 6.4 Add alt text for avatar images

Audit all `<Image>` components used for user avatars and ensure they have descriptive `alt` attributes.

**`app/(view)/[username]/layout.tsx` — profile avatar (~lines 132-136):**

```tsx
// Ensure alt is set
<Image
  src={profile.avatarUrl}
  alt={`${profile.displayName}'s avatar`}
  ...
/>
```

**`app/(view)/navbar.tsx` — current user avatar:**

```tsx
<Image
  src={avatarUrl}
  alt={`${user.displayName}'s avatar`}
  ...
/>
```

**`components/ui/content-note/content-note-card.tsx` — any content cover images:**

Verify all `<Image>` components for content covers have meaningful `alt` text (should use the content title).

### 6.5 Keyboard navigation audit (manual)

Manually verify these interactive flows work with keyboard only (Tab, Enter, Escape):

- [ ] Open/close dialogs
- [ ] Navigate content note grid
- [ ] Accept/reject suggestions
- [ ] Filter and sort controls
- [ ] Profile search dialog
- [ ] Settings tabs

Note: Radix UI primitives handle most of this automatically, but custom interactive elements should be verified. File issues for any problems found.

## Verification

- `bun run lint` passes with the upgraded a11y rules (no errors)
- `bun run build` completes successfully
- Screen reader (VoiceOver on macOS) can navigate the profile page and identify all interactive elements
- All images have meaningful alt text (verify with browser DevTools)
- Follower count shows correct singular/plural form
