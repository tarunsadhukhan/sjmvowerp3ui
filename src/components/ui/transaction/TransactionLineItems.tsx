"use client";

import * as React from "react";
import Checkbox from "@mui/material/Checkbox";
import Tooltip from "@mui/material/Tooltip";
import { Button } from "../button";
import { useBulkSelection } from "./useBulkSelection";

export type TransactionLineColumn<TItem> = {
  id: string;
  header: React.ReactNode;
  width?: string;
  className?: string;
  renderCell: (context: { item: TItem; index: number; canEdit: boolean }) => React.ReactNode;
  getTooltip?: (context: { item: TItem; index: number; canEdit: boolean }) => string | undefined;
};

export type TransactionLineItemsProps<TItem> = {
  title?: string;
  subtitle?: string;
  items: TItem[];
  getItemId: (item: TItem) => string;
  canEdit: boolean;
  columns: TransactionLineColumn<TItem>[];
  onRemoveSelected?: (ids: string[]) => void;
  placeholder?: string;
  selectable?: boolean;
  selectionColumnWidth?: string;
  removeSelectedLabel?: string;
  className?: string;
};

export function TransactionLineItems<TItem>({
  title = "Line Items",
  subtitle,
  items,
  getItemId,
  canEdit,
  columns,
  onRemoveSelected,
  placeholder,
  selectable,
  selectionColumnWidth = "48px",
  removeSelectedLabel = "Remove Selected",
  className,
}: TransactionLineItemsProps<TItem>) {
  const allowSelection = selectable ?? canEdit;

  const selection = useBulkSelection({
    items,
    getId: getItemId,
    enabled: canEdit && allowSelection,
  });

  const gridTemplateColumns = React.useMemo(() => {
    const widths = columns.map((column) => column.width ?? "1fr");
    const parts = allowSelection ? [selectionColumnWidth, ...widths] : widths;
    return parts.join(" ");
  }, [columns, allowSelection, selectionColumnWidth]);

  const handleRemoveSelected = React.useCallback(() => {
    if (!onRemoveSelected || !selection.hasSelection) return;
    onRemoveSelected(selection.selectedIds);
    selection.clear();
  }, [onRemoveSelected, selection]);

  const effectivePlaceholder = placeholder ?? (canEdit ? "Add items to build the transaction." : "No line items available.");

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base font-semibold text-slate-800">{title}</p>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {canEdit && allowSelection && onRemoveSelected ? (
          <div className="flex gap-2 print-hidden">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemoveSelected}
              disabled={!selection.hasSelection}
            >
              {removeSelectedLabel}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-280 overflow-hidden border border-slate-300 bg-white">
          <div
            className={`grid gap-x-1 bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 border-b border-slate-300`}
            style={{ gridTemplateColumns }}
          >
                  {allowSelection ? (
                    <div className="flex items-center justify-center">
                      {canEdit ? (
                        <Checkbox
                          size="small"
                          sx={{ p: 0.25, "& .MuiSvgIcon-root": { fontSize: 18 } }}
                          checked={selection.allSelected}
                          indeterminate={selection.indeterminate}
                          onChange={selection.toggleAll}
                          className="print-hidden"
                          aria-label="Select all line items"
                        />
                      ) : (
                        <span>&nbsp;</span>
                      )}
                    </div>
                  ) : null}
            {columns.map((column) => (
              <span key={column.id} className="truncate">
                {column.header}
              </span>
            ))}
          </div>

          {items.length ? (
            items.map((item, index) => {
              const itemId = getItemId(item);
              const backgroundClass = index % 2 === 0 ? "bg-white" : "bg-slate-50";

              return (
                <div
                  key={itemId}
                  className={`grid gap-x-1 items-center border-b border-slate-200 px-2 py-1 text-xs ${backgroundClass} hover:bg-slate-100 transition-colors`}
                  style={{ gridTemplateColumns }}
                >
                  {allowSelection ? (
                    <div className="flex items-center justify-center">
                      {canEdit ? (
                        <Checkbox
                          size="small"
                          sx={{ p: 0.25, "& .MuiSvgIcon-root": { fontSize: 18 } }}
                          checked={selection.isSelected(itemId)}
                          onChange={() => selection.toggleRow(itemId)}
                          className="print-hidden"
                          aria-label="Select line item"
                        />
                      ) : null}
                    </div>
                  ) : null}
                  {columns.map((column) => {
                    const content = column.renderCell({ item, index, canEdit });
                    const tooltipContent = column.getTooltip?.({ item, index, canEdit })?.trim();
                    const node = React.isValidElement(content) ? content : <span>{content}</span>;
                    
                    // Always wrap in the same structure to prevent focus loss when tooltip content changes
                    const wrapped = (
                      <Tooltip 
                        title={tooltipContent || ""} 
                        arrow 
                        placement="top" 
                        enterDelay={400}
                        disableHoverListener={!tooltipContent}
                        disableFocusListener={!tooltipContent}
                        disableTouchListener={!tooltipContent}
                      >
                        <div className="w-full">{node}</div>
                      </Tooltip>
                    );

                    return (
                      <div key={column.id} className={column.className ?? "flex flex-col gap-1"}>
                        {wrapped}
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <div className="px-2 py-3 text-center text-xs text-slate-500">{effectivePlaceholder}</div>
          )}
        </div>
      </div>
    </div>
  );
}
