<!-- Copilot instructions for vowerp3ui repo -->
# vowerp3ui — AI agent quickstart

## TL;DR principles
- Design tokens first: rely on `src/theme/muiTheme.ts` + `tailwind.config.ts`; no ad-hoc hex/px in feature code.
- Composable UI: page files under `src/app/**` must compose wrappers from `src/components/ui/**`, not raw MUI imports.
- Page templates: reuse the 4 archetypes (Index, Transaction, Report, Dashboard) that existing dashboard pages follow.
- Index archetype pages must compose `IndexWrapper` from `src/components/ui/IndexWrapper`, not ad-hoc headers or standalone `MuiDataGrid` usage.
- Typed data contracts: share DTOs from `src/types/**`; pagination/filter shapes must match `apiRoutes*` expectations.
- Mode-aware forms: one schema powers create/edit/view via `muiform` and the `mode` prop.
- Predictable side-effects: hit APIs through `fetchWithCookie` (see `src/utils/apiClient2.ts`) using endpoints from `src/utils/api.ts`.
- Local caching: master data (branches, departments, etc.) flows through helpers in `src/utils/branchUtils.ts` before hitting the network.
- Clean structure: keep fetch/services, validation (Zod), and rendering split across utils, hooks, and UI components.

## Architecture & layout
- App Router lives in `src/app`; portal/admin dashboards sit under `dashboardportal/**`, `dashboardadmin/**`, etc., each with their own `layout.tsx`.
- Shared UI primitives (forms, data grid, modals) live in `src/components/ui`; this is the only place to touch MUI primitives.
- API route constants sit in `src/utils/api.ts`; axios wrappers ( `apiClient2.ts`) add cookies/auth interceptors.
- State/util logic is concentrated under `src/utils/**` and `src/hooks/**`; favour these over new ad-hoc helpers.

## Permissions & access control
- Page-level access uses `useSidebarContext()` from `src/components/dashboard/sidebarContext`; call `hasMenuAccess(pathname, action)` to inspect the cached `access_type_id` for the active menu item.
- `access_type_id` mapping: `1` = read, `2` = read + print, `3` = read + print + create, `4` = read + print + create + edit. Use these tiers when deciding whether to expose view, print, create, or edit affordances.

## Page archetypes
- **Index (listing dashboards)** — Example: `src/app/dashboardportal/masters/itemMaster/page.tsx`. Pattern: compose `IndexWrapper` (which handles layout, debounced search, permissions, and `MuiDataGrid` wiring), fetch paged data, and feed wrapper props from local state.
- **Transaction (form with detail grid)** — Example: `dashboardportal/procurement/indent/createIndent/page.tsx`. Combine `muiform` for header info with `muiDataGrid` for line items; maintain per-row caches and enforce `mode` prop.
- **Report (read-only filters + export)** — Example: `dashboardadmin/reporting/...` (check existing pages). Provide filter form on top, `muiDataGrid` or charts below, include CSV export via `src/utils/exportToCSV.ts`.
- **Dashboard (cards + quick actions)** — Example: `src/app/dashboardadmin/page.tsx`. Compose KPI cards and summaries from `src/components/dashboard/**` wrapped in responsive grids.
- When creating new pages, clone the closest archetype directory, retain layout/wrapper imports, and only adjust schema/columns/services.

## Component building guidelines
- Add new primitives under `src/components/ui`; expose only the wrapper, never raw MUI APIs to pages.
- Style via theme tokens: use `theme.spacing`, `theme.palette`, or Tailwind utility classes already mapped to design tokens.
- Props should be typed with generics or interfaces in `src/types/ui` (create if missing) so the same component can serve admin/portal contexts.
- Keep components stateless when possible; lift async/data logic into hooks in `src/hooks/**`.
- When wrapping third-party widgets (charts, editors), centralise config defaults inside the wrapper and document usage with a Storybook story in `src/stories/**`.
## Forms & grids
- `src/components/ui/muiform.tsx` renders schema-driven forms: fields accept `{ name, label, type, options, grid, required, disabled }`. Keep options as `{ label, value }` strings.
- Setup endpoints often return multiple option arrays (see `dashboardportal/masters/itemMaster/createItem.tsx`); map them immediately to label/value pairs and memoise results.
- For DataGrids, use `src/components/ui/muiDataGrid.tsx`. Parent pages manage `rows`, `paginationModel`, and call APIs with `page: paginationModel.page + 1`. Always supply an `id` field.
- Dependent dropdown rows (e.g., procurement indent creation) maintain per-row option caches to avoid leaking values; clear downstream fields before refetching.

## Data & side-effects
- Use `fetchWithCookie(route, method, body?)` for API calls; expect `{ data, error }`. Build GET query strings with `URLSearchParams`.
- Middleware (`src/middleware.ts`) enforces subdomain/session cookies—avoid touching it unless absolutely required.
- When adding new endpoints, extend `apiRoutes...` enums and TypeScript types in `src/types`; propagate through services before UI.

## Workflow & verification
- Core commands: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm test`, `pnpm storybook`, `npx tsc --noEmit`.
- Document manual verification in PRs (which dashboard page you exercised). Keep changes small and note any env vars used.
- Storybook stories under `src/stories/**` illustrate component usage; add new stories when expanding UI primitives.

## Gotchas & dos/don'ts
- Do read existing masters (e.g., `dashboardportal/masters/itemMaster/page.tsx`) before introducing new list/detail flows.
- Do reuse cache utilities (`branchUtils`, etc.) when populating dropdowns; they already handle localStorage versioning.
- Do provide `aria-label`s on icon buttons (lucide icons) and respect theme spacing.
- Don't import `@mui/material` or `@mui/x-data-grid` directly in page components—extend the wrappers instead.
- Don't mutate shared option arrays across rows; clone or build per-row maps.
- Don't bypass Zod validation or skip loading/error states—each async UI path must represent all three clearly.
- Legacy notice: some older/testing pages still use raw MUI or ad-hoc fetches; treat them as migration targets, but new or touched code must follow the wrappers/services approach above.

---
Let me know if any sections need more depth (architecture diagrams, API workflows, testing specifics) and I can expand them.




