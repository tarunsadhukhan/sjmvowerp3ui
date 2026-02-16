# VoWERP3 Frontend - Developer Guide for Claude

## Project Overview

VoWERP3 UI is a **multi-tenant ERP frontend** built with **Next.js 15**, **TypeScript**, and **React 19**. It provides a modern, type-safe interface for complex ERP operations including procurement, inventory, sales, and jute/yarn management.

**Tech Stack:** Next.js 15 (App Router) | TypeScript (strict) | React 19 | Tailwind CSS 4.1 + MUI 7.3 | Zod 4.2 | React Hook Form 7.69 | Vitest + Storybook | pnpm

**Current Repo:** `vowerp3ui` | **Backend:** `vowerp3be` (FastAPI/Python)

---

## Three-Dashboard Architecture (MOST IMPORTANT)

The app has **three completely separate dashboards** for three user personas. Each has its own layout, sidebar, menus, API endpoints, and permission model. **Identify which dashboard you're working in before writing any code.**

### Dashboard 1: VOW Admin (Control Desk) — `/dashboardctrldesk`

**Purpose:** System-wide super admin managing all organizations/tenants.

| Aspect | Details |
|--------|---------|
| **Route prefix** | `/dashboardctrldesk/` |
| **Layout** | `src/app/dashboardctrldesk/layout.tsx` |
| **Sidebar** | `SidebarConsole` → `sidebarConsole.tsx` |
| **Menu hook** | `use-org-ctrldesk.tsx` → fetches from `MENU_CTRLDESK` |
| **Login endpoint** | `SUPERADMINLOGINCONSOLE` → `/authRoutes/loginconsole` |
| **API prefix** | `/ctrldskAdmin/` |
| **Backend DB** | `vowconsole3` (no org filter) |
| **Subdomain** | `admin` (hardcoded detection) |
| **Pages** | orgSetup, roleManagementAdmin, userManagementAdmin, menuManagement, orgModuleMap |

### Dashboard 2: Tenant Admin — `/dashboardadmin`

**Purpose:** Company-level admin for a single tenant/organization.

| Aspect | Details |
|--------|---------|
| **Route prefix** | `/dashboardadmin/` |
| **Layout** | `src/app/dashboardadmin/layout.tsx` |
| **Sidebar** | `SidebarConsole` → `sidebarCompanyConsole.tsx` |
| **Menu hook** | `use-org-console_menu.tsx` → fetches from `GET_TENANT_ADMIN_MENU_ROLE` |
| **Login endpoint** | `USERLOGINCONSOLE` → `/authRoutes/login` |
| **API prefix** | `/companyAdmin/` |
| **Backend DB** | `vowconsole3` (scoped by `con_org_id`) |
| **Subdomain** | Tenant subdomain (e.g., `dev3`, `sls`) |
| **Pages** | companyManagement, branchManagement, deptManagement, roleManagement, userManagement, approvalHierarchy |

### Dashboard 3: Tenant Portal — `/dashboardportal`

**Purpose:** Day-to-day operational users (procurement, inventory, sales, production).

| Aspect | Details |
|--------|---------|
| **Route prefix** | `/dashboardportal/` |
| **Layout** | `src/app/dashboardportal/layout.tsx` |
| **Sidebar** | `Sidebar` → `sidebar.tsx` + `SidebarProvider` + `PortalPermissionBoundary` |
| **Menu hook** | `SidebarContext` (context-based, with localStorage caching) |
| **Login endpoint** | `USERLOGINCONSOLE` → `/authRoutes/login` |
| **API prefix** | `/admin/PortalData/` (admin) + business routes (`/itemMaster/`, `/procurementIndent/`, etc.) |
| **Backend DB** | Tenant-specific DB (e.g., `dev3`, `sls`) |
| **Subdomain** | Tenant subdomain |
| **Permission model** | Action-level: view(1), print(2), create(3), edit(4) via `portal_permission_token` |
| **State management** | `SidebarProvider` context (companies, branches, menus, permissions) |
| **Pages** | masters/, procurement/, inventory/, jutePurchase/, juteProduction/ |

### Login Flow (Unified Form)

The login form (`src/components/auth/login-form.tsx`) is shared but routes differently:

```typescript
// Subdomain detection
if (subdomain === "admin") {
  // → Control Desk login → redirects to /dashboardctrldesk
  loginFunction = loginConsole;  // POST /authRoutes/loginconsole
} else if (loginType === "portal") {
  // → Portal login → redirects to /dashboardportal
  loginFunction = login;         // POST /authRoutes/login
} else {
  // → Tenant Admin login → redirects to /dashboardadmin
  loginFunction = loginConsole;  // POST /authRoutes/loginconsole
}
```

Both login functions send `X-Subdomain` header extracted from hostname.

### Permission Differences

| Dashboard | Permission Model | Middleware Check |
|-----------|-----------------|-----------------|
| Control Desk | Role-based (via menu structure) | Access token only |
| Tenant Admin | Role-based (via menu structure) | Access token only |
| Portal | **Action-level** (view/print/create/edit per menu) | Access token + `portal_permission_token` + per-route permission check |

Portal permission check (`src/middleware.ts`):
```typescript
if (pathname.startsWith('/dashboardportal')) {
  const action = determinePortalAction(pathname); // 'view', 'create', 'edit', 'print'
  // Validates permission level >= action threshold
}
```

### API Routes by Dashboard (`src/utils/api.ts`)

**Three route objects:**
- `apiRoutesconsole` — Control Desk endpoints (prefix: `/ctrldskAdmin/`)
- `apiRoutes` — Tenant Admin endpoints (prefix: `/companyAdmin/`)
- `apiRoutesPortalMasters` + business routes — Portal endpoints

### Key Frontend Files by Dashboard

| Control Desk | Tenant Admin | Portal |
|-------------|-------------|--------|
| `src/app/dashboardctrldesk/layout.tsx` | `src/app/dashboardadmin/layout.tsx` | `src/app/dashboardportal/layout.tsx` |
| `src/components/dashboard/sidebarConsole.tsx` | `src/components/dashboard/sidebarCompanyConsole.tsx` | `src/components/dashboard/sidebar.tsx` |
| `src/hooks/use-org-ctrldesk.tsx` | `src/hooks/use-org-console_menu.tsx` | `src/components/dashboard/sidebarContext.tsx` |
| — | — | `src/utils/portalPermissions.ts` |

### Choosing Where to Add New Pages

| If the page is for... | Put it under... | API prefix |
|----------------------|----------------|------------|
| Managing organizations, system menus | `dashboardctrldesk/` | `/ctrldskAdmin/` |
| Managing companies, branches, departments, tenant users | `dashboardadmin/` | `/companyAdmin/` |
| Managing portal users, roles, menus, approvals | `dashboardportal/` (uses `/admin/PortalData/`) | `/admin/PortalData/` |
| Business operations (procurement, masters, inventory) | `dashboardportal/{module}/` | `/{moduleName}/` |

---

## Critical Principles

### 1. TypeScript Standards (MANDATORY)

**Strict Mode is Enabled:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Rules:**
- ❌ **NEVER use `any` type** (use `unknown` with type guards)
- ✅ **Always define interfaces** for component props
- ✅ **Use type inference** where possible
- ✅ **Path alias `@/*`** maps to `./src/*`
- ✅ **Avoid circular dependencies** - use single type definition files per module

**Example:**
```typescript
// ❌ Wrong
function processData(data: any) {
  return data.value;
}

// ✅ Correct
interface DataItem {
  value: string;
  id: number;
}

function processData(data: DataItem | unknown) {
  if (isDataItem(data)) {
    return data.value;
  }
  throw new Error("Invalid data");
}

function isDataItem(obj: unknown): obj is DataItem {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "value" in obj &&
    "id" in obj
  );
}
```

### 2. Form Validation with Zod (MANDATORY)

**Zod is REQUIRED for ALL forms and API inputs:**

```typescript
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// 1. Define schema
const createIndentSchema = z.object({
  date: z.date(),
  department_id: z.number().min(1, "Department is required"),
  branch_id: z.number().min(1, "Branch is required"),
  remarks: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

// 2. Infer TypeScript type from schema
type CreateIndentForm = z.infer<typeof createIndentSchema>;

// 3. Use with React Hook Form
const { control, handleSubmit, formState: { errors } } = useForm<CreateIndentForm>({
  resolver: zodResolver(createIndentSchema),
  defaultValues: {
    date: new Date(),
    remarks: "",
    priority: "medium",
  },
});

// 4. Submit handler with type safety
const onSubmit = (data: CreateIndentForm) => {
  // data is fully typed and validated
  console.log(data.department_id); // TypeScript knows this is a number
};
```

**Benefits:**
- ✅ Runtime validation + compile-time type safety
- ✅ Automatic error messages
- ✅ Single source of truth for types and validation

### 3. Component Organization Rules

**Two-Tier Component Structure:**

#### A. Generic/Shared Components
**Location:** `src/components/ui/` or `src/components/{feature}/`

**Use when:**
- Component is used by **multiple pages** or features
- Component provides reusable UI functionality
- Component is generic enough to be documented

**Examples:**
- `Button`, `Card`, `Dialog`
- `DataTable`, `SearchableSelect`
- `IndexWrapper`, `FormFieldWrapper`
- `ApprovalActionsBar`, `ConfirmationDialog`

**Requirements:**
- Must have JSDoc documentation
- Must have well-defined prop interfaces
- Should be pure/presentational when possible

```typescript
/**
 * @component FormFieldWrapper
 * @description Wraps form fields with label, validation, and error display
 * @example
 * <FormFieldWrapper label="Name" error={errors.name}>
 *   <input {...register("name")} />
 * </FormFieldWrapper>
 */
interface FormFieldWrapperProps {
  label: string;
  error?: FieldError;
  required?: boolean;
  children: React.ReactNode;
}

export function FormFieldWrapper({ label, error, required, children }: FormFieldWrapperProps) {
  // Implementation
}
```

#### B. Page-Specific Components
**Location:** `_components` subfolder within page directory

**Use when:**
- Component is used **only by that specific page** or its immediate children
- Component contains page-specific logic or state
- Component is tightly coupled to page requirements

**Example Structure:**
```
src/app/dashboardportal/procurement/indent/createIndent/
  page.tsx                             # Main page (container)
  _components/
    IndentHeaderForm.tsx               # Page-specific header form
    IndentLineItemsTable.tsx           # Page-specific table
    IndentApprovalBar.tsx              # Page-specific approval (or use shared)
    IndentFooterForm.tsx               # Page-specific footer
```

**Why this matters:**
- Keeps global component directory clean and maintainable
- Makes it clear which components are reusable vs. page-specific
- Reduces cognitive load when navigating codebase

### 4. Smart vs. Dumb Component Pattern

**Smart Components (Containers):**
```typescript
// page.tsx - Smart component
"use client";

import { useState, useEffect } from "react";
import { IndentForm } from "./_components/IndentForm";
import { fetchIndentSetup } from "@/utils/indentService";

export default function CreateIndentPage() {
  const [setupData, setSetupData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Data fetching
    fetchIndentSetup().then(setSetupData);
  }, []);

  const handleSave = async (formData) => {
    // Business logic
    await saveIndent(formData);
  };

  // Smart: handles state, data, logic
  return <IndentForm data={setupData} onSave={handleSave} />;
}
```

**Dumb Components (Presentational):**
```typescript
// _components/IndentForm.tsx - Dumb component
interface IndentFormProps {
  data: SetupData | null;
  onSave: (formData: IndentFormData) => void;
}

export function IndentForm({ data, onSave }: IndentFormProps) {
  // Pure rendering based on props
  // Emits events via callbacks
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSave(formData);
    }}>
      {/* Render UI */}
    </form>
  );
}
```

---

## Styling Standards

### Three-Layer Approach

**1. Tailwind CSS - Layout & Spacing**
```typescript
<div className="flex flex-col gap-4 p-6">
  <div className="grid grid-cols-2 gap-4">
    {/* Layout structure */}
  </div>
</div>
```

**2. MUI Components - Complex Interactions**
```typescript
import { DataGrid, Autocomplete, Dialog } from "@mui/material";

<DataGrid
  rows={rows}
  columns={columns}
  pageSize={10}
  // Complex interactive component
/>
```

**3. Theme Tokens - Colors & Typography**
```typescript
import { tokens } from "@/styles/tokens";

// ❌ NEVER hardcode colors
<button style={{ backgroundColor: "#1976d2" }}>Click</button>

// ✅ ALWAYS use theme tokens
<button style={{ backgroundColor: tokens.brand.primary }}>Click</button>

// ✅ OR use Tailwind with CSS variables
<button className="bg-primary hover:bg-primary-hover">Click</button>
```

**Theme Architecture:**
- `src/styles/tokens.ts` - Color palette, typography, shadows
- `src/styles/theme.ts` - MUI theme configuration
- `src/styles/AppThemeProvider.tsx` - Theme provider component
- `tailwind.config.ts` - Tailwind theme extending CSS variables

---

## Transaction Page Architecture (Advanced)

**For documents with approval workflows (Indent, PO, GRN, Invoice)**

### Folder Structure (Standard)
```
{transactionName}/
  page.tsx                              # List/index page
  components/
    {Transaction}Preview.tsx            # Preview modal/component
  create{Transaction}/
    page.tsx                            # Create/edit/view page (Smart container)
    _components/                        # Page-specific presentational components
      {Transaction}HeaderForm.tsx       # Header fields
      {Transaction}LineItemsTable.tsx   # Line items grid (with column hook)
      {Transaction}FooterForm.tsx       # Footer/summary (optional)
      {Transaction}TotalsDisplay.tsx    # Calculated totals (optional)
    hooks/                              # CRITICAL: Custom hooks for page logic
      use{Transaction}FormState.ts      # Form state + formRef + formKey
      use{Transaction}LineItems.ts      # Line item CRUD + cascade logic
      use{Transaction}SelectOptions.ts  # Memoized options + label resolvers
      use{Transaction}FormSchemas.ts    # Dynamic MuiForm schema
      use{Transaction}Approval.ts       # Approval workflow state + handlers
      use{Transaction}PageController.ts # Optional: top-level orchestration
    types/
      {transaction}Types.ts             # ALL types in ONE file (prevent circular deps)
    utils/
      {transaction}Constants.ts         # Status IDs, frozen empty arrays
      {transaction}Factories.ts         # createBlankLine, buildDefaultFormValues
      {transaction}Mappers.ts           # API response → UI type converters
      {transaction}Calculations.ts      # Tax/amount calculations (optional)
```

### Type Definitions Pattern
**CRITICAL: All types for a module go in ONE file to prevent circular dependency hell.**

```typescript
// types/indentTypes.ts

export type Option = { label: string; value: string };
export type DepartmentRecord = { id: string; name: string; branchId?: string };

// Line items keep quantity as STRING during editing (user input)
export type EditableLineItem = {
  id: string;
  itemGroup: string;
  item: string;
  itemMake: string;
  quantity: string;        // STRING during editing, convert on submit
  uom: string;
  remarks: string;
};

// Extended item option with defaults (for auto-populating UOM)
export type ItemOption = Option & {
  defaultUomId?: string;
  defaultUomLabel?: string;
};

// Cache entry for deferred loading pattern
export type ItemGroupCacheEntry = {
  items: ItemOption[];
  makes: Option[];
  uomsByItemId: Record<string, Option[]>;
  itemLabelById: Record<string, string>;
};

// Label resolvers for preview/tooltips
export type LabelResolvers = {
  department: (id: string) => string;
  itemGroup: (id: string) => string;
  item: (groupId: string, itemId: string) => string;
  uom: (groupId: string, itemId: string, uomId: string) => string;
};

// Setup data from API
export type IndentSetupData = {
  departments: DepartmentRecord[];
  projects: ProjectRecord[];
  itemGroups: ItemGroupRecord[];
};
```

### Constants Pattern
```typescript
// utils/indentConstants.ts

import type { ApprovalStatusId } from "@/components/ui/transaction";

export const INDENT_STATUS_IDS = {
  DRAFT: 21, OPEN: 1, PENDING_APPROVAL: 20,
  APPROVED: 3, REJECTED: 4, CLOSED: 5, CANCELLED: 6,
} as const satisfies Record<string, ApprovalStatusId>;

export const INDENT_STATUS_LABELS: Record<ApprovalStatusId, string> = {
  [INDENT_STATUS_IDS.DRAFT]: "Draft",
  [INDENT_STATUS_IDS.OPEN]: "Open",
  // ... etc
};

// IMMUTABLE empty arrays (prevent re-renders from new [] allocations)
export const EMPTY_DEPARTMENTS: ReadonlyArray<DepartmentRecord> = Object.freeze([]);
export const EMPTY_OPTIONS: ReadonlyArray<Option> = Object.freeze([]);
```

### Factories Pattern
```typescript
// utils/indentFactories.ts

let lineIdSeed = 0;
export const generateLineId = (): string => `line-${++lineIdSeed}`;

export const createBlankLine = (): EditableLineItem => ({
  id: generateLineId(),
  itemGroup: "", item: "", itemMake: "",
  quantity: "",  // String!
  uom: "", remarks: "",
});

export const buildDefaultFormValues = () => ({
  branch: "", date: new Date().toISOString().slice(0, 10),
  department: "", project: "", remarks: "",
});

// Helpers for validation
export const lineHasAnyData = (line: EditableLineItem): boolean =>
  Boolean(line.itemGroup || line.item || line.quantity || line.remarks);

export const lineIsComplete = (line: EditableLineItem): boolean => {
  const qty = Number(line.quantity);
  return Boolean(line.itemGroup && line.item && line.uom && Number.isFinite(qty) && qty > 0);
};
```

### Mappers Pattern (API → UI)
```typescript
// utils/indentMappers.ts — Handle null-safety and field name variations from backend

export const mapDepartmentRecords = (records: unknown[]): DepartmentRecord[] =>
  records.map((row) => {
    const data = row as Record<string, unknown>;
    const id = data?.dept_id ?? data?.department_id ?? data?.id;
    if (!id) return null;
    return {
      id: String(id),
      name: String(data?.dept_desc ?? data?.dept_name ?? data?.name ?? id),
      branchId: data?.branch_id != null ? String(data.branch_id) : undefined,
    };
  }).filter(Boolean) as DepartmentRecord[];
```

### Hooks — Complete Patterns

**Rule:** If a `useEffect` or state logic exceeds 10-15 lines or is reusable, extract into a custom hook.

#### Form State Hook
```typescript
export function useIndentFormState({ mode }: { mode: MuiFormMode }) {
  const [initialValues, setInitialValues] = useState(buildDefaultFormValues);
  const [formValues, setFormValues] = useState(buildDefaultFormValues);
  const [formKey, setFormKey] = useState(0);       // Bump to force re-render
  const formRef = useRef<{ submit: () => Promise<void> } | null>(null);
  const bumpFormKey = useCallback(() => setFormKey(prev => prev + 1), []);
  return { initialValues, setInitialValues, formValues, setFormValues, formKey, bumpFormKey, formRef };
}
```

#### Line Items Hook (with CASCADE logic — CRITICAL)
```typescript
export const useIndentLineItems = ({ mode, itemGroupCache, ensureItemGroupData }) => {
  const { items: lineItems, setItems: setLineItems } = useLineItems<EditableLineItem>({
    createBlankItem: createBlankLine,
    hasData: lineHasAnyData,
    maintainTrailingBlank: mode !== "view",  // Keep blank row when editing
  });

  const handleLineFieldChange = useCallback(
    (id: string, field: keyof EditableLineItem, rawValue: string) => {
      if (mode === "view") return;

      // CASCADE 1: itemGroup change → reset item, itemMake, uom
      if (field === "itemGroup") {
        setLineItems(prev => prev.map(item =>
          item.id === id ? { ...item, itemGroup: rawValue, item: "", itemMake: "", uom: "" } : item
        ));
        if (rawValue && !itemGroupCache[rawValue]) ensureItemGroupData(rawValue);
        return;
      }

      // CASCADE 2: item change → auto-select default UOM from cache
      if (field === "item") {
        setLineItems(prev => prev.map(item => {
          if (item.id !== id) return item;
          const defaultUom = itemGroupCache[item.itemGroup]?.items
            .find(opt => opt.value === rawValue)?.defaultUomId ?? "";
          return { ...item, item: rawValue, uom: defaultUom };
        }));
        return;
      }

      // Generic field update
      setLineItems(prev => prev.map(item =>
        item.id === id ? { ...item, [field]: rawValue } : item
      ));
    },
    [mode, setLineItems, itemGroupCache, ensureItemGroupData]
  );

  return { lineItems, setLineItems, handleLineFieldChange };
};
```

#### Select Options Hook (Memoized + Label Resolvers)
```typescript
export const useIndentSelectOptions = ({ departments, itemGroups, branchId, itemGroupCache }) => {
  // Filter by branch
  const departmentOptions = useMemo(() =>
    departments
      .filter(d => !branchId || !d.branchId || d.branchId === branchId)
      .map(d => ({ label: d.name, value: d.id })),
    [departments, branchId]
  );

  // Build label maps for display + tooltips
  const departmentLabelMap = useMemo(() =>
    Object.fromEntries(departmentOptions.map(o => [o.value, o.label])),
    [departmentOptions]
  );

  // Item getters from deferred cache
  const getItemOptions = useCallback(
    (groupId: string) => itemGroupCache[groupId]?.items ?? [],
    [itemGroupCache]
  );

  return { departmentOptions, departmentLabelMap, getItemOptions, /* labelResolvers */ };
};
```

#### Line Item Columns as Hook (for DataGrid)
```typescript
export const useIndentLineItemColumns = ({ canEdit, itemGroupOptions, labelResolvers, handleLineFieldChange }) => {
  return useMemo(() => [
    {
      id: "itemGroup", header: "Item Group", width: "1.6fr",
      renderCell: ({ item }) => canEdit
        ? <SearchableSelect options={itemGroupOptions} value={...} onChange={...} />
        : <span>{labelResolvers.itemGroup(item.itemGroup)}</span>,
      getTooltip: ({ item }) => labelResolvers.itemGroup(item.itemGroup),
    },
    // ... more columns
  ], [canEdit, itemGroupOptions, labelResolvers, handleLineFieldChange]);
};
```

### Deferred Loading Pattern (CRITICAL for dependent dropdowns)
```typescript
// Use useDeferredOptionCache for itemGroup → items/UOMs lazy loading
const { cache, loading, ensure } = useDeferredOptionCache<string, ItemGroupCacheEntry>({
  fetcher: async (groupId) => {
    const response = await fetchSetup2(groupId);
    return mapItemGroupDetailResponse(response);
  },
});
// Call ensure(groupId) when user selects an item group
```

### Key Pattern Summary

| Pattern | Rule |
|---------|------|
| **Separation of concerns** | Types, constants, factories, mappers, hooks, components in dedicated files |
| **Memoization** | ALL options, label maps, computed values use `useMemo` and `useCallback` |
| **Deferred loading** | Use `useDeferredOptionCache` for dependent data (itemGroup → items/UOMs) |
| **Cascade resets** | When parent field changes (itemGroup), reset all dependent child fields |
| **Immutable defaults** | Use `Object.freeze()` on empty arrays to prevent re-renders |
| **Label resolvers** | Build label maps for tooltips and preview rendering |
| **Mode-aware** | Check `mode !== "view"` before allowing edits; disable fields appropriately |
| **Trailing blank row** | Maintain one blank row at end of line items when editing |

---

## Approval Workflow Component

### ApprovalActionsBar - Standardized Component

**Location:** `src/components/ui/transaction/ApprovalActionsBar.tsx`

**Status Contract (Fixed - MUST match backend):**

| Status ID | Label | Meaning | Badge Color |
|-----------|-------|---------|-------------|
| 21 | Drafted | Initial state, editable | `default` (gray) |
| 1 | Open | Doc number generated, ready for approval | `primary` (blue) |
| 20 | Pending Approval | In workflow (has `approval_level`) | `warning` (amber) |
| 3 | Approved | Fully approved | `success` (green) |
| 4 | Rejected | Rejected during approval | `error` (red) |
| 5 | Closed | External close | `default` (gray) |
| 6 | Cancelled | Draft cancelled | `default` (gray) |

**Behavior rules:**
- Document number is generated **only** when moving to Open (1)
- **Pending (20)** contains `approval_level`; on approve: increment level (stay 20) or finalize (→ 3)
- **Rejected (4)** can be reopened back to 1 or 21

**Type Definitions:**
```typescript
type ApprovalInfo = {
  statusId: ApprovalStatusId;
  statusLabel: string;
  approvalLevel?: number | null;
  maxApprovalLevel?: number | null;
  isFinalLevel?: boolean;
};

type ApprovalActionPermissions = {
  canSave?: boolean;
  canOpen?: boolean;
  canCancelDraft?: boolean;
  canReopen?: boolean;
  canSendForApproval?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canViewApprovalLog?: boolean;
  canClone?: boolean;
};
```

**Button Visibility Rules:**

| Status | Visible Buttons |
|--------|----------------|
| Draft (21) | Save, Open, Cancel Draft |
| Open (1) | Save, Send for Approval |
| Pending (20) | Approve, Reject, View Approval Log |
| Approved (3) | View Approval Log, Clone |
| Rejected (4) | Re-Open, Clone, View Approval Log |
| Cancelled (6) | Re-Open, Save |
| Closed (5) | View Approval Log |

**Usage:**
```typescript
<ApprovalActionsBar
  approvalInfo={{ statusId: 21, statusLabel: "Draft", approvalLevel: 0, totalLevels: 3 }}
  permissions={{ canSave: true, canOpen: true, canApprove: false, canReject: false }}
  onSave={handleSave} onOpen={handleOpen} onApprove={handleApprove}
  onReject={handleReject} onViewLog={handleViewLog} loading={isLoading}
/>
```

---

## Data Fetching & API Patterns

### API Client (Primary)
**Location:** `src/utils/apiClient2.ts`

```typescript
import { fetchWithCookie } from "@/utils/apiClient2";

// GET request
const { data, error } = await fetchWithCookie<IndentResponse>(
  "/api/procurementIndent/get_indent?indent_id=123",
  "GET"
);

if (error) {
  console.error("Failed to fetch:", error);
  return;
}

// POST request
const { data, error } = await fetchWithCookie<{ success: boolean }>(
  "/api/procurementIndent/create",
  "POST",
  { date: "2026-02-13", department_id: 5 }
);
```

**Features:**
- Includes `withCredentials: true` for cookie-based auth
- Returns typed `FetchResult<T>` with data, error, status
- Automatically handles JSON parsing

### API Routes Definition
**Location:** `src/utils/api.ts`

```typescript
// Centralized API routes
export const apiRoutes = {
  INDENT_LIST: "/api/procurementIndent/list",
  INDENT_CREATE_SETUP: "/api/procurementIndent/create_setup",
  INDENT_CREATE: "/api/procurementIndent/create",
  INDENT_GET: "/api/procurementIndent/get_indent",
  // ... more routes
};

// Usage
const { data } = await fetchWithCookie(apiRoutes.INDENT_CREATE_SETUP, "GET");
```

### Service Layer Pattern
**Location:** `src/utils/{feature}Service.ts`

```typescript
// src/utils/indentService.ts
import { fetchWithCookie } from "./apiClient2";
import { apiRoutes } from "./api";
import type { IndentSetupData, IndentFormData } from "@/types/indentTypes";

export const fetchIndentSetup = async (coId: string): Promise<IndentSetupData | null> => {
  const { data, error } = await fetchWithCookie<{ data: IndentSetupData }>(
    `${apiRoutes.INDENT_CREATE_SETUP}?co_id=${coId}`,
    "GET"
  );

  if (error) {
    console.error("Failed to fetch setup:", error);
    return null;
  }

  // Transform backend response to UI format
  return mapSetupDataToUI(data.data);
};

export const saveIndent = async (formData: IndentFormData): Promise<boolean> => {
  const payload = mapUIDataToBackend(formData);

  const { data, error } = await fetchWithCookie<{ success: boolean }>(
    apiRoutes.INDENT_CREATE,
    "POST",
    payload
  );

  return !error && data?.success;
};
```

---

## MuiForm Schema Pattern

The `MuiForm` component renders forms dynamically from a schema:

```typescript
type Schema = {
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "date" | "select" | "textarea" | "number" | "checkbox";
    required?: boolean;
    options?: Option[];
    disabled?: boolean;
    grid?: { xs: number; md: number };
    placeholder?: string;
    validate?: (value: unknown) => string | undefined;
  }>;
};

// Build schema in a hook, memoize with useMemo:
export const useIndentFormSchema = ({ mode, branchOptions, departmentOptions }) => {
  return useMemo(() => ({
    fields: [
      { name: "branch", label: "Branch", type: "select", required: true,
        options: branchOptions, disabled: mode !== "create", grid: { xs: 12, md: 4 } },
      { name: "date", label: "Date", type: "date", required: true, grid: { xs: 12, md: 4 } },
      { name: "department", label: "Department", type: "select", required: true,
        options: departmentOptions, grid: { xs: 12, md: 4 } },
    ],
  }), [mode, branchOptions, departmentOptions]);
};
```

---

## Component Documentation Standards

**JSDoc is required for ALL reusable components:**
```typescript
/**
 * @component ApprovalActionsBar
 * @description Renders action buttons for transaction approval workflows.
 * Handles visibility based on current status and user permissions.
 * @example
 * <ApprovalActionsBar statusId={1} permissions={{ canApprove: true }} onApprove={fn} />
 */
```

**Inline comments for non-trivial logic:**
```typescript
// Status ID 21 = Draft, 1 = Open, 3 = Approved
// Map these IDs to color tokens for consistent theming
const statusColor = getStatusColor(statusId);
```

---

## Testing Standards

### Testing Framework
**Vitest with Testing Library**

**Test Files:** `*.test.ts` or `*.test.tsx` in `src/**`

**Example:**
```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { IndentForm } from "./IndentForm";

describe("IndentForm", () => {
  it("should render form fields", () => {
    render(<IndentForm data={mockSetupData} onSave={jest.fn()} />);

    expect(screen.getByLabelText("Department")).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
  });

  it("should call onSave with form data", async () => {
    const mockSave = jest.fn();
    render(<IndentForm data={mockSetupData} onSave={mockSave} />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({ department_id: 5 })
      );
    });
  });
});
```

### Testing Commands
```bash
pnpm test              # Run tests once
pnpm test:watch        # Watch mode
pnpm test:ui           # UI mode
pnpm test:coverage     # Coverage report
pnpm test:storybook    # Storybook visual tests
```

### Storybook
```bash
pnpm storybook         # Dev server (port 6006)
pnpm build-storybook   # Production build
```

---

## Best Practices & Critical Rules

### DO ✅

1. **Always validate with Zod** - all forms and API inputs
2. **Strict TypeScript** - no `any`, use proper types
3. **Memoize expensive computations** - use `useMemo`, `useCallback`
4. **Pure presentational components** - based on props only
5. **Comment complex logic** - help future developers understand
6. **Mode-aware rendering** - check `mode !== "view"` before enabling edits
7. **Immutable defaults** - use `Object.freeze()` on empty arrays/objects
8. **Separate concerns** - types, constants, factories in own files
9. **Test critical paths** - write tests for complex logic
10. **Remove console.log before commit** - use proper logging if needed

### DON'T ❌

1. **Never hardcode colors** - use theme tokens
2. **Never use `any` types** - use `unknown` with type guards
3. **Never call APIs directly in components** - use service functions
4. **Never create circular dependencies** - use single type definition files
5. **Never commit console.log** - remove debug statements
6. **Never use browser globals in server components** - check component type
7. **Never skip Zod validation** - runtime safety is critical
8. **Never mutate frozen objects** - use immutable patterns
9. **Never hardcode status IDs** - use constants that match backend
10. **Never skip tests for complex logic** - ensure correctness

### Naming Conventions

**Components:**
```typescript
ApprovalActionsBar.tsx      // PascalCase
FormFieldWrapper.tsx
SearchableSelect.tsx
```

**Hooks:**
```typescript
useMenuId.ts                // camelCase with 'use' prefix
useIndentFormState.ts
useLineItems.ts
```

**Utilities/Services:**
```typescript
indentService.ts            // camelCase
apiClient2.ts
formatters.ts
```

**Files:**
- `.tsx` for components (JSX)
- `.ts` for logic (no JSX)

---

## Key Documentation Files

| File | Purpose | Priority |
|------|---------|----------|
| `AGENTS_GUIDE.md` | Comprehensive developer guide (26KB) | ⭐⭐⭐ ESSENTIAL |
| `instructions.md` | IDE agent instructions (13KB) | ⭐⭐⭐ ESSENTIAL |
| `README.md` | Setup, deployment, Docker | ⭐⭐ Important |
| `aiReadMeDocumentation.md` | Quick reference | ⭐ Reference |
| `agents/manifest.yaml` | Agent configuration | ⭐ Reference |

---

## Development Workflow

### Setup
```bash
# Clone and install
cd c:\code\vowerp3ui
pnpm install
```

### Development
```bash
pnpm dev           # Start dev server (port 3000) with Turbopack
pnpm build         # Production build
pnpm start         # Run production server
pnpm lint          # Lint code
pnpm test          # Run tests
pnpm docs          # Generate TypeDoc
pnpm storybook     # Start Storybook (port 6006)
```

### Before Committing
```bash
# 1. Run linter
pnpm lint

# 2. Run tests
pnpm test

# 3. Check TypeScript
npx tsc --noEmit

# 4. Remove console.log statements
# Search for console.log and remove all instances
```

---

## Backend Integration

### API Response Format (from backend)
```typescript
// Backend always returns
{
  "data": [...],
  "master": [...] // optional
}
```

### Status ID Alignment
**MUST match backend exactly:**
```typescript
const STATUS_IDS = {
  DRAFT: 21,
  OPEN: 1,
  PENDING_APPROVAL: 20,
  APPROVED: 3,
  REJECTED: 4,
  CLOSED: 5,
  CANCELLED: 6,
} as const;
```

### Authentication Flow (Persona-Specific)

**Control Desk (subdomain = "admin"):**
1. `loginConsole()` → `POST /authRoutes/loginconsole`
2. Backend validates against `vowconsole3.con_user_master` where `con_user_type = 0`
3. JWT set in `access_token` cookie
4. Redirect to `/dashboardctrldesk`

**Tenant Admin (subdomain != "admin", loginType = "admin"):**
1. `loginConsole()` → `POST /authRoutes/loginconsole` with `X-Subdomain` header
2. Backend validates against `vowconsole3.con_user_master` where `con_user_type = 1` and `con_org_id` matches
3. JWT set in `access_token` cookie
4. Redirect to `/dashboardadmin`

**Portal (subdomain != "admin", loginType = "portal"):**
1. `login()` → `POST /authRoutes/login` with `X-Subdomain` header
2. Backend validates against `{tenant_db}.user_mst` by `email_id`
3. JWT set in `access_token` cookie (token includes `type: "portal"`)
4. Redirect to `/dashboardportal`
5. Middleware also fetches `portal_permission_token` for action-level permissions

### Cookies
- `access_token` — JWT auth token (all dashboards)
- `portal_permission_token` — permission data (Portal only)
- `subdomain` — tenant identifier

---

## Common Pitfalls

### 1. Using `any` Type
❌ **Wrong:**
```typescript
function handleData(data: any) {
  return data.value;
}
```

✅ **Correct:**
```typescript
interface DataItem {
  value: string;
}

function handleData(data: DataItem) {
  return data.value;
}
```

### 2. Hardcoding Colors
❌ **Wrong:**
```typescript
<button style={{ backgroundColor: "#1976d2" }}>Click</button>
```

✅ **Correct:**
```typescript
import { tokens } from "@/styles/tokens";
<button style={{ backgroundColor: tokens.brand.primary }}>Click</button>
```

### 3. Not Validating Forms
❌ **Wrong:**
```typescript
const onSubmit = (data) => {
  // No validation!
  saveData(data);
};
```

✅ **Correct:**
```typescript
const schema = z.object({
  name: z.string().min(1, "Name required"),
});

const { handleSubmit } = useForm({
  resolver: zodResolver(schema)
});
```

### 4. Mutating Frozen Objects
❌ **Wrong:**
```typescript
const EMPTY_ARRAY = Object.freeze([]);
EMPTY_ARRAY.push(item); // Error!
```

✅ **Correct:**
```typescript
const EMPTY_ARRAY = Object.freeze([]);
const newArray = [...EMPTY_ARRAY, item];
```

### 5. Creating Circular Dependencies
❌ **Wrong:**
```typescript
// typeA.ts
import { TypeB } from "./typeB";
export type TypeA = { b: TypeB };

// typeB.ts
import { TypeA } from "./typeA";
export type TypeB = { a: TypeA };
```

✅ **Correct:**
```typescript
// types.ts - Single file
export type TypeA = { b: TypeB };
export type TypeB = { a: TypeA };
```

---

## Quick Reference: Creating a New Transaction Page

**Note:** Transaction pages with approval workflows live under `dashboardportal/` (Portal persona).

### 1. Create Folder Structure
```bash
src/app/dashboardportal/{module}/{transaction}/
  page.tsx
  create{Transaction}/
    page.tsx
    _components/
    hooks/
    types/
    utils/
```

### 2. Define Types (Single File)
```typescript
// types/transactionTypes.ts
export type Option = { label: string; value: string };
export type LineItem = { id: string; /* ... */ };
export type SetupData = { /* ... */ };
```

### 3. Create Constants
```typescript
// utils/transactionConstants.ts
export const TRANSACTION_STATUS_IDS = {
  DRAFT: 21,
  OPEN: 1,
  // ... match backend
} as const;

export const EMPTY_OPTIONS = Object.freeze([]);
```

### 4. Create Factories
```typescript
// utils/transactionFactories.ts
export const createBlankLine = (): LineItem => ({
  id: generateLineId(),
  // ... default values
});
```

### 5. Create Hooks
```typescript
// hooks/useTransactionFormState.ts
export function useTransactionFormState(/* ... */) {
  // State management logic
}
```

### 6. Create Components
```typescript
// _components/TransactionHeaderForm.tsx
interface Props {
  data: SetupData;
  onChange: (field: string, value: unknown) => void;
}

export function TransactionHeaderForm({ data, onChange }: Props) {
  // Render form
}
```

### 7. Create Page (Container)
```typescript
// page.tsx
"use client";

import { useTransactionFormState } from "./hooks/useTransactionFormState";

export default function CreateTransactionPage() {
  const { /* ... */ } = useTransactionFormState();

  return (
    <div>
      {/* Use components */}
    </div>
  );
}
```

### 8. Write Tests
```typescript
// _components/TransactionHeaderForm.test.tsx
import { render } from "@testing-library/react";
// ... tests
```

---

## Support & Resources

**For Questions:**
1. Check `AGENTS_GUIDE.md` first (26KB comprehensive guide)
2. Review `instructions.md` for component patterns
3. Look at existing transaction pages as examples
4. Check Storybook for component usage

**Common Examples:**
- **List Pages:** `src/app/dashboardportal/masters/items/page.tsx`
- **Transaction Pages:** `src/app/dashboardportal/procurement/indent/createIndent/`
- **Shared Components:** `src/components/ui/`
- **Testing:** Any `*.test.tsx` file

---

## Version Info
- Next.js: 15
- React: 19
- TypeScript: 5.x (strict mode)
- Node: 18+
- Package Manager: pnpm

**Last Updated:** 2026-02-13
