# Pickle Frontend — Improvement Plan Overview

## Summary

This plan addresses stability, developer experience, performance, and new capabilities across the codebase. It's organized into **8 phases**, ordered by dependency and impact.

## Phases

| Phase                               | Name                           | Effort      | Files Touched |
| ----------------------------------- | ------------------------------ | ----------- | ------------- |
| [Phase 1](./phase-1-cleanup.md)     | Cleanup & Hygiene              | ~2-3 hours  | ~20 files     |
| [Phase 2](./phase-2-stability.md)   | Stability & Error Handling     | ~3-4 hours  | ~15 files     |
| [Phase 3](./phase-3-react-query.md) | React Query Migration          | ~8-12 hours | ~40-50 files  |
| [Phase 4](./phase-4-components.md)  | Component Architecture         | ~4-5 hours  | ~10 files     |
| [Phase 5](./phase-5-seo.md)         | SEO & Metadata                 | ~2-3 hours  | ~8 files      |
| [Phase 6](./phase-6-a11y.md)        | Accessibility Hardening        | ~1-2 hours  | ~6 files      |
| [Phase 7](./phase-7-i18n.md)        | Internationalization (EN + RU) | ~8-10 hours | ~50+ files    |
| [Phase 8](./phase-8-polish.md)      | Remaining DX & Infrastructure  | ~2-3 hours  | ~8 files      |

**Total estimated effort: ~30-42 hours**

## Execution Order & Dependencies

```
Phase 1 (Cleanup)  ──>  Phase 2 (Stability)  ──>  Phase 3 (React Query)
                                                         |
                                                         |──>  Phase 4 (Components)
                                                         |──>  Phase 5 (SEO)
                                                         |──>  Phase 6 (A11y)
                                                                    |
                                                              Phase 7 (i18n)
                                                                    |
                                                              Phase 8 (Polish)
```

- **Phases 1-2** should be done first — they establish the stable foundation.
- **Phase 3** (React Query) is the biggest change and unlocks cleaner code in Phases 4-6.
- **Phases 4, 5, 6** can be done in parallel after Phase 3.
- **Phase 7** (i18n) should come after Phase 6 (a11y) since i18n will touch the same UI strings.
- **Phase 8** is cleanup that can happen anytime after Phase 3.

## Key Decisions

- **Package manager**: Bun (canonical). Remove `package-lock.json`.
- **Data fetching**: Migrate to React Query (TanStack Query).
- **i18n**: `next-intl` with English + Russian.
- **Testing**: Deferred to a future round.
