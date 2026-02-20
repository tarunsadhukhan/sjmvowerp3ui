import React from "react";
import type { MuiFormMode } from "@/components/ui/muiform";
import { SearchableSelect } from "@/components/ui/transaction";
import { Input } from "@/components/ui/input";
import type { TransactionLineColumn } from "@/components/ui/transaction";
import type { EditableLineItem, Option } from "../types/poTypes";
import { DISCOUNT_MODE } from "../utils/poConstants";

/** Discount mode dropdown options */
const DISCOUNT_MODE_OPTIONS: Option[] = [
  { label: "None", value: "" },
  { label: "%", value: String(DISCOUNT_MODE.PERCENTAGE) },
  { label: "Amount", value: String(DISCOUNT_MODE.AMOUNT) },
];

type UsePOLineItemColumnsParams = {
  canEdit: boolean;
  itemGroupOptions: Option[];
  getItemGroupLabel: (groupId: string) => string;
  getItemOptions: (groupId: string) => Option[];
  getItemLabel: (groupId: string, itemId: string, itemCode?: string) => string;
  getUomOptions: (groupId: string, itemId: string) => Option[];
  getUomLabel: (groupId: string, itemId: string, uomId: string) => string;
  onFieldChange: (id: string, field: keyof EditableLineItem, value: string | number) => void;
};

/**
 * Builds the TransactionLineColumn array used by the PO line items grid.
 * Separated so the heavy render logic stays out of page.tsx.
 */
export const usePOLineItemColumns = ({
  canEdit,
  itemGroupOptions,
  getItemGroupLabel,
  getItemOptions,
  getItemLabel,
  getUomOptions,
  getUomLabel,
  onFieldChange,
}: UsePOLineItemColumnsParams): TransactionLineColumn<EditableLineItem>[] =>
  React.useMemo(
    () => [
      {
        id: "itemGroup",
        header: "Item Group",
        width: "1.5fr",
        minWidth: "163px",
        renderCell: ({ item }) => {
          const label = getItemGroupLabel(item.itemGroup);
          if (!canEdit) {
            return <span className="block truncate text-sm">{label || "-"}</span>;
          }
          const value = itemGroupOptions.find((o) => o.value === item.itemGroup) ?? null;
          return (
            <SearchableSelect<Option>
              options={itemGroupOptions}
              value={value}
              onChange={(next) => onFieldChange(item.id, "itemGroup", next?.value ?? "")}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              placeholder="Select group"
            />
          );
        },
        getTooltip: ({ item }) => getItemGroupLabel(item.itemGroup) || undefined,
      },
      {
        id: "item",
        header: "Item",
        width: "2.25fr",
        minWidth: "225px",
        renderCell: ({ item }) => {
          const label = getItemLabel(item.itemGroup, item.item, item.itemCode);
          if (!canEdit) {
            return <span className="block truncate text-sm">{label}</span>;
          }
          const options = getItemOptions(item.itemGroup);
          const value = options.find((o) => o.value === item.item) ?? null;
          return (
            <div className="flex flex-col gap-0.5 w-full">
              <SearchableSelect<Option>
                options={options}
                value={value}
                onChange={(next) => onFieldChange(item.id, "item", next?.value ?? "")}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                placeholder="Select item"
              />
              {item.rowError && (
                <p className="text-xs text-red-600 leading-tight">{item.rowError}</p>
              )}
              {!item.rowError && item.rowWarning && (
                <p className="text-xs text-amber-600 leading-tight">{item.rowWarning}</p>
              )}
            </div>
          );
        },
        getTooltip: ({ item }) => getItemLabel(item.itemGroup, item.item, item.itemCode) || undefined,
      },
      {
        id: "rate",
        header: "Rate",
        width: "0.8fr",
        minWidth: "80px",
        renderCell: ({ item }) =>
          canEdit ? (
            <Input
              type="text"
              value={item.rate}
              onChange={(e) => onFieldChange(item.id, "rate", e.target.value)}
              placeholder="0.00"
              className="h-8 text-sm"
            />
          ) : (
            <span className="block truncate text-sm">{item.rate || "-"}</span>
          ),
        getTooltip: ({ item }) => (item.rate ? `Rate: ${item.rate}` : undefined),
      },
      {
        id: "quantity",
        header: "Quantity",
        width: "0.8fr",
        minWidth: "80px",
        renderCell: ({ item }) => {
          if (!canEdit) {
            return <span className="block truncate text-sm">{item.quantity || "-"}</span>;
          }
          // Lock quantity for Logic 2 (Open PO) only
          if (item.isQuantityLocked) {
            return (
              <div className="flex flex-col gap-0.5 w-full">
                <span
                  className="text-sm h-8 flex items-center px-2 bg-muted rounded cursor-not-allowed text-muted-foreground"
                  title="Quantity is fixed for this item"
                >
                  {item.quantity || "0"}
                </span>
                {item.rowError && (
                  <p className="text-xs text-red-600 leading-tight">{item.rowError}</p>
                )}
              </div>
            );
          }
          return (
            <div className="flex flex-col gap-0.5 w-full">
              <Input
                type="text"
                value={item.quantity}
                onChange={(e) => onFieldChange(item.id, "quantity", e.target.value)}
                placeholder="0"
                className="h-8 text-sm"
              />
              {item.rowError && (
                <p className="text-xs text-red-600 leading-tight">{item.rowError}</p>
              )}
            </div>
          );
        },
        getTooltip: ({ item }) => (item.quantity ? `Quantity: ${item.quantity}` : undefined),
      },
      {
        id: "uom",
        header: "Unit",
        width: "0.6fr",
        minWidth: "80px",
        renderCell: ({ item }) => {
          const options = getUomOptions(item.itemGroup, item.item);
          const label = getUomLabel(item.itemGroup, item.item, item.uom);
          if (!canEdit) {
            return <span className="block truncate text-sm">{label || "-"}</span>;
          }
          const value = options.find((o) => o.value === item.uom) ?? null;
          return (
            <SearchableSelect<Option>
              options={options}
              value={value}
              onChange={(next) => onFieldChange(item.id, "uom", next?.value ?? "")}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              placeholder="UOM"
            />
          );
        },
        getTooltip: ({ item }) => getUomLabel(item.itemGroup, item.item, item.uom) || undefined,
      },
      {
        id: "discountMode",
        header: "Disc. Type",
        width: "0.7fr",
        minWidth: "90px",
        renderCell: ({ item }) => {
          const currentVal = item.discountMode != null ? String(item.discountMode) : "";
          const label = DISCOUNT_MODE_OPTIONS.find((o) => o.value === currentVal)?.label || "-";
          if (!canEdit) {
            return <span className="block truncate text-sm">{label}</span>;
          }
          const value = DISCOUNT_MODE_OPTIONS.find((o) => o.value === currentVal) ?? DISCOUNT_MODE_OPTIONS[0];
          return (
            <SearchableSelect<Option>
              options={DISCOUNT_MODE_OPTIONS}
              value={value}
              onChange={(next) => onFieldChange(item.id, "discountMode", next?.value ?? "")}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              placeholder="Type"
            />
          );
        },
        getTooltip: ({ item }) => {
          const currentVal = item.discountMode != null ? String(item.discountMode) : "";
          const label = DISCOUNT_MODE_OPTIONS.find((o) => o.value === currentVal)?.label;
          return label && label !== "None" ? `Discount Type: ${label}` : undefined;
        },
      },
      {
        id: "discountValue",
        header: "Disc. Value",
        width: "0.7fr",
        minWidth: "80px",
        renderCell: ({ item }) => {
          const hasDiscountMode = item.discountMode != null && item.discountMode !== 0;
          if (!canEdit) {
            return <span className="block truncate text-sm">{item.discountValue || "-"}</span>;
          }
          return (
            <Input
              type="text"
              value={item.discountValue}
              onChange={(e) => onFieldChange(item.id, "discountValue", e.target.value)}
              placeholder="0"
              className="h-8 text-sm"
              disabled={!hasDiscountMode}
            />
          );
        },
        getTooltip: ({ item }) => (item.discountValue ? `Discount Value: ${item.discountValue}` : undefined),
      },
      {
        id: "discountAmount",
        header: "Disc. Amt",
        width: "0.7fr",
        minWidth: "80px",
        renderCell: ({ item }) => (
          <span className="block truncate text-sm">{item.discountAmount?.toFixed(2) || "0.00"}</span>
        ),
        getTooltip: ({ item }) => (item.discountAmount ? `Discount Amount: ${item.discountAmount.toFixed(2)}` : undefined),
      },
      {
        id: "amount",
        header: "Amount",
        width: "0.8fr",
        minWidth: "90px",
        renderCell: ({ item }) => <span className="block truncate text-sm font-medium">{item.amount?.toFixed(2) || "0.00"}</span>,
        getTooltip: ({ item }) => (item.amount ? `Amount: ${item.amount.toFixed(2)}` : undefined),
      },
    ],
    [canEdit, itemGroupOptions, getItemGroupLabel, getItemOptions, getItemLabel, getUomOptions, getUomLabel, onFieldChange],
  );

/**
 * Determines whether users should see the extra blank line that enables manual entry.
 * Indent-mandatory configurations (`indent_required = 1`) hide the blank line entirely.
 */
export const shouldAllowManualLineEntry = (mode: MuiFormMode, indentRequired?: number | string | null): boolean => {
  if (mode === "view") return false;
  if (indentRequired == null) return true;
  return Number(indentRequired) !== 1;
};

export default usePOLineItemColumns;
