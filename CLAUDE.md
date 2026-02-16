# VoWERP3 Frontend - Developer Guide for Claude

## Project Overview

VoWERP3 UI is a **multi-tenant ERP frontend** built with **Next.js 15**, **TypeScript**, and **React 19**. It provides a modern, type-safe interface for complex ERP operations including procurement, inventory, sales, and jute/yarn management.

**Tech Stack:**
- Next.js 15 with App Router
- TypeScript (strict mode)
- React 19 with Hooks
- Tailwind CSS 4.1 + Material-UI 7.3
- Zod 4.2 for validation
- React Hook Form 7.69
- Vitest + Storybook
- pnpm package manager

**Current Repo:** `vowerp3ui` (Next.js 15)
**Backend:** `vowerp3be` (FastAPI/Python)

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
    page.tsx                            # Create/edit/view page (container)
    _components/                        # Page-specific components
      {Transaction}HeaderForm.tsx       # Header fields
      {Transaction}LineItemsTable.tsx   # Line items grid
      {Transaction}FooterForm.tsx       # Footer/summary (optional)
    hooks/                              # Custom hooks for this page
      use{Transaction}FormState.ts      # Form state management
      use{Transaction}LineItems.ts      # Line item CRUD
      use{Transaction}SelectOptions.ts  # Dropdown options
      use{Transaction}FormSchemas.ts    # Zod schemas
      use{Transaction}Approval.ts       # Approval workflow
    types/                              # Type definitions
      {transaction}Types.ts             # All types in ONE file
    utils/                              # Helper functions
      {transaction}Constants.ts         # Status IDs, enums
      {transaction}Factories.ts         # Factory functions
      {transaction}Mappers.ts           # Data transformation
      {transaction}Calculations.ts      # Business logic (optional)
```

### Type Definitions Pattern
**IMPORTANT: All types in single file to prevent circular dependencies**

```typescript
// types/indentTypes.ts - Single file for all types

// Base types
export type Option = { label: string; value: string };
export type DepartmentRecord = { id: string; name: string; branchId?: string };

// Form types
export type EditableLineItem = {
  id: string;
  itemGroup: string;
  item: string;
  quantity: number;
  uom: string;
  remarks?: string;
};

// Setup data types
export type IndentSetupData = {
  departments: DepartmentRecord[];
  projects: ProjectRecord[];
  branches: BranchRecord[];
};

// API response types
export type IndentResponse = {
  header: IndentHeader;
  lines: IndentLine[];
  approval: ApprovalInfo;
};
```

### Constants Pattern
```typescript
// utils/indentConstants.ts

// Status IDs (MUST match backend)
export const INDENT_STATUS_IDS = {
  DRAFT: 21,
  OPEN: 1,
  PENDING_APPROVAL: 20,
  APPROVED: 3,
  REJECTED: 4,
  CLOSED: 5,
  CANCELLED: 6,
} as const;

// Immutable empty defaults (prevent accidental mutations)
export const EMPTY_DEPARTMENTS = Object.freeze([]);
export const EMPTY_PROJECTS = Object.freeze([]);
export const EMPTY_OPTIONS = Object.freeze([]);

// Other constants
export const MAX_LINE_ITEMS = 100;
export const REQUIRED_FIELDS = ["date", "department", "branch"] as const;
```

### Factories Pattern
```typescript
// utils/indentFactories.ts

let lineIdCounter = 0;

export const generateLineId = (): string => {
  return `line_${Date.now()}_${lineIdCounter++}`;
};

export const createBlankLine = (): EditableLineItem => ({
  id: generateLineId(),
  itemGroup: "",
  item: "",
  quantity: 0,
  uom: "",
  remarks: "",
});

export const buildDefaultFormValues = (): IndentFormValues => ({
  branch: "",
  date: new Date().toISOString().slice(0, 10),
  department: "",
  project: "",
  remarks: "",
});
```

### Hooks Composition Pattern
```typescript
// hooks/useIndentFormState.ts
export function useIndentFormState(mode: "create" | "edit" | "view", indentId?: string) {
  const [headerData, setHeaderData] = useState(buildDefaultFormValues());
  const [loading, setLoading] = useState(false);

  // Load data in edit/view mode
  useEffect(() => {
    if (mode !== "create" && indentId) {
      loadIndentData(indentId);
    }
  }, [mode, indentId]);

  return { headerData, setHeaderData, loading };
}

// hooks/useIndentLineItems.ts
export function useIndentLineItems(initialLines: EditableLineItem[] = []) {
  const [lines, setLines] = useState(() =>
    initialLines.length > 0 ? initialLines : [createBlankLine()]
  );

  const addLine = useCallback(() => {
    setLines(prev => [...prev, createBlankLine()]);
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines(prev => prev.filter(line => line.id !== id));
  }, []);

  const updateLine = useCallback((id: string, field: string, value: unknown) => {
    setLines(prev => prev.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    ));
  }, []);

  return { lines, addLine, removeLine, updateLine };
}

// hooks/useIndentSelectOptions.ts
export function useIndentSelectOptions(setupData: IndentSetupData | null) {
  const departmentOptions = useMemo(() =>
    setupData?.departments.map(d => ({ label: d.name, value: d.id })) ?? EMPTY_OPTIONS
  , [setupData]);

  const departmentLabelMap = useMemo(() =>
    Object.fromEntries(departmentOptions.map(o => [o.value, o.label]))
  , [departmentOptions]);

  return { departmentOptions, departmentLabelMap };
}
```

---

## Approval Workflow Component

### ApprovalActionsBar - Standardized Component

**Location:** `src/components/ui/transaction/ApprovalActionsBar.tsx`

**Status Contract (Fixed - MUST match backend):**
```typescript
export const STATUS_IDS = {
  DRAFT: 21,        // Initial state, can be edited
  OPEN: 1,          // Ready for approval
  PENDING_APPROVAL: 20,  // In approval workflow
  APPROVED: 3,      // Fully approved
  REJECTED: 4,      // Rejected during approval
  CLOSED: 5,        // Closed externally
  CANCELLED: 6,     // Draft cancelled
} as const;
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
import { ApprovalActionsBar } from "@/components/ui/transaction/ApprovalActionsBar";

<ApprovalActionsBar
  approvalInfo={{
    statusId: 21,
    statusLabel: "Draft",
    approvalLevel: 0,
    totalLevels: 3,
  }}
  permissions={{
    canSave: true,
    canOpen: true,
    canApprove: false,
    canReject: false,
  }}
  onSave={handleSave}
  onOpen={handleOpen}
  onApprove={handleApprove}
  onReject={handleReject}
  onViewLog={handleViewLog}
  loading={isLoading}
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

### Authentication Flow
1. Frontend sends login request
2. Backend returns JWT in cookie (`access_token`)
3. Frontend includes credentials in all requests (`withCredentials: true`)
4. Backend validates JWT and auto-refreshes

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
