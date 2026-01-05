/**
 * Calculation functions for Jute Purchase Order.
 * Handles weight and amount calculations based on unit type.
 */

// =============================================================================
// WEIGHT CALCULATION
// =============================================================================

/**
 * Calculate weight based on unit type (LOOSE or BALE).
 * 
 * For LOOSE: weight = (totalVehicleWeight * quantity%) / 100
 *   - quantity is a percentage of total vehicle capacity
 *   - totalVehicleWeight = vehicleCapacity * vehicleQty
 * 
 * For BALE: weight = 150 * quantity
 *   - 150 kg per bale standard weight
 *   - quantity is number of bales
 * 
 * @param quantity - The quantity value (percentage for LOOSE, count for BALE)
 * @param vehicleCapacityWeight - Weight capacity of one vehicle (in quintals/kg)
 * @param vehicleQty - Number of vehicles
 * @param unitType - "LOOSE" or "BALE"
 * @returns Calculated weight
 */
export const calculateWeight = (
  quantity: number,
  vehicleCapacityWeight: number,
  vehicleQty: number,
  unitType: "LOOSE" | "BALE" | string
): number => {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 0;
  }

  if (unitType === "BALE") {
    // For bale: 1.5 quintals per bale (150 kg / 100) * quantity
    return 1.5 * quantity;
  }

  // For loose: percentage-based calculation (result already in quintals)
  const totalVehicleWeight = vehicleCapacityWeight * vehicleQty;
  if (!Number.isFinite(totalVehicleWeight) || totalVehicleWeight <= 0) {
    return 0;
  }

  return (totalVehicleWeight * quantity) / 100;
};

// =============================================================================
// AMOUNT CALCULATION
// =============================================================================

/**
 * Calculate line item amount.
 * 
 * @param weight - Calculated weight
 * @param rate - Rate per unit weight
 * @returns Calculated amount (weight * rate)
 */
export const calculateAmount = (weight: number, rate: number): number => {
  if (!Number.isFinite(weight) || !Number.isFinite(rate)) {
    return 0;
  }
  return weight * rate;
};

// =============================================================================
// EXPECTED DATE CALCULATION
// =============================================================================

/**
 * Calculate expected delivery date.
 * 
 * @param poDate - PO date string (YYYY-MM-DD)
 * @param deliveryTimeline - Number of days for delivery
 * @returns Expected date string (YYYY-MM-DD)
 */
export const calculateExpectedDate = (
  poDate: string,
  deliveryTimeline: number
): string => {
  if (!poDate || !Number.isFinite(deliveryTimeline) || deliveryTimeline <= 0) {
    return "";
  }

  try {
    const date = new Date(poDate);
    if (isNaN(date.getTime())) {
      return "";
    }

    date.setDate(date.getDate() + deliveryTimeline);
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

// =============================================================================
// TOTALS CALCULATION
// =============================================================================

/**
 * Calculate totals for all line items.
 * 
 * @param lineItems - Array of line items with weight and amount
 * @returns Object with totalWeight, totalAmount, and validLineCount
 */
export const calculateTotals = (
  lineItems: Array<{ weight: string; amount: string; itemId?: string; quantity?: string }>
): { totalWeight: number; totalAmount: number; validLineCount: number } => {
  let totalWeight = 0;
  let totalAmount = 0;
  let validLineCount = 0;

  for (const line of lineItems) {
    const weight = Number(line.weight);
    const amount = Number(line.amount);
    const qty = Number(line.quantity);

    if (Number.isFinite(weight) && weight > 0) {
      totalWeight += weight;
    }
    if (Number.isFinite(amount) && amount > 0) {
      totalAmount += amount;
    }
    if (line.itemId && Number.isFinite(qty) && qty > 0) {
      validLineCount += 1;
    }
  }

  return { totalWeight, totalAmount, validLineCount };
};

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

/**
 * Format a number to a fixed decimal string.
 * 
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  if (!Number.isFinite(value)) {
    return "";
  }
  return value.toFixed(decimals);
};

/**
 * Format a number as currency (INR).
 * 
 * @param value - Number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "₹0.00";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
};

/**
 * Format weight value.
 * @param value - Weight in quintals
 * @returns Formatted weight string
 */
export const formatWeight = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0.00";
  }
  return value.toFixed(2);
};

/**
 * Format amount value.
 * @param value - Amount
 * @returns Formatted amount string
 */
export const formatAmount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0.00";
  }
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format date string.
 * @param dateStr - ISO date string
 * @returns Formatted date (DD/MM/YYYY)
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};
