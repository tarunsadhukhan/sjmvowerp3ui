<!-- Copilot instructions for vowerp3ui repo -->
# vowerp3ui — Copilot / AI assistant guide

This file gives focused, actionable guidance for an AI coding agent working in this repository. Keep suggestions small, make safe edits, and prefer incremental, testable changes.

Key pointers (high level)
- This is a Next.js 15 app (app router) using React 19 and MUI v7. Major UI lives under `src/app` and reusable UI under `src/components`.
- Backend API is proxied via `NEXT_PUBLIC_API_BASE_URL` (default `/api`). Routes are declared in `src/utils/api.ts` (see `apiRoutesPortalMasters.ITEM_CREATE_SETUP`). Use `fetchWithCookie` in `src/utils/apiClient2.ts` for requests that must forward cookies.
- Edge `middleware.ts` enforces subdomain + session validation and sets a `subdomain` cookie; edits may affect runtime redirects.

Developer workflows & commands
- Start dev server: `pnpm dev` (Next will try port 3000 then 3001). Proxy is enabled by env `USE_NEXT_PROXY=true`.
- Build: `pnpm build`; Start prod: `pnpm start`.
- Tests: `pnpm test` (Jest). Storybook available via `pnpm storybook`.
- Type-check: `npx tsc --noEmit` (run from repo root).

Project-specific conventions and patterns
- API helpers
  - Use `fetchWithCookie(url, method, body)` from `src/utils/apiClient2.ts` for API calls so cookies are forwarded and responses consistently shaped: returns `{ data, error }`.
  - `src/utils/api.ts` centralizes all endpoints; prefer using these constants over hard-coded URLs.

- Data/Setup endpoints
  - Many forms use a single "setup" endpoint that returns multiple arrays (e.g., `item_groups`, `uom_groups`, `item_types`). Example consumer: `src/app/dashboardportal/masters/itemMaster/createItem.tsx`.
  - Confirm the exact property names (e.g., `item_groups` not `itemgroups`) before mapping options — mismatches cause empty selects.

- Form pattern
  - The repo uses a schema-driven form component at `src/components/ui/muiform.tsx`. Schema fields include: `name, label, type, options, grid, required`.
  - `select` fields expect `options: { label: string, value: string | number }[]`. Keep option `value` consistent (string preferred) to avoid mismatches in MUI Select.
  - there are 3 modes for any form, `view`, `edit`, and `create`. the form compnent at `src/components/ui/muiform.tsx` has functionality for all 3 modes. call for the api with "_SETUP" for create mode, for edit, the specific id will be passed in and will have edit, and for view, this will also use similiar logic to edit mode, but the entry fields will be disabled 



- Dialogs and Autocomplete
  - MUI `Autocomplete` inside Dialogs may require portal adjustments; in this repo most working examples use native `Select` + `MenuItem` (see `CreateItemGroupPage.tsx`). Prefer that pattern if Autocomplete has z-index issues.

- Validation logic for entry fields
  - use zod for schema validation.

Files to inspect when editing forms or dropdowns
- `src/components/ui/muiform.tsx` — core renderer used across many pages.
- `src/app/dashboardportal/.../*` — many dashboard pages; use these as canonical examples (e.g., `CreateItemGroupPage.tsx`).
- `src/utils/api.ts` and `src/utils/apiClient2.ts` — endpoints and the cookie-aware fetch helper.

Data grid (MuiDataGrid) pattern
- Central component: `src/components/ui/muiDataGrid.tsx`. Prefer using this wrapper instead of dropping `DataGrid` directly — it standardizes styles, pagination props, getRowId, and loading behavior.
- Typical parent pattern (see `src/app/dashboardportal/masters/itemMaster/page.tsx` and `itemGroupMaster/page.tsx`):
  - Keep a local `rows` array, `loading` flag, `paginationModel` ({ page: number, pageSize: number }) and `totalRows` state in the page component.
  - Debounce search input (500ms) with setTimeout, then call the fetch function and reset page to 0.
  - When calling the API, convert the UI's 0-based `paginationModel.page` to the API's 1-based page parameter: `page: paginationModel.page + 1`.
  - Use `fetchWithCookie` and `apiRoutesPortalMasters.*` constants to request data. API responses are commonly shaped like `{ data: [...], total: number }`.
  - Map API rows to the grid's expected shape, ensuring an `id` property exists (example: `id: row.item_id ?? row.id`). Also normalize types (e.g., `active` may be a string; cast to number).
  - Pass grid props:
    - `rows={rows}`
    - `columns={columns}` where `columns` is a `GridColDef[]` with any `renderCell` custom renderers (actions, links, tooltips).
    - `rowCount={totalRows}`
    - `paginationModel={paginationModel}` and `onPaginationModelChange={handlePaginationModelChange}`
    - `loading={loading}` and `showLoadingUntilLoaded={true}` when you want the wrapper to honor the loading state until data arrives.
  - Implement `handlePaginationModelChange` to update the local pagination state.
  - Use `getRowId={(row) => row.id ?? row.co_id}` (the wrapper already does this) so rows with different id fields still work.
- Column tips:
  - Add clickable cells using `renderCell` to open details (see `item_code`/`item_name` in `itemMaster/page.tsx`).
  - Add an `actions` column with small icon buttons for View/Edit. Use `lucide-react` icons (Eye/Edit) to avoid adding `@mui/icons-material`.
- Why this pattern: it centralizes grid styling and pagination logic, ensures consistent server-side paging, and reduces repeated boilerplate across pages.

Testing and verification tips for small edits
- Add narrow console.logs close to the data source (e.g., after `fetchWithCookie(...)`) and in `useMemo` mappings to prove array/field names are correct.
- Create a minimal local test component under `src/app/.../TestSelect.tsx` that uses `muiform` with static options to verify UI behavior before wiring API data.
- When changing middleware or route constants, run dev and open `http://localhost:3001` (Next picks 3001 if 3000 in use).

Do's and Don'ts for the assistant
- Do: make minimal, type-safe edits; update or add console logs for troubleshooting; run `npx tsc --noEmit` and `npm run dev` to validate changes when possible.
- Don't: change global middleware behavior without explicit confirmation — `middleware.ts` can redirect the dev server to external domains if subdomain logic fails.
- Don't: assume API shapes — always read the consuming code (`CreateItemGroupPage.tsx`, `UOMMappingTable.tsx`) to infer expected keys.

Examples (copy/paste safe snippets)
- Map setup `item_groups` to options:
```ts
const itemGroupOptions = (setupData?.item_groups ?? []).map((g:any) => ({
  label: `${g.item_grp_name_display} (${g.item_grp_code_display})`,
  value: String(g.item_grp_id),
}));
```

- Use cookie-aware fetch:
```ts
const { data, error } = await fetchWithCookie(apiRoutesPortalMasters.ITEM_CREATE_SETUP, 'GET');
```

If unclear or missing details
- Ask for a small sample of the failing API response (JSON) or a screenshot of the UI console logs. That lets you verify key names (e.g., `item_groups` vs `itemgroups`).

If you want changes merged automatically
- Keep changes under 100 lines per PR, include test or manual verification steps in PR description, and avoid touching `middleware.ts` unless necessary.

---
Please review and tell me which sections should be expanded (architecture, examples, or CI details) or if you want me to automatically open a PR with this file added.




