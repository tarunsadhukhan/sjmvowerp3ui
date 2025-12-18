<!-- Copilot instructions for vowerp3ui repo -->
# vowerp3ui — AI agent quickstart

## TL;DR principles
- Design tokens first: rely on `src/theme/muiTheme.ts` + `tailwind.config.ts`; no ad-hoc hex/px in feature code.
- Composable UI: page files under `src/app/**` must compose wrappers from `src/components/ui/**`, not raw MUI imports.
- Page templates: reuse the 4 archetypes (Index, Transaction, Report, Dashboard) that existing dashboard pages follow.
- Transaction flows must compose `TransactionWrapper` plus the shared transaction hooks (`useLineItems`, `useTransactionSetup`, etc.) from `src/components/ui/transaction`; never hand-roll layout or tables in page files.
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
- **Transaction (form with detail grid)** — Example: `dashboardportal/procurement/indent/createIndent/page.tsx`. Wrap the page in `TransactionWrapper`, drive header fields through `MuiForm`, feed line items via the shared `TransactionLineItems` + `useLineItems`, and hydrate lookups with the transaction hooks (`useTransactionSetup`, `useDeferredOptionCache`, `SearchableSelect`). Keep `mode` logic centralized so view/edit/create remain in sync.
- **Report (read-only filters + export)** — Example: `dashboardadmin/reporting/...` (check existing pages). Provide filter form on top, `muiDataGrid` or charts below, include CSV export via `src/utils/exportToCSV.ts`.
- **Dashboard (cards + quick actions)** — Example: `src/app/dashboardadmin/page.tsx`. Compose KPI cards and summaries from `src/components/dashboard/**` wrapped in responsive grids.
- When creating new pages, clone the closest archetype directory, retain layout/wrapper imports, and only adjust schema/columns/services.

## Component building guidelines
- Add new primitives under `src/components/ui`; expose only the wrapper, never raw MUI APIs to pages.
- Style via theme tokens: use `theme.spacing`, `theme.palette`, or Tailwind utility classes already mapped to design tokens.
- Props should be typed with generics or interfaces in `src/types/ui` (create if missing) so the same component can serve admin/portal contexts.
- Keep components stateless when possible; lift async/data logic into hooks in `src/hooks/**`.
- When wrapping third-party widgets (charts, editors), centralise config defaults inside the wrapper and document usage with a Storybook story in `src/stories/**`.

## Transaction wrapper checklist
- Always render transaction pages inside `TransactionWrapper`; pass metadata, alerts, preview, and actions through its props instead of duplicating layout.
- Feed line items via the `lineItems` prop using `TransactionLineItemsProps` from `src/components/ui/transaction`; rely on `useLineItems` to manage blank rows, selection, and removals.
- Source tenant-aware IDs with `useSelectedCompanyCoId`, load header dropdowns through `useTransactionSetup`, and cache dependent options via `useDeferredOptionCache`.
- Build label maps with `buildLabelMap`/`createLabelResolver` (`src/utils/labelUtils.ts`) so printable previews and tooltips stay consistent across modules.
- Derive metadata for the wrapper preview using `useTransactionPreview`; keep date formatting and optional fields in the accessor callbacks.

## Transaction page architecture (Indent/PO patterns)
When building new transaction pages (e.g., GRN, Invoice, Stock Transfer), follow the proven modular structure from `procurement/indent/createIndent/` and `procurement/purchaseOrder/createPO/`:

### Folder structure for transaction pages
```
src/app/dashboardportal/{module}/{transactionName}/
  page.tsx                    # Main page (Index/listing)
  components/
    {Transaction}Preview.tsx  # Printable preview component
  create{Transaction}/
    page.tsx                  # Transaction create/edit/view page
    components/
      {Transaction}HeaderForm.tsx
      {Transaction}LineItemsTable.tsx  # Column definitions hook + rendering
      {Transaction}ApprovalBar.tsx
      {Transaction}FooterForm.tsx      # Optional: for PO-style footer fields
      {Transaction}Preview.tsx         # Optional: if different from listing preview
      {Transaction}TotalsDisplay.tsx   # Optional: for calculated totals
    hooks/
      use{Transaction}FormState.ts     # Form state management
      use{Transaction}LineItems.ts     # Line item CRUD logic
      use{Transaction}Approval.ts      # Approval workflow handlers
      use{Transaction}FormSchemas.ts   # MuiForm schema generation
      use{Transaction}SelectOptions.ts # Memoised options and label resolvers
      use{Transaction}PageController.ts  # Optional: orchestration hook
      use{Transaction}TaxCalculations.ts # Optional: for tax logic
    types/
      {transaction}Types.ts            # All TypeScript types for the module
    utils/
      {transaction}Constants.ts        # Status IDs, empty arrays, config flags
      {transaction}Factories.ts        # `createBlankLine`, `buildDefaultFormValues`, etc.
      {transaction}Mappers.ts          # API response → UI type converters
      {transaction}Calculations.ts     # Optional: amount/tax/totals calculations
```

### Type definitions pattern (`types/{transaction}Types.ts`)
Define all module-specific types in a single file to prevent circular dependencies:
```typescript
// Basic option type
export type Option = { label: string; value: string };

// Line item type (with all possible fields)
export type EditableLineItem = {
  id: string;
  itemGroup: string;
  item: string;
  itemMake: string;
  quantity: string;
  uom: string;
  remarks: string;
  // Add rate, amount, tax fields for PO-style transactions
};

// Record types for master data
export type DepartmentRecord = { id: string; name: string; branchId?: string };
export type ProjectRecord = { id: string; name: string; branchId?: string };
export type ExpenseRecord = { id: string; name: string };
export type ItemGroupRecord = { id: string; label: string };

// Extended item option with defaults
export type ItemOption = Option & {
  defaultUomId?: string;
  defaultUomLabel?: string;
  defaultRate?: number;
  taxPercentage?: number;
};

// Cache entry for deferred loading
export type ItemGroupCacheEntry = {
  items: ItemOption[];
  makes: Option[];
  uomsByItemId: Record<string, Option[]>;
  itemLabelById: Record<string, string>;
  makeLabelById: Record<string, string>;
  uomLabelByItemId: Record<string, Record<string, string>>;
};

// Setup data from API
export type {Transaction}SetupData = {
  departments: DepartmentRecord[];
  projects: ProjectRecord[];
  expenses: ExpenseRecord[];
  itemGroups: ItemGroupRecord[];
};

// Label resolvers for preview/tooltips
export type {Transaction}LabelResolvers = {
  department: (id: string) => string;
  itemGroup: (id: string) => string;
  item: (groupId: string, itemId: string) => string;
  itemMake: (groupId: string, makeId: string) => string;
  uom: (groupId: string, itemId: string, uomId: string) => string;
};
```

### Constants pattern (`utils/{transaction}Constants.ts`)
```typescript
import type { ApprovalStatusId } from "@/components/ui/transaction";

// Status IDs matching backend workflow
export const {TRANSACTION}_STATUS_IDS = {
  DRAFT: 21,
  OPEN: 1,
  PENDING_APPROVAL: 20,
  APPROVED: 3,
  REJECTED: 4,
  CLOSED: 5,
  CANCELLED: 6,
} as const satisfies Record<string, ApprovalStatusId>;

// Status labels for UI display
export const {TRANSACTION}_STATUS_LABELS: Record<ApprovalStatusId, string> = {
  [{TRANSACTION}_STATUS_IDS.DRAFT]: "Draft",
  [{TRANSACTION}_STATUS_IDS.OPEN]: "Open",
  // ... etc
};

// Immutable empty arrays to avoid re-renders
export const EMPTY_DEPARTMENTS: ReadonlyArray<DepartmentRecord> = Object.freeze([]);
export const EMPTY_PROJECTS: ReadonlyArray<ProjectRecord> = Object.freeze([]);
export const EMPTY_EXPENSES: ReadonlyArray<ExpenseRecord> = Object.freeze([]);
export const EMPTY_ITEM_GROUPS: ReadonlyArray<ItemGroupRecord> = Object.freeze([]);
export const EMPTY_OPTIONS: ReadonlyArray<Option> = Object.freeze([]);

// Default empty params for hooks
export const EMPTY_SETUP_PARAMS: Readonly<{ branchId?: string }> = Object.freeze({});
```

### Factories pattern (`utils/{transaction}Factories.ts`)
```typescript
let lineIdSeed = 0;

export const generateLineId = (): string => {
  lineIdSeed += 1;
  return `line-${lineIdSeed}`;
};

export const createBlankLine = (): EditableLineItem => ({
  id: generateLineId(),
  itemGroup: "",
  item: "",
  itemMake: "",
  quantity: "",
  uom: "",
  remarks: "",
});

export const buildDefaultFormValues = (): Record<string, unknown> => ({
  branch: "",
  date: new Date().toISOString().slice(0, 10),
  // ... transaction-specific defaults
});

export const lineHasAnyData = (line: EditableLineItem): boolean =>
  Boolean(line.itemGroup || line.item || line.quantity || line.remarks);

export const lineIsComplete = (line: EditableLineItem): boolean => {
  const qty = Number(line.quantity);
  return Boolean(line.itemGroup && line.item && line.uom && Number.isFinite(qty) && qty > 0);
};
```

### Mappers pattern (`utils/{transaction}Mappers.ts`)
Map raw API responses to UI types with null-safety:
```typescript
export const mapDepartmentRecords = (records: unknown[]): DepartmentRecord[] =>
  records
    .map((row) => {
      const data = row as Record<string, unknown>;
      const id = data?.dept_id ?? data?.department_id ?? data?.id;
      if (!id) return null;
      return {
        id: String(id),
        name: String(data?.dept_desc ?? data?.dept_name ?? data?.name ?? id),
        branchId: data?.branch_id != null ? String(data.branch_id) : undefined,
      } satisfies DepartmentRecord;
    })
    .filter(Boolean) as DepartmentRecord[];

export const map{Transaction}SetupResponse = (response: unknown): {Transaction}SetupData => {
  const result = response as Record<string, unknown>;
  return {
    departments: mapDepartmentRecords((result?.departments as unknown[]) ?? []),
    projects: mapProjectRecords((result?.projects as unknown[]) ?? []),
    expenses: mapExpenseRecords((result?.expense_types as unknown[]) ?? []),
    itemGroups: mapItemGroupRecords((result?.item_groups as unknown[]) ?? []),
  };
};
```

### Form state hook (`hooks/use{Transaction}FormState.ts`)
```typescript
export function use{Transaction}FormState({ mode }: { mode: MuiFormMode }) {
  const [initialValues, setInitialValues] = React.useState(buildDefaultFormValues);
  const [formValues, setFormValues] = React.useState(buildDefaultFormValues);
  const [formKey, setFormKey] = React.useState(0);
  const formRef = React.useRef<{ submit: () => Promise<void>; isDirty: () => boolean } | null>(null);
  const createDefaultsSeededRef = React.useRef(false);

  const bumpFormKey = React.useCallback(() => setFormKey((prev) => prev + 1), []);

  // Seed defaults in create mode
  React.useEffect(() => {
    if (mode !== "create") {
      createDefaultsSeededRef.current = false;
      return;
    }
    if (!createDefaultsSeededRef.current) {
      const base = buildDefaultFormValues();
      setInitialValues(base);
      setFormValues(base);
      setFormKey((prev) => prev + 1);
      createDefaultsSeededRef.current = true;
    }
  }, [mode]);

  return { initialValues, setInitialValues, formValues, setFormValues, formKey, bumpFormKey, formRef };
}
```

### Line items hook (`hooks/use{Transaction}LineItems.ts`)
Wrap `useLineItems` from transaction primitives:
```typescript
export const use{Transaction}LineItems = ({
  mode,
  itemGroupCache,
  itemGroupLoading,
  ensureItemGroupData,
}: Use{Transaction}LineItemsParams) => {
  const { items: lineItems, setItems: setLineItems, replaceItems, removeItems } =
    useLineItems<EditableLineItem>({
      createBlankItem: createBlankLine,
      hasData: lineHasAnyData,
      getItemId: (item) => item.id,
      maintainTrailingBlank: mode !== "view",
    });

  const handleLineFieldChange = React.useCallback(
    (id: string, field: keyof EditableLineItem, rawValue: string) => {
      if (mode === "view") return;

      // Cascade logic: itemGroup change → reset item, uom, etc.
      if (field === "itemGroup") {
        setLineItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, itemGroup: rawValue, item: "", itemMake: "", uom: "" } : item
          )
        );
        if (rawValue && !itemGroupCache[rawValue] && !itemGroupLoading[rawValue]) {
          void ensureItemGroupData(rawValue);
        }
        return;
      }

      // item change → auto-select default UOM
      if (field === "item") {
        setLineItems((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            const cache = itemGroupCache[item.itemGroup ?? ""];
            const defaultUom = cache?.items.find((opt) => opt.value === rawValue)?.defaultUomId ?? "";
            return { ...item, item: rawValue, uom: defaultUom };
          })
        );
        return;
      }

      // Generic field update
      setLineItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: rawValue } : item))
      );
    },
    [mode, setLineItems, itemGroupCache, itemGroupLoading, ensureItemGroupData]
  );

  return { lineItems, setLineItems, replaceItems, removeLineItems, handleLineFieldChange };
};
```

### Select options hook (`hooks/use{Transaction}SelectOptions.ts`)
Memoize all dropdown options and label resolvers:
```typescript
export const use{Transaction}SelectOptions = ({
  departments, projects, expenses, itemGroups, branchIdForSetup, itemGroupCache,
}: Use{Transaction}SelectOptionsParams) => {
  // Filter options by branch
  const departmentOptions = React.useMemo<Option[]>(() =>
    departments
      .filter((dept) => !branchIdForSetup || !dept.branchId || dept.branchId === branchIdForSetup)
      .map((dept) => ({ label: dept.name, value: dept.id })),
    [departments, branchIdForSetup]
  );

  // Build label maps
  const departmentLabelMap = React.useMemo(() =>
    buildLabelMap([...departments], (d) => d.id, (d) => d.name),
    [departments]
  );

  // Create label resolvers
  const getDepartmentLabel = React.useMemo(() => createLabelResolver(departmentLabelMap), [departmentLabelMap]);

  // Item/make/uom getters from cache
  const getItemOptions = React.useCallback(
    (groupId: string) => itemGroupCache[groupId]?.items ?? [],
    [itemGroupCache]
  );

  return {
    departmentOptions, projectOptions, expenseOptions, itemGroupOptions,
    getDepartmentLabel, getItemGroupLabel, getItemLabel, getMakeLabel, getUomLabel,
    getItemOptions, getMakeOptions, getUomOptions,
    labelResolvers: { department: getDepartmentLabel, itemGroup: getItemGroupLabel, ... },
  };
};
```

### Approval hook (`hooks/use{Transaction}Approval.ts`)
Handle all approval workflow actions:
```typescript
export const use{Transaction}Approval = ({
  mode, requestedId, formValues, details, coId, getMenuId, setDetails,
}: Use{Transaction}ApprovalParams) => {
  const router = useRouter();
  const [approvalLoading, setApprovalLoading] = React.useState(false);

  // Map string status to ApprovalStatusId
  const mapStatusToId = React.useCallback((status?: string): ApprovalStatusId | null => {
    if (!status) return null;
    const normalized = status.toLowerCase();
    if (normalized.includes("draft")) return STATUS_IDS.DRAFT;
    // ... etc
  }, []);

  // Derive current status
  const statusId = React.useMemo<ApprovalStatusId>(() =>
    details?.statusId ?? mapStatusToId(details?.status) ?? STATUS_IDS.DRAFT,
    [details, mapStatusToId]
  );

  // Determine permissions based on status and mode
  const getApprovalPermissions = React.useCallback(
    (status: ApprovalStatusId, currentMode: MuiFormMode, apiPermissions?: ApprovalActionPermissions) => {
      if (apiPermissions) return apiPermissions;
      if (currentMode === "view") return { canViewApprovalLog: true, canClone: true };
      if (status === STATUS_IDS.DRAFT) return { canSave: true, canOpen: true, canCancelDraft: true };
      // ... etc
    }, []
  );

  // Action handlers
  const handleOpen = React.useCallback(async () => { /* ... */ }, []);
  const handleApprove = React.useCallback(async () => { /* ... */ }, []);
  const handleReject = React.useCallback(async () => { /* ... */ }, []);

  return { statusId, approvalInfo, approvalPermissions, approvalLoading, handleOpen, handleApprove, ... };
};
```

### Form schema hook (`hooks/use{Transaction}FormSchemas.ts`)
Generate MuiForm schema with dependencies:
```typescript
export const use{Transaction}FormSchema = ({
  mode, branchOptions, expenseOptions, projectOptions,
}: Use{Transaction}FormSchemaParams): Schema => {
  return React.useMemo(() => ({
    fields: [
      {
        name: "branch",
        label: "Branch",
        type: "select",
        required: true,
        options: branchOptions,
        disabled: mode !== "create",
        grid: { xs: 12, md: 4 },
      },
      {
        name: "date",
        label: "Date",
        type: "date",
        required: true,
        grid: { xs: 12, md: 4 },
      },
      // ... more fields
    ],
  }), [mode, branchOptions, expenseOptions, projectOptions]);
};
```

### Line items table component (`components/{Transaction}LineItemsTable.tsx`)
Return column definitions as a hook:
```typescript
export const use{Transaction}LineItemColumns = ({
  canEdit, departmentOptions, itemGroupOptions, itemGroupLoading, labelResolvers,
  getItemOptions, getMakeOptions, getUomOptions, handleLineFieldChange,
}: Use{Transaction}LineItemColumnsParams): TransactionLineColumn<EditableLineItem>[] => {
  return React.useMemo(() => [
    {
      id: "itemGroup",
      header: "Item Group",
      width: "1.6fr",
      renderCell: ({ item }) => {
        if (!canEdit) {
          return <span className="text-xs">{labelResolvers.itemGroup(item.itemGroup)}</span>;
        }
        const value = itemGroupOptions.find((opt) => opt.value === item.itemGroup) ?? null;
        return (
          <SearchableSelect
            options={itemGroupOptions}
            value={value}
            onChange={(next) => handleLineFieldChange(item.id, "itemGroup", next?.value ?? "")}
            getOptionLabel={(opt) => opt.label}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            placeholder="Search item group"
          />
        );
      },
      getTooltip: ({ item }) => labelResolvers.itemGroup(item.itemGroup) || undefined,
    },
    // ... more columns
  ], [canEdit, itemGroupOptions, labelResolvers, handleLineFieldChange, ...]);
};
```

### Main page orchestration (`create{Transaction}/page.tsx`)
Compose everything together:
```typescript
export default function {Transaction}TransactionPage() {
  const searchParams = useSearchParams();
  const mode: MuiFormMode = /* derive from searchParams */;
  const { coId } = useSelectedCompanyCoId();
  const branchOptions = useBranchOptions();

  // Form state
  const { formValues, setFormValues, formKey, bumpFormKey, formRef, ... } = use{Transaction}FormState({ mode });

  // Item group cache (deferred loading)
  const { cache: itemGroupCache, loading: itemGroupLoading, ensure: ensureItemGroupData } =
    useDeferredOptionCache<string, ItemGroupCacheEntry>({
      fetcher: async (groupId) => {
        const response = await fetch{Transaction}Setup2(groupId);
        return mapItemGroupDetailResponse(response);
      },
    });

  // Line items
  const { lineItems, setLineItems, handleLineFieldChange, ... } = use{Transaction}LineItems({
    mode, itemGroupCache, itemGroupLoading, ensureItemGroupData,
  });

  // Setup data loading
  const { data: setupData, loading: setupLoading } = useTransactionSetup({ ... });

  // Select options and label resolvers
  const { departmentOptions, itemGroupOptions, labelResolvers, ... } = use{Transaction}SelectOptions({
    departments: setupData?.departments ?? EMPTY_DEPARTMENTS,
    itemGroups: setupData?.itemGroups ?? EMPTY_ITEM_GROUPS,
    branchIdForSetup: formValues.branch as string,
    itemGroupCache,
  });

  // Form schema
  const formSchema = use{Transaction}FormSchema({ mode, branchOptions, ... });

  // Approval workflow
  const { approvalInfo, approvalPermissions, handleOpen, handleApprove, ... } = use{Transaction}Approval({
    mode, requestedId, formValues, details, coId, setDetails,
  });

  // Column definitions
  const columns = use{Transaction}LineItemColumns({
    canEdit: mode !== "view",
    itemGroupOptions, itemGroupLoading, labelResolvers, handleLineFieldChange, ...
  });

  return (
    <TransactionWrapper
      title="{Transaction}"
      loading={loading}
      saving={saving}
      error={pageError}
      preview={<{Transaction}Preview ... />}
      approvalBar={<{Transaction}ApprovalBar approvalInfo={approvalInfo} permissions={approvalPermissions} ... />}
      actions={actions}
      lineItems={{ items: lineItems, columns, onRemove: removeLineItems, ... }}
    >
      <{Transaction}HeaderForm
        schema={formSchema}
        formKey={formKey}
        initialValues={initialValues}
        mode={mode}
        formRef={formRef}
        onSubmit={handleSubmit}
        onValuesChange={setFormValues}
      />
    </TransactionWrapper>
  );
}
```

### Key patterns to follow
1. **Separation of concerns**: Types, constants, factories, mappers, hooks, and components each have dedicated files.
2. **Memoization**: All options, label maps, and computed values are memoized with `React.useMemo` and `React.useCallback`.
3. **Deferred loading**: Use `useDeferredOptionCache` for dependent data (item group → items/UOMs).
4. **Cascade resets**: When parent field changes, reset all dependent child fields.
5. **Immutable defaults**: Use `Object.freeze()` on empty arrays to prevent re-renders.
6. **Label resolvers**: Build label maps for tooltips and preview rendering.
7. **Approval workflow**: Centralize status mapping and permission logic in a dedicated hook.
8. **Mode-aware rendering**: Check `mode !== "view"` before allowing edits; disable fields appropriately.

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

## Testing requirements (MANDATORY for new/modified code)

When adding new components, hooks, utilities, or modifying existing code, **always write tests** to validate the changes. This ensures a clear picture of what works and what doesn't.

### Test framework & setup
- **Test runner**: Vitest (configured in `vitest.config.ts`)
- **Testing library**: `@testing-library/react` for component/hook tests
- **Environment**: jsdom for DOM simulation
- **Run tests**: `pnpm test` or `pnpm vitest`

### Test file location & naming
| Code Location | Test Location | Naming |
|---------------|---------------|--------|
| `src/hooks/useMyHook.ts` | `src/hooks/useMyHook.test.ts` | Co-located |
| `src/components/ui/MyComponent.tsx` | `src/components/ui/MyComponent.test.tsx` | Co-located |
| `src/app/.../page.tsx` | `src/app/.../page.test.tsx` or `src/app/.../*.test.ts` | Co-located |
| `src/utils/myUtil.ts` | `src/utils/myUtil.test.ts` | Co-located |
| Complex page logic | `src/app/.../hooks/*.test.ts` | In hooks folder |

### What to test
| Code Change | Required Tests |
|-------------|----------------|
| New hook | State changes, effects, edge cases, return values |
| New component | Rendering, user interactions, props handling |
| New utility function | Input/output, edge cases, error handling |
| Mapper function | API response → UI type conversion, null safety |
| Form logic | Validation, field dependencies, mode switching |
| Bug fix | Regression test that would have caught the bug |

### Test patterns to follow

**Hook tests (using renderHook):**
```typescript
// src/hooks/useMyHook.test.ts
/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useMyFormState } from './useMyFormState';

describe('useMyFormState', () => {
  const mockBuildDefaults = () => ({ name: '', value: '' });

  it('should initialize with default values in create mode', () => {
    const { result } = renderHook(() =>
      useMyFormState({ mode: 'create', buildDefaultFormValues: mockBuildDefaults })
    );

    expect(result.current.formValues.name).toBe('');
    expect(result.current.formValues.value).toBe('');
  });

  it('should update form values when setFormValues is called', () => {
    const { result } = renderHook(() =>
      useMyFormState({ mode: 'create', buildDefaultFormValues: mockBuildDefaults })
    );

    act(() => {
      result.current.setFormValues({ name: 'Test', value: '123' });
    });

    expect(result.current.formValues.name).toBe('Test');
  });

  it('should disable fields in view mode', () => {
    const { result } = renderHook(() =>
      useMyFormState({ mode: 'view', buildDefaultFormValues: mockBuildDefaults })
    );

    expect(result.current.isDisabled).toBe(true);
  });
});
```

**Pure function/utility tests:**
```typescript
// src/utils/calculations.test.ts
import { calculateTotals, calculateTax } from './calculations';

describe('calculateTotals', () => {
  it('should sum line item amounts correctly', () => {
    const lines = [
      { amount: 100, taxAmount: 18 },
      { amount: 200, taxAmount: 36 },
    ];
    const result = calculateTotals(lines);
    expect(result.subtotal).toBe(300);
    expect(result.totalTax).toBe(54);
    expect(result.grandTotal).toBe(354);
  });

  it('should return zeros for empty array', () => {
    const result = calculateTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  it('should handle undefined/null values gracefully', () => {
    const lines = [{ amount: undefined, taxAmount: null }];
    const result = calculateTotals(lines);
    expect(result.subtotal).toBe(0);
  });
});
```

**Mapper function tests:**
```typescript
// src/app/.../utils/myMappers.test.ts
import { mapAPIResponseToFormValues, mapDepartmentRecords } from './myMappers';

describe('mapAPIResponseToFormValues', () => {
  it('should map API response to form values', () => {
    const apiResponse = {
      branch_id: '123',
      po_date: '2025-01-15T00:00:00Z',
      supplier_id: '456',
    };
    const defaults = { branch: '', date: '', supplier: '' };

    const result = mapAPIResponseToFormValues(apiResponse, defaults);

    expect(result.branch).toBe('123');
    expect(result.date).toBe('2025-01-15');
    expect(result.supplier).toBe('456');
  });

  it('should use defaults for missing fields', () => {
    const apiResponse = { branch_id: '123' };
    const defaults = { branch: '', date: '2025-01-01', supplier: 'default' };

    const result = mapAPIResponseToFormValues(apiResponse, defaults);

    expect(result.date).toBe('2025-01-01');
    expect(result.supplier).toBe('default');
  });

  it('should handle null/undefined API response', () => {
    const defaults = { branch: '', date: '', supplier: '' };
    const result = mapAPIResponseToFormValues(null, defaults);
    expect(result).toEqual(defaults);
  });
});

describe('mapDepartmentRecords', () => {
  it('should map raw records to DepartmentRecord type', () => {
    const raw = [
      { dept_id: '1', dept_desc: 'Engineering', branch_id: '10' },
      { dept_id: '2', dept_desc: 'Sales' },
    ];

    const result = mapDepartmentRecords(raw);

    expect(result).toEqual([
      { id: '1', name: 'Engineering', branchId: '10' },
      { id: '2', name: 'Sales', branchId: undefined },
    ]);
  });

  it('should filter out records without id', () => {
    const raw = [{ dept_desc: 'No ID' }, { dept_id: '1', dept_desc: 'Valid' }];
    const result = mapDepartmentRecords(raw);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});
```

**Logic extraction tests (for complex page logic):**
```typescript
// src/app/.../branchLogic.test.ts
describe('resolvedBranchOptions logic', () => {
  function computeResolvedBranchOptions(
    branchOptions: Array<{ label: string; value: string }>,
    branchValue: string,
    poDetailsBranch?: string
  ) {
    if (!branchValue) return branchOptions;
    const exists = branchOptions.some((opt) => String(opt.value) === String(branchValue));
    if (exists) return branchOptions;
    const fallbackLabel = poDetailsBranch || branchValue;
    return [...branchOptions, { label: fallbackLabel, value: branchValue }];
  }

  it('should return branchOptions when branchValue is empty', () => {
    const branchOptions = [{ label: 'A', value: '1' }];
    const result = computeResolvedBranchOptions(branchOptions, '');
    expect(result).toEqual(branchOptions);
  });

  it('should add fallback option when branchValue does NOT exist', () => {
    const branchOptions = [{ label: 'A', value: '1' }];
    const result = computeResolvedBranchOptions(branchOptions, '99', 'My Branch');
    expect(result).toContainEqual({ label: 'My Branch', value: '99' });
  });
});
```

**Component tests:**
```typescript
// src/components/ui/MyButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyButton } from './MyButton';

describe('MyButton', () => {
  it('should render with label', () => {
    render(<MyButton label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<MyButton label="Click" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Click'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<MyButton label="Disabled" onClick={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Running tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm vitest

# Run specific test file
pnpm vitest src/hooks/useMenuId.test.ts

# Run tests matching a pattern
pnpm vitest -t "should calculate"

# Run with coverage
pnpm vitest --coverage

# Run with UI
pnpm vitest --ui
```

### Test checklist for PRs
Before submitting code changes, ensure:
- [ ] All new hooks have corresponding `*.test.ts` files
- [ ] All new utility functions have tests covering happy path + edge cases
- [ ] All mapper functions have tests for null safety and type conversion
- [ ] Complex page logic is extracted and tested in isolation
- [ ] Modified functions have updated tests (if behavior changed)
- [ ] Tests pass locally: `pnpm test`
- [ ] No console errors or warnings in test output
- [ ] TypeScript compiles: `npx tsc --noEmit`

### Testing tips
- **Extract testable logic**: If a page has complex conditional logic, extract it to a pure function and test that function
- **Mock external dependencies**: Use `vi.mock()` for API calls, localStorage, router, etc.
- **Test edge cases**: Empty arrays, null/undefined, boundary values, error states
- **Use `satisfies`**: In mappers, use `satisfies` to catch type mismatches at compile time
- **Co-locate tests**: Keep test files next to the code they test for easy discovery

## Gotchas & dos/don'ts
- Do read existing transaction pages (`procurement/indent/createIndent/`, `procurement/purchaseOrder/createPO/`) before building new ones.
- Do reuse cache utilities (`branchUtils`, etc.) when populating dropdowns; they already handle localStorage versioning.
- Do provide `aria-label`s on icon buttons (lucide icons) and respect theme spacing.
- Do use `satisfies` type assertions in mappers to catch type mismatches early.
- Do use `Object.freeze()` on empty arrays/objects used as defaults to prevent accidental mutations.
- Don't import `@mui/material` or `@mui/x-data-grid` directly in page components—extend the wrappers instead.
- Don't mutate shared option arrays across rows; clone or build per-row maps.
- Don't bypass Zod validation or skip loading/error states—each async UI path must represent all three clearly.
- Don't mix business logic with rendering—keep calculations in utils, state in hooks, and only rendering in components.
- Legacy notice: some older/testing pages still use raw MUI or ad-hoc fetches; treat them as migration targets, but new or touched code must follow the wrappers/services approach above.

---
Let me know if any sections need more depth (architecture diagrams, API workflows, testing specifics) and I can expand them.




