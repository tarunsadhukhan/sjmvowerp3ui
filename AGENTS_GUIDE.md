# Vowerp3 Frontend Agents Guide

## 1. Project Overview

**Vowerp3ui** is the frontend for the Vowerp ERP system. It is built with a modern stack designed for performance, scalability, and developer experience.

### Core Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [MUI (Material UI)](https://mui.com/)
- **State Management**: React Hooks + Context + URL Search Params
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Package Manager**: `pnpm`

---

## 2. Directory Structure

Understanding the codebase layout is crucial.

```
src/
├── app/                 # Next.js App Router pages and layouts
│   ├── layout.tsx       # Root layout (Providers, Global Styles)
│   ├── page.tsx         # Home page
│   └── [feature]/       # Feature-based routes (e.g., dashboardportal, auth)
├── components/          # Shared React Components
│   ├── ui/              # Generic, reusable UI primitives (Buttons, Inputs, Cards)
│   ├── clientside/      # Client-side only wrappers/guards
│   └── dashboard/       # Dashboard-specific layout components
├── hooks/               # Shared Custom React Hooks
├── lib/                 # Utility libraries and configurations
├── styles/              # Global styles and theme definitions
├── types/               # Shared TypeScript type definitions
└── utils/               # Shared Helper functions
```

---

## 3. Componentization Guidelines & Organization

**Goal**: Maximize reusability, maintainability, and discoverability.

### 3.1. Where to Place Components

We follow a strict rule based on **scope of use**:

1.  **Generic / Shared Components**:
    *   **Location**: `src/components/ui/` (for primitives) or `src/components/[feature]/` (for domain-shared).
    *   **Criteria**: Used in *multiple* pages or features.
    *   **Example**: `ConfirmationDialog`, `DataTable`, `EmployeeCard`.

2.  **Page-Specific Components**:
    *   **Location**: Inside the page folder, ideally in a `_components` or `components` subfolder.
    *   **Criteria**: Used *only* by that specific page or its immediate children.
    *   **Benefit**: Keeps the global `components` folder clean and makes it obvious which components belong to a specific workflow.
    *   **Example**:
        ```
        src/app/dashboardportal/procurement/indent/createIndent/
        ├── page.tsx
        ├── _components/           <-- Page-specific components here
        │   ├── IndentHeaderForm.tsx
        │   └── IndentLineItems.tsx
        └── utils/                 <-- Page-specific utils here
        ```

### 3.2. The "Smart" vs. "Dumb" Pattern

1.  **Smart Components (Containers/Pages)**:
    *   **Role**: Data fetching, state management, business logic orchestrators.
    *   **Location**: `page.tsx` or top-level containers.
    *   **Responsibilities**:
        *   Fetching data (Server or Client side).
        *   Defining form schemas and handlers.
        *   Passing data and callbacks to children.

2.  **Dumb Components (Presentational)**:
    *   **Role**: Rendering UI based purely on `props`.
    *   **Location**: `src/components/...` or `_components/...`.
    *   **Responsibilities**:
        *   Displaying data.
        *   Emitting events (e.g., `onClick`, `onChange`) to parents.
        *   **Must be pure**: Same props = same output.

---

## 4. Documentation & Comments Standards

Clear documentation is mandatory for maintainability.

### 4.1. Component Documentation
Every component (especially reusable ones) must have a top-level comment block:

```typescript
/**
 * @component ApprovalActionsBar
 * @description Renders the action buttons for transaction approval workflows (Approve, Reject, etc.).
 * Handles visibility based on current status and user permissions.
 *
 * @example
 * <ApprovalActionsBar
 *   statusId={1}
 *   permissions={{ canApprove: true }}
 *   onApprove={handleApprove}
 * />
 */
export const ApprovalActionsBar = ({ ... }) => { ... }
```

### 4.2. Complex Logic
Add comments for any non-trivial logic:
```typescript
// We map status ID to a color token to ensure consistent theming across the app
// 21 = Draft (Grey), 1 = Open (Blue), 3 = Approved (Green)
const statusColor = getStatusColor(statusId);
```

---

## 5. Design Patterns & Best Practices

### 5.1. Validation (Zod)
*   **Rule**: ALL forms and API inputs must be validated using **Zod**.
*   **Why**: Ensures type safety and runtime validation match.
*   **Pattern**:
    ```typescript
    import { z } from "zod";

    // Define schema
    const createIndentSchema = z.object({
      date: z.date(),
      department_id: z.number().min(1, "Department is required"),
      remarks: z.string().optional(),
    });

    // Infer type
    type CreateIndentForm = z.infer<typeof createIndentSchema>;

    // Use in Form
    const { control, handleSubmit } = useForm<CreateIndentForm>({
      resolver: zodResolver(createIndentSchema)
    });
    ```

### 5.2. Custom Hooks for Logic Extraction
*   **Rule**: If a `useEffect` or state logic exceeds 10-15 lines or is reusable, extract it into a custom hook.
*   **Pattern**: Move data fetching, subscription, or complex state logic to `src/hooks/` or a local `use[Feature].ts`.

### 5.3. Styling Standards
*   **Tailwind First**: Use Tailwind utility classes for layout (flex, grid, padding, margin).
*   **MUI Components**: Use MUI for complex interactive elements (DataGrid, Dialog, Autocomplete).
*   **Theme**: Always use the `theme` object or Tailwind config colors. Never hardcode hex values like `#123456`.

---

## 6. Standardization Checklist

Before submitting code or marking a task as complete, verify:

- [ ] **Structure**: Generic components in `@components`, specific ones in page folders.
- [ ] **Validation**: Zod schemas are defined and used.
- [ ] **Typing**: strict TypeScript types (no `any`). Interfaces defined for all Props.
- [ ] **Comments**: Top-level component comments added.
- [ ] **Cleanup**: `console.log` removed (use proper logging if needed).
- [ ] **Naming**:
    -   Components: `PascalCase.tsx`
    -   Hooks: `camelCase.ts` (prefix `use`)
    -   Utils/Constants: `camelCase.ts`

---

## 7. Page Archetypes

### 7.1. Master / Index Pages (`IndexWrapper`)
Used for listing records.
*   **Component**: `src/components/ui/IndexWrapper.tsx`
*   **Key Props**: `rows`, `columns`, `paginationModel`, `search`.

### 7.2. Transaction Pages (`TransactionWrapper`)
Used for creating/editing documents (Indents, POs).
*   **Component**: `src/components/ui/TransactionWrapper.tsx`
*   **Key Props**: `statusChip`, `primaryActions`, `lineItems`.

### 7.3. Form Fields (`FormFieldWrapper`)
Standardized wrapper for consistent labels and error handling.
*   **Usage**:
    ```tsx
    <FormFieldWrapper
      control={control}
      name="supplier_id"
      label="Supplier"
      component={SearchableSelect} // or Input, DatePicker
      // ... props
    />
    ```

---

**Remember**: The goal is to write code that your future self (and other agents) can understand immediately.
