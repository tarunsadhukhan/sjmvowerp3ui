<!-- Copilot instructions for vowerp3ui repo -->
# vowerp3ui — AI agent quickstart

> **For detailed patterns and code examples, see [AGENTS_GUIDE.md](../AGENTS_GUIDE.md)**

## TL;DR principles
| Principle | Rule |
|-----------|------|
| Design tokens | Use `src/theme/muiTheme.ts` + `tailwind.config.ts`; no ad-hoc hex/px |
| Composable UI | Pages compose wrappers from `src/components/ui/**`, not raw MUI |
| Page templates | Reuse 4 archetypes: Index, Transaction, Report, Dashboard |
| Transaction flows | Use `TransactionWrapper` + shared hooks (`useLineItems`, `useTransactionSetup`) |
| Index pages | Use `IndexWrapper` from `src/components/ui/IndexWrapper` |
| Mode-aware forms | One schema powers create/edit/view via `MuiForm` and `mode` prop |
| API calls | Use `fetchWithCookie` from `src/utils/apiClient2.ts` |
| Clean structure | Separate: services/utils, validation (Zod), hooks, and UI components |

## Key directories
| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages and layouts |
| `src/components/ui/` | Shared UI primitives (forms, data grid, modals) |
| `src/hooks/` | Shared custom React hooks |
| `src/utils/api.ts` | API route constants |
| `src/utils/apiClient2.ts` | Axios wrappers with cookies/auth interceptors |
| `src/types/` | Shared TypeScript type definitions |

## Page archetypes
| Type | Wrapper | Example |
|------|---------|---------|
| Index | `IndexWrapper` | `masters/itemMaster/page.tsx` |
| Transaction | `TransactionWrapper` | `procurement/indent/createIndent/page.tsx` |
| Report | Filter form + DataGrid | `dashboardadmin/reporting/...` |
| Dashboard | KPI cards + grids | `dashboardadmin/page.tsx` |

## Cross-repo API patterns (vowerp3be ↔ vowerp3ui)

### Backend endpoint naming convention
```
GET  /api/{module}/get_{entity}_list          → List with pagination
GET  /api/{module}/get_{entity}_by_id/{id}    → Single record
GET  /api/{module}/get_{entity}_setup_1       → Initial dropdown options
GET  /api/{module}/get_{entity}_setup_2       → Secondary dependent options
POST /api/{module}/create_{entity}            → Create new record
PUT  /api/{module}/update_{entity}/{id}       → Update existing record
```

### Frontend service pattern
```typescript
// src/utils/{module}Service.ts
export const fetch{Entity}List = async (coId: string, params: PaginationParams) =>
  fetchWithCookie(apiRoutes.{module}.get{Entity}List(coId, params), "GET");

export const fetch{Entity}ById = async (coId: string, id: string) =>
  fetchWithCookie(apiRoutes.{module}.get{Entity}ById(coId, id), "GET");

export const fetch{Entity}Setup1 = async (coId: string) =>
  fetchWithCookie(apiRoutes.{module}.get{Entity}Setup1(coId), "GET");
```

### Standard response shapes
```typescript
// List response
{ data: T[], total: number, page: number, page_size: number }

// Setup response (dropdown options)
{ branches: [], departments: [], item_groups: [], co_config: {} }

// Detail response
{ ...entityFields, status_id: number, created_by: string, ... }
```

### Multi-tenant context
- Frontend sends `co_id` as query param: `?co_id=123`
- Backend extracts tenant from subdomain/headers via `get_tenant_db`
- Always source `coId` from `useSelectedCompanyCoId()` hook

## Transaction page quick reference
For full patterns, see AGENTS_GUIDE.md § Transaction Page Architecture.

```
create{Transaction}/
├── page.tsx              # Main orchestrator
├── components/           # UI components
├── hooks/                # State and logic hooks
├── types/                # TypeScript types
└── utils/                # Constants, factories, mappers
```

Key hooks to use:
- `useLineItems` — Manage line item CRUD with trailing blank
- `useTransactionSetup` — Fetch dropdown options on mount
- `useDeferredOptionCache` — Lazy-load dependent options (items by group)
- `buildLabelMap` / `createLabelResolver` — Map IDs to display labels

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
- Do declare `useMemo`/`useCallback` hooks in dependency order — a hook that references another must be declared **after** it (block-scoped `const` is not hoisted like `function`).
- Don't import `@mui/material` or `@mui/x-data-grid` directly in page components—extend the wrappers instead.
- Don't mutate shared option arrays across rows; clone or build per-row maps.
- Don't bypass Zod validation or skip loading/error states—each async UI path must represent all three clearly.
- Don't mix business logic with rendering—keep calculations in utils, state in hooks, and only rendering in components.
- Don't reference a `useMemo`/`useCallback` variable before its declaration — this causes "Block-scoped variable used before its declaration" build errors.
- Legacy notice: some older/testing pages still use raw MUI or ad-hoc fetches; treat them as migration targets, but new or touched code must follow the wrappers/services approach above.

---
Let me know if any sections need more depth (architecture diagrams, API workflows, testing specifics) and I can expand them.




