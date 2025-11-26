import React from "react";
import { SearchableSelect } from "@/components/ui/transaction";
import { Input } from "@/components/ui/input";
import type { TransactionLineColumn } from "@/components/ui/transaction";
import type { EditableLineItem, Option } from "../types/poTypes";

type UsePOLineItemColumnsParams = {
  canEdit: boolean;
  itemGroupOptions: Option[];
  getItemOptions: (groupId: string) => Option[];
  getItemLabel: (groupId: string, itemId: string, itemCode?: string) => string;
  getUomOptions: (groupId: string, itemId: string) => Option[];
  onFieldChange: (id: string, field: keyof EditableLineItem, value: string | number) => void;
};

/**
 * Builds the TransactionLineColumn array used by the PO line items grid.
 * Separated so the heavy render logic stays out of page.tsx.
 */
export const usePOLineItemColumns = ({
  canEdit,
  itemGroupOptions,
  getItemOptions,
  getItemLabel,
  getUomOptions,
  onFieldChange,
}: UsePOLineItemColumnsParams): TransactionLineColumn<EditableLineItem>[] =>
  React.useMemo(
    () => [
      {
        id: "itemGroup",
        header: "Item Group",
        width: "1.2fr",
        renderCell: ({ item }) => {
          if (!canEdit) {
            return <span className="block truncate text-xs">{itemGroupOptions.find((o) => o.value === item.itemGroup)?.label || "-"}</span>;
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
      },
      {
        id: "item",
        header: "Item",
        width: "1.5fr",
        renderCell: ({ item }) => {
          if (!canEdit) {
            return <span className="block truncate text-xs">{getItemLabel(item.itemGroup, item.item, item.itemCode)}</span>;
          }
          const options = getItemOptions(item.itemGroup);
          const value = options.find((o) => o.value === item.item) ?? null;
          return (
            <SearchableSelect<Option>
              options={options}
              value={value}
              onChange={(next) => onFieldChange(item.id, "item", next?.value ?? "")}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              placeholder="Select item"
            />
          );
        },
      },
      {
        id: "rate",
        header: "Rate",
        width: "0.8fr",
        renderCell: ({ item }) =>
          canEdit ? (
            <Input
              type="text"
              value={item.rate}
              onChange={(e) => onFieldChange(item.id, "rate", e.target.value)}
              placeholder="0.00"
              className="h-8 text-xs"
            />
          ) : (
            <span className="block truncate text-xs">{item.rate || "-"}</span>
          ),
      },
      {
        id: "quantity",
        header: "Quantity",
        width: "0.8fr",
        renderCell: ({ item }) =>
          canEdit ? (
            <Input
              type="text"
              value={item.quantity}
              onChange={(e) => onFieldChange(item.id, "quantity", e.target.value)}
              placeholder="0"
              className="h-8 text-xs"
            />
          ) : (
            <span className="block truncate text-xs">{item.quantity || "-"}</span>
          ),
      },
      {
        id: "uom",
        header: "Unit",
        width: "0.6fr",
        renderCell: ({ item }) => {
          const options = getUomOptions(item.itemGroup, item.item);
          if (!canEdit) {
            return <span className="block truncate text-xs">{options.find((o) => o.value === item.uom)?.label || "-"}</span>;
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
      },
      {
        id: "amount",
        header: "Amount",
        width: "0.8fr",
        renderCell: ({ item }) => <span className="block truncate text-xs font-medium">{item.amount?.toFixed(2) || "0.00"}</span>,
      },
    ],
    [canEdit, itemGroupOptions, getItemOptions, getItemLabel, getUomOptions, onFieldChange],
  );

export default usePOLineItemColumns;
