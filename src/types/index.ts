// =============================================================================
// types/index.ts
// =============================================================================
// PURPOSE: This file defines the "shape" of every piece of data in the app.
// TypeScript uses these to catch mistakes before the code even runs.
// Think of interfaces like blueprints — they describe what an object MUST have.
// =============================================================================

// ─── Order Priority ──────────────────────────────────────────────────────────
// The three types of orders. EMERGENCY is highest, DAILY is lowest.
// "as const" makes these values immutable (can't be changed by mistake).
export const ORDER_PRIORITY = {
  EMERGENCY: 0, // Processed first
  OVERDUE: 1,   // Processed second
  DAILY: 2,     // Processed last
} as const;

// This creates a TypeScript type from the keys above: "EMERGENCY" | "OVERDUE" | "DAILY"
export type OrderType = keyof typeof ORDER_PRIORITY;

// ─── Sub Order ───────────────────────────────────────────────────────────────
// A sub-order is one line item inside a larger order.
// Example: ORDER-0001 might have sub-orders ORDER-0001-001 and ORDER-0001-002
export interface SubOrder {
  id: string;             // e.g. "ORDER-0001-001"
  orderId: string;        // e.g. "ORDER-0001" (parent order)
  itemId: string;         // e.g. "Item-1" (which salmon product)
  warehouseId: string;    // e.g. "WH-001" or "WH-000" (any warehouse)
  supplierId: string;     // e.g. "SP-001" or "SP-000" (any supplier)
  requestedQty: number;   // How many kg the customer wants
  allocatedQty: number;   // How many kg we actually gave them (starts at 0)
  type: OrderType;        // EMERGENCY, OVERDUE, or DAILY
  createDate: string;     // ISO date string, e.g. "2025-01-01"
  customerId: string;     // e.g. "CT-0001"
  remark: string;         // Optional note, e.g. "Special for VIP"
  unitPrice: number;      // Price per kg (calculated from pricing rules)
  totalPrice: number;     // allocatedQty * unitPrice
}

// ─── Customer ────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;             // e.g. "CT-0001"
  name: string;           // e.g. "Aqua Fresh Co."
  creditLimit: number;    // Max they can spend across all their orders
  usedCredit: number;     // How much credit is already used (calculated)
}

// ─── Supplier ────────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;             // e.g. "SP-001"
  name: string;           // e.g. "Nordic Salmon Ltd."
}

// ─── Warehouse ───────────────────────────────────────────────────────────────
export interface Warehouse {
  id: string;             // e.g. "WH-001"
  name: string;           // e.g. "Bangkok Central Warehouse"
}

// ─── Inventory ───────────────────────────────────────────────────────────────
// One inventory record = stock of a specific item at a specific warehouse
// from a specific supplier.
export interface Inventory {
  warehouseId: string;    // Where the stock is stored
  supplierId: string;     // Who supplied it
  itemId: string;         // Which item
  remainingStock: number; // How much is left (gets reduced as we allocate)
}

// ─── Price Tier ──────────────────────────────────────────────────────────────
// Different order types get different prices.
// Based on the example: EMERGENCY = 125%, OVERDUE = 100%, DAILY = 90%
export interface PriceTier {
  orderType: OrderType;   // Which order type this tier applies to
  percentage: number;     // Price multiplier (e.g. 125 means 125% of base price)
}

// ─── Price Rule ──────────────────────────────────────────────────────────────
// One price rule = base price for an item from a supplier, plus tiers per order type
export interface PriceRule {
  itemId: string;         // Which item
  supplierId: string;     // Which supplier
  basePrice: number;      // The base price (e.g. 123.49)
  tiers: PriceTier[];     // Adjustments per order type
}

// ─── Allocation Result ───────────────────────────────────────────────────────
// What the auto-allocation engine returns for each sub-order
export interface AllocationResult {
  subOrderId: string;
  allocatedQty: number;
  warehouseId: string;    // Which warehouse was actually used
  supplierId: string;     // Which supplier was actually used
  unitPrice: number;
  totalPrice: number;
}

// ─── Sort Config ─────────────────────────────────────────────────────────────
// Used by the table to track which column is sorted and in which direction
export interface SortConfig {
  key: keyof SubOrder | null;
  direction: 'asc' | 'desc';
}

// ─── Filter State ────────────────────────────────────────────────────────────
// Used by search/filter UI to narrow down the order list
export interface FilterState {
  search: string;
  orderType: OrderType | 'ALL';
  customerId: string | 'ALL';
}
