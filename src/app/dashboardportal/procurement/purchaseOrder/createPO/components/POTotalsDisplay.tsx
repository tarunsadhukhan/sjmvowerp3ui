import React from "react";

type Totals = {
  netAmount: number;
  totalIGST: number;
  totalSGST: number;
  totalCGST: number;
  totalAmount: number;
  advanceAmount: number;
};

type POTotalsDisplayProps = {
  totals: Totals;
  showGSTBreakdown: boolean;
};

/** Displays the computed PO totals in a compact grid. */
export function POTotalsDisplay({ totals, showGSTBreakdown }: POTotalsDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
      <div>
        <div className="text-sm font-medium">Net Amount</div>
        <div className="text-lg">{totals.netAmount.toFixed(2)}</div>
      </div>

      {showGSTBreakdown && (
        <>
          <div>
            <div className="text-sm font-medium">Total IGST</div>
            <div className="text-lg">{totals.totalIGST.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Total SGST</div>
            <div className="text-lg">{totals.totalSGST.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Total CGST</div>
            <div className="text-lg">{totals.totalCGST.toFixed(2)}</div>
          </div>
        </>
      )}

      <div>
        <div className="text-sm font-medium">Total Amount</div>
        <div className="text-lg font-bold">{totals.totalAmount.toFixed(2)}</div>
      </div>
      <div>
        <div className="text-sm font-medium">Advance Amount</div>
        <div className="text-lg">{totals.advanceAmount.toFixed(2)}</div>
      </div>
    </div>
  );
}

export default POTotalsDisplay;
