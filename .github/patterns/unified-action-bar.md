# Unified Save/Approval Action Bar Pattern

## Problem

Transaction pages (Indent, PO, Inward, etc.) have both a **Save/Update button** and **Approval workflow buttons** (Open, Approve, Reject, etc.). These were previously rendered in separate locations, which was confusing for users. They need to be in the same place with conditional display logic.

## Solution

Render all action buttons through `TransactionWrapper.primaryActions` using three shared utilities:

| Utility | Location | Purpose |
|---------|----------|---------|
| `buildApprovalTransactionActions` | `@/components/ui/transaction` | Converts approval state into `TransactionAction[]` |
| `useRejectDialog` | `@/components/ui/transaction` | Manages reject confirmation dialog state |
| `useUnsavedChanges` | `@/components/ui/transaction` | Detects unsaved form/line-item changes via baseline comparison |

## Display Logic

```
mode === "create"
  └─> Show "Create {Document}" button

mode === "edit" && hasUnsavedChanges
  └─> Show "Save Changes" button

mode === "edit" && !hasUnsavedChanges
  └─> Show approval buttons (Open, Approve, Reject, etc.)

mode === "view"
  └─> Show approval buttons
```

## Implementation Steps (for a new page)

### 1. Add imports

```tsx
import {
  buildApprovalTransactionActions,
  useRejectDialog,
  useUnsavedChanges,
} from "@/components/ui/transaction";
```

### 2. Set up the `useUnsavedChanges` hook

Place this early in the component, after form state and line items are declared but **before** data-fetch effects that call `setBaseline`.

```tsx
const getComparableLineData = React.useCallback(
  (item: YourLineItemType) => ({
    // Include all user-editable fields, exclude ephemeral ones (id, etc.)
    field1: item.field1,
    field2: item.field2,
    quantity: item.quantity,
    // ...
  }),
  [],
);

const comparableLineItems = React.useMemo(
  () => lineItems.filter(lineHasAnyData),
  [lineItems],
);

const { hasUnsavedChanges, resetBaseline, setBaseline } = useUnsavedChanges({
  formValues,
  lineItems: comparableLineItems,
  getComparableLineData,
  enabled: mode !== "create",
});
```

### 3. Set baseline after data loads

In the data-fetch effect (e.g., `getDocumentById().then()`), after populating form values and line items:

```tsx
setBaseline(formBaseValues, mappedLines.filter(lineHasAnyData));
```

### 4. Reset baseline after approval actions

After the approval hook, add an effect that resets the baseline when document details change (e.g., after an approval action refreshes the data):

```tsx
React.useEffect(() => {
  if (!documentDetails || mode === "create") return;
  const timer = setTimeout(() => resetBaseline(), 0);
  return () => clearTimeout(timer);
}, [documentDetails, mode, resetBaseline]);
```

### 5. Set up the reject dialog

```tsx
const {
  rejectDialogOpen,
  rejectReason,
  setRejectReason,
  openRejectDialog,
  handleRejectConfirm,
  handleRejectCancel,
} = useRejectDialog(handleReject);
```

### 6. Build unified primaryActions

```tsx
const primaryActions = React.useMemo<TransactionAction[] | undefined>(() => {
  if (pageError || setupError) return undefined;

  // Create mode
  if (mode === "create") {
    return [{
      label: "Create Document",
      onClick: () => formRef.current?.submit(),
      disabled: saving || !lineItemsValid || setupLoading,
      loading: saving,
    }];
  }

  if (!documentDetails) return undefined;

  // Edit mode with unsaved changes
  if (mode === "edit" && approvalPermissions.canSave && hasUnsavedChanges) {
    return [{
      label: "Save Changes",
      onClick: () => formRef.current?.submit(),
      disabled: saving || !lineItemsValid || setupLoading,
      loading: saving,
    }];
  }

  // View mode, or edit without changes -> approval buttons
  const approvalActions = buildApprovalTransactionActions({
    approvalInfo,
    permissions: approvalPermissions,
    handlers: {
      onOpen: handleOpen,
      onCancelDraft: handleCancelDraft,
      onReopen: handleReopen,
      onSendForApproval: handleSendForApproval,
      onApprove: handleApprove,
      onReject: openRejectDialog,  // Opens dialog, not the API
      onViewApprovalLog: handleViewApprovalLog,
      onClone: handleClone,
    },
    loading: approvalLoading,
    disabled: saving || loading || setupLoading,
  });

  return approvalActions.length ? approvalActions : undefined;
}, [/* all deps */]);
```

### 7. Remove the old separate ApprovalBar from preview/footer

The preview prop should only contain the printable preview component:

```tsx
preview={<DocumentPreview ... />}
```

### 8. Add the reject dialog JSX

Render after the other dialogs in the page:

```tsx
<Dialog open={rejectDialogOpen} onOpenChange={(open) => { if (!open) handleRejectCancel(); }}>
  <DialogContent className="sm:max-w-125">
    <DialogHeader>
      <DialogTitle>Reject Document</DialogTitle>
      <DialogDescription>Please provide a reason for rejecting this document.</DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label htmlFor="reject-reason" className="text-sm font-medium leading-none">
          Rejection Reason *
        </label>
        <AutoResizeTextarea
          id="reject-reason"
          placeholder="Enter rejection reason..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          minHeight={80}
          maxHeight={200}
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={handleRejectCancel}>Cancel</Button>
      <Button variant="destructive" onClick={handleRejectConfirm} disabled={!rejectReason.trim()}>Reject</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Reference Implementation

See `src/app/dashboardportal/procurement/indent/createIndent/page.tsx` for the complete working example.

## Notes

- The `TransactionAction` type supports a `className` prop for custom styling (e.g., green Approve button uses `className: "bg-green-600 hover:bg-green-700 text-white"`)
- After save, the page navigates to view mode via `router.replace()`. In view mode, approval buttons appear automatically since `hasUnsavedChanges` is false.
- If validation auto-fills a quantity (e.g., Open indent forced qty), the form becomes dirty and the Save button appears. This is correct — the auto-filled data should be saved before proceeding with approval.
- `ApprovalActionsBar` component still exists for cases where standalone rendering is needed, but the `buildApprovalTransactionActions` utility is preferred for the unified pattern.
