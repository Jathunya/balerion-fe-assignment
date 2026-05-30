// =============================================================================
// utils/allocation.ts
// =============================================================================
// PURPOSE: This is the BRAIN of the application. It contains:
//   1. bankersRound()     — Rounds to 2 decimal places using Banker's Rounding
//   2. getUnitPrice()     — Looks up the correct price for an order
//   3. sortByPriority()   — Sorts orders EMERGENCY > OVERDUE > DAILY, then FIFO
//   4. runAutoAllocation()— The main allocation engine
//   5. exportToCSV()      — Converts orders to a downloadable CSV file
//
// WHY A SEPARATE FILE: Business logic should be separated from UI code.
// This makes it easy to test, understand, and change without touching components.
// =============================================================================

import { ORDER_PRIORITY } from '../types';
import type {
  SubOrder, OrderType, Inventory, PriceRule, Customer, AllocationResult
} from '../types';

// =============================================================================
// FUNCTION 1: bankersRound
// =============================================================================
// PURPOSE: Round a number to `decimalPlaces` using Banker's Rounding.
//
// WHAT IS BANKER'S ROUNDING?
//   Normal rounding: 2.5 → 3, 3.5 → 4 (always rounds .5 UP)
//   Banker's rounding: 2.5 → 2, 3.5 → 4 (rounds .5 to the NEAREST EVEN number)
//
// WHY: In financial systems, always rounding .5 up creates a tiny upward bias
// over millions of transactions. Banker's rounding eliminates that bias.
//
// EXAMPLE:
//   bankersRound(2.5, 0)  → 2  (nearest even)
//   bankersRound(3.5, 0)  → 4  (nearest even)
//   bankersRound(2.45, 1) → 2.4 (nearest even)
//   bankersRound(2.55, 1) → 2.6 (nearest even)
//
// TIME COMPLEXITY: O(1) — just math, no loops
// =============================================================================
export function bankersRound(value: number, decimalPlaces: number = 2): number {
  // Multiply to shift decimal point (e.g. 2.45 * 10 = 24.5)
  const multiplier = Math.pow(10, decimalPlaces);
  const shifted    = value * multiplier;

  // Get the fractional part after multiplying
  const floor      = Math.floor(shifted);
  const fraction   = shifted - floor;

  // If fraction is exactly 0.5, apply banker's rule (round to even)
  // Otherwise, use normal rounding
  let rounded: number;
  if (Math.abs(fraction - 0.5) < Number.EPSILON) {
    // Is the floor number even? Stay there. Odd? Round up.
    rounded = floor % 2 === 0 ? floor : floor + 1;
  } else {
    rounded = Math.round(shifted);
  }

  // Shift decimal back (e.g. 24 / 10 = 2.4)
  return rounded / multiplier;
}

// =============================================================================
// FUNCTION 2: getUnitPrice
// =============================================================================
// PURPOSE: Find the correct price per unit for an order.
//
// HOW PRICING WORKS (from the assignment):
//   - Find the price rule for this item + supplier combination
//   - Find the tier that matches the order type (EMERGENCY, OVERDUE, DAILY)
//   - Final price = basePrice * (tier.percentage / 100)
//   - Apply Banker's Rounding to 2 decimal places
//
// INPUT:  itemId, supplierId, orderType, all price rules
// OUTPUT: price per unit (number)
// TIME COMPLEXITY: O(P) where P = number of price rules (tiny in practice)
// =============================================================================
export function getUnitPrice(
  itemId: string,
  supplierId: string,
  orderType: OrderType,
  priceRules: PriceRule[]
): number {
  // Find the rule for this item + supplier
  const rule = priceRules.find(
    r => r.itemId === supplierId || // Wildcard: if supplier is SP-000, find any rule for item
    (r.itemId === itemId && r.supplierId === supplierId)
  );

  // Find rule for specific supplier first; fall back to any rule for this item
  const specificRule = priceRules.find(
    r => r.itemId === itemId && r.supplierId === supplierId
  );

  // If supplier is SP-000 (wildcard), use the first available rule for this item
  const applicableRule = specificRule ?? priceRules.find(r => r.itemId === itemId);

  if (!applicableRule) return 0; // No pricing data found

  // Find the tier that matches the order type
  const tier = applicableRule.tiers.find(t => t.orderType === orderType);
  if (!tier) return applicableRule.basePrice; // No tier found, use base price

  // Calculate: basePrice * (percentage / 100), rounded with Banker's Rounding
  return bankersRound(applicableRule.basePrice * (tier.percentage / 100), 2);
}

// =============================================================================
// FUNCTION 3: sortByPriority
// =============================================================================
// PURPOSE: Sort orders by the allocation rules:
//   1. EMERGENCY first, then OVERDUE, then DAILY
//   2. Within the same type, older orders first (FIFO — First In, First Out)
//
// WHY FIFO: If two customers both have EMERGENCY orders, the one who placed
// their order earlier gets stock first. This is fair.
//
// INPUT:  Array of SubOrders (unsorted)
// OUTPUT: New array of SubOrders (sorted, does NOT modify original)
// TIME COMPLEXITY: O(n log n) — JavaScript's built-in sort uses TimSort
// SPACE COMPLEXITY: O(n) — creates a shallow copy with [...orders]
// =============================================================================
export function sortByPriority(orders: SubOrder[]): SubOrder[] {
  return [...orders].sort((a, b) => {
    // Compare by type priority first (EMERGENCY=0, OVERDUE=1, DAILY=2)
    const priorityDiff = ORDER_PRIORITY[a.type] - ORDER_PRIORITY[b.type];
    if (priorityDiff !== 0) return priorityDiff;

    // Same priority → sort by createDate ascending (oldest first = FIFO)
    return new Date(a.createDate).getTime() - new Date(b.createDate).getTime();
  });
}

// =============================================================================
// FUNCTION 4: findBestInventory
// =============================================================================
// PURPOSE: Given an order, find all inventory records that can fulfill it,
// sorted by remaining stock descending (most stock first).
//
// LOGIC:
//   - If order.warehouseId is "WH-000" → any warehouse matches
//   - If order.supplierId is "SP-000"  → any supplier matches
//   - Otherwise, must match exactly
//   - Prefer combos with the MOST remaining stock (greedy approach)
//
// INPUT:  SubOrder, current inventory array
// OUTPUT: Sorted array of matching Inventory records
// TIME COMPLEXITY: O(I) where I = number of inventory records
// =============================================================================
function findBestInventory(order: SubOrder, inventory: Inventory[]): Inventory[] {
  const isAnyWarehouse = order.warehouseId === 'WH-000';
  const isAnySupplier  = order.supplierId  === 'SP-000';

  return inventory
    .filter(inv => {
      // Must match item
      if (inv.itemId !== order.itemId) return false;
      // Must have stock
      if (inv.remainingStock <= 0) return false;
      // Warehouse must match (unless WH-000)
      if (!isAnyWarehouse && inv.warehouseId !== order.warehouseId) return false;
      // Supplier must match (unless SP-000)
      if (!isAnySupplier  && inv.supplierId  !== order.supplierId)  return false;
      return true;
    })
    // Sort by most stock first (greedy: fill as much as possible per slot)
    .sort((a, b) => b.remainingStock - a.remainingStock);
}

// =============================================================================
// FUNCTION 5: runAutoAllocation
// =============================================================================
// PURPOSE: The main allocation engine. Processes all orders automatically.
//
// ALGORITHM (step by step):
//   1. Deep-copy inventory so we don't mutate the original
//   2. Build a map of customer credit usage (fast O(1) lookups)
//   3. Sort orders by priority (EMERGENCY > OVERDUE > DAILY, then FIFO)
//   4. For each order in priority order:
//      a. Find matching inventory slots (best stock first)
//      b. Check how much credit the customer has left
//      c. Calculate the unit price for this order
//      d. Fill from inventory slots until request is satisfied or stock runs out
//      e. Apply Banker's Rounding to allocated quantity
//      f. Record the result
//   5. Return all results
//
// INPUT:
//   orders      — all sub-orders (unmodified)
//   inventory   — current inventory (will be copied, NOT modified)
//   customers   — for credit limit validation
//   priceRules  — for price calculation
//
// OUTPUT: Array of AllocationResult (one per order)
//
// TIME COMPLEXITY:
//   O(n log n) for sorting + O(n * I) for allocation loop
//   Where n = orders, I = inventory records per order (small constant)
//   Effectively O(n log n) in practice
//
// SPACE COMPLEXITY: O(n + I) for copies
// =============================================================================
export function runAutoAllocation(
  orders: SubOrder[],
  inventory: Inventory[],
  customers: Customer[],
  priceRules: PriceRule[]
): AllocationResult[] {
  // Step 1: Deep-copy inventory — we reduce stock as we allocate
  // This prevents mutating the original state directly
  const workingInventory: Inventory[] = inventory.map(inv => ({ ...inv }));

  // Step 2: Build customer credit map for O(1) lookups
  // Key = customerId, Value = { limit, used }
  const creditMap = new Map<string, { limit: number; used: number }>();
  for (const customer of customers) {
    creditMap.set(customer.id, {
      limit: customer.creditLimit,
      used:  customer.usedCredit,
    });
  }

  // Step 3: Sort orders by priority (does NOT modify original array)
  const sortedOrders = sortByPriority(orders);

  // Step 4: Process each order
  const results: AllocationResult[] = [];

  for (const order of sortedOrders) {
    // Find inventory that can fulfill this order (sorted: most stock first)
    const availableSlots = findBestInventory(order, workingInventory);

    // Get customer credit info
    const credit = creditMap.get(order.customerId);
    if (!credit) {
      // Customer not found — allocate 0
      results.push({
        subOrderId:  order.id,
        allocatedQty: 0,
        warehouseId:  order.warehouseId,
        supplierId:   order.supplierId,
        unitPrice:    0,
        totalPrice:   0,
      });
      continue;
    }

    const remainingCredit = credit.limit - credit.used;

    let totalAllocated = 0;
    let usedWarehouseId = order.warehouseId;
    let usedSupplierId  = order.supplierId;

    // Step 4a: Fill from inventory slots until request is satisfied
    for (const slot of availableSlots) {
      if (totalAllocated >= order.requestedQty) break; // Already satisfied

      // How much can we take from this slot?
      const stillNeeded = order.requestedQty - totalAllocated;
      const canTake     = Math.min(stillNeeded, slot.remainingStock);

      // Step 4b: Check credit limit
      // Which supplier are we actually using? (slot.supplierId is the real one)
      const actualSupplierId = order.supplierId === 'SP-000' ? slot.supplierId : order.supplierId;
      const unitPrice = getUnitPrice(order.itemId, actualSupplierId, order.type, priceRules);
      const costForThis = canTake * unitPrice;

      // How much can we actually afford?
      const creditLeft   = remainingCredit - (totalAllocated * unitPrice);
      if (creditLeft <= 0) break; // No credit left for this customer

      const affordableQty = Math.floor(creditLeft / unitPrice);
      const actualTake    = Math.min(canTake, affordableQty);

      if (actualTake <= 0) break;

      // Reduce stock in our working inventory copy
      slot.remainingStock -= actualTake;
      totalAllocated      += actualTake;

      // Record which warehouse/supplier we actually used (for wildcard orders)
      usedWarehouseId = slot.warehouseId;
      usedSupplierId  = slot.supplierId;
    }

    // Step 4c: Apply Banker's Rounding to final allocated quantity
    const roundedQty = bankersRound(totalAllocated, 2);

    // Step 4d: Calculate pricing with the actual supplier used
    const finalSupplierId = order.supplierId === 'SP-000' ? usedSupplierId : order.supplierId;
    const unitPrice       = getUnitPrice(order.itemId, finalSupplierId, order.type, priceRules);
    const totalPrice      = bankersRound(roundedQty * unitPrice, 2);

    // Step 4e: Update customer credit usage
    credit.used += totalPrice;

    results.push({
      subOrderId:   order.id,
      allocatedQty: roundedQty,
      warehouseId:  usedWarehouseId,
      supplierId:   usedSupplierId,
      unitPrice,
      totalPrice,
    });
  }

  return results;
}

// =============================================================================
// FUNCTION 6: applyAllocationResults
// =============================================================================
// PURPOSE: Takes the results from runAutoAllocation and merges them back
// into the orders array to produce updated SubOrder objects.
//
// WHY SEPARATE: The allocation engine returns just the changes (results).
// This function merges those changes into the full order objects for display.
//
// TIME COMPLEXITY: O(n) where n = number of orders
// =============================================================================
export function applyAllocationResults(
  orders: SubOrder[],
  results: AllocationResult[]
): SubOrder[] {
  // Build a map for O(1) result lookups by subOrderId
  const resultMap = new Map<string, AllocationResult>();
  for (const result of results) {
    resultMap.set(result.subOrderId, result);
  }

  return orders.map(order => {
    const result = resultMap.get(order.id);
    if (!result) return order; // No result = unchanged

    return {
      ...order,                          // Copy all existing fields
      allocatedQty: result.allocatedQty, // Override with allocation result
      unitPrice:    result.unitPrice,
      totalPrice:   result.totalPrice,
      // Update warehouse/supplier if wildcards were resolved
      warehouseId:  order.warehouseId === 'WH-000' ? result.warehouseId : order.warehouseId,
      supplierId:   order.supplierId  === 'SP-000' ? result.supplierId  : order.supplierId,
    };
  });
}

// =============================================================================
// FUNCTION 7: validateManualAllocation
// =============================================================================
// PURPOSE: Before allowing a manual allocation, check all business rules.
// Returns an error message string if invalid, or null if valid.
//
// RULES CHECKED:
//   1. Quantity must be positive
//   2. Cannot exceed requested quantity
//   3. Cannot exceed available inventory
//   4. Cannot exceed customer credit limit
//
// TIME COMPLEXITY: O(I) where I = inventory records (small)
// =============================================================================
export function validateManualAllocation(
  order: SubOrder,
  newQty: number,
  inventory: Inventory[],
  customers: Customer[],
  priceRules: PriceRule[],
  allOrders: SubOrder[]
): string | null {
  // Rule 1: Must be non-negative
  if (newQty < 0) return 'Allocated quantity cannot be negative.';

  // Rule 2: Cannot exceed requested quantity
  if (newQty > order.requestedQty) {
    return `Cannot allocate more than requested (${order.requestedQty}).`;
  }

  // Rule 3: Check inventory availability
  const availableSlots = findBestInventory(order, inventory);
  const totalAvailable = availableSlots.reduce((sum, s) => sum + s.remainingStock, 0);
  // Add back what was previously allocated to this order (it's being reallocated)
  const netAvailable   = totalAvailable + order.allocatedQty;
  if (newQty > netAvailable) {
    return `Insufficient stock. Only ${netAvailable} units available.`;
  }

  // Rule 4: Check credit limit
  const customer = customers.find(c => c.id === order.customerId);
  if (!customer) return 'Customer not found.';

  // Calculate total spend across all orders for this customer (excluding current order)
  const otherOrdersSpend = allOrders
    .filter(o => o.customerId === order.customerId && o.id !== order.id)
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const unitPrice  = getUnitPrice(order.itemId, order.supplierId, order.type, priceRules);
  const newTotal   = bankersRound(newQty * unitPrice, 2);
  const totalSpend = otherOrdersSpend + newTotal;

  if (totalSpend > customer.creditLimit) {
    const remaining = customer.creditLimit - otherOrdersSpend;
    const maxQty    = Math.floor(remaining / unitPrice);
    return `Exceeds credit limit. Max allocatable: ${maxQty} units (${remaining.toFixed(2)} credit remaining).`;
  }

  return null; // All checks passed
}

// =============================================================================
// FUNCTION 8: exportToCSV
// =============================================================================
// PURPOSE: Convert the orders array into a CSV string, then trigger a browser
// download so the user can save the file.
//
// HOW IT WORKS:
//   1. Define the CSV column headers
//   2. Map each order to a row of comma-separated values
//   3. Join rows with newlines → CSV string
//   4. Create a Blob (binary large object) from the string
//   5. Create a temporary <a> link, click it programmatically, then remove it
//
// WHY THIS APPROACH: This is the standard browser-based CSV download pattern.
// No external library needed. Works in all modern browsers.
//
// TIME COMPLEXITY: O(n) where n = number of orders
// =============================================================================
export function exportToCSV(orders: SubOrder[], filename: string = 'allocation_export.csv'): void {
  // Step 1: Column headers (matches a typical allocation report)
  const headers = [
    'Order ID',
    'Sub Order ID',
    'Item ID',
    'Warehouse ID',
    'Supplier ID',
    'Type',
    'Create Date',
    'Customer ID',
    'Requested Qty',
    'Allocated Qty',
    'Unit Price',
    'Total Price',
    'Remark',
  ];

  // Step 2: Map each order to a row
  // We wrap string values in quotes to handle commas inside values
  const rows = orders.map(order => [
    order.orderId,
    order.id,
    order.itemId,
    order.warehouseId,
    order.supplierId,
    order.type,
    order.createDate,
    order.customerId,
    order.requestedQty,
    order.allocatedQty,
    order.unitPrice.toFixed(2),
    order.totalPrice.toFixed(2),
    `"${order.remark}"`, // Quotes handle commas in remarks
  ].join(','));

  // Step 3: Combine headers + rows into one CSV string
  const csvContent = [headers.join(','), ...rows].join('\n');

  // Step 4: Create a downloadable Blob
  // \uFEFF is the UTF-8 BOM — makes Excel open the file with correct encoding
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);

  // Step 5: Create a temporary link and click it
  const link    = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup: remove link and revoke the URL to free memory
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================================================
// FUNCTION 9: filterOrders
// =============================================================================
// PURPOSE: Apply search text and filter dropdowns to narrow down the order list.
//
// SEARCH FIELDS: Searches across orderId, subOrderId, customerId, itemId, type, remark
// This gives users maximum flexibility to find any order quickly.
//
// TIME COMPLEXITY: O(n) — single pass through orders
// =============================================================================
export function filterOrders(
  orders: SubOrder[],
  search: string,
  typeFilter: string,
  customerFilter: string
): SubOrder[] {
  const searchLower = search.toLowerCase().trim();

  return orders.filter(order => {
    // Filter by order type
    if (typeFilter !== 'ALL' && order.type !== typeFilter) return false;

    // Filter by customer
    if (customerFilter !== 'ALL' && order.customerId !== customerFilter) return false;

    // Filter by search text (search multiple fields at once)
    if (searchLower) {
      const searchable = [
        order.orderId,
        order.id,
        order.customerId,
        order.itemId,
        order.type,
        order.warehouseId,
        order.supplierId,
        order.remark,
      ].join(' ').toLowerCase();

      if (!searchable.includes(searchLower)) return false;
    }

    return true;
  });
}

// =============================================================================
// FUNCTION 10: sortOrders
// =============================================================================
// PURPOSE: Sort orders by a specific column, in ascending or descending order.
// Used by the table when a user clicks a column header.
//
// TIME COMPLEXITY: O(n log n)
// =============================================================================
export function sortOrders(
  orders: SubOrder[],
  key: keyof SubOrder | null,
  direction: 'asc' | 'desc'
): SubOrder[] {
  if (!key) return orders;

  return [...orders].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    // Handle date strings
    if (key === 'createDate') {
      const diff = new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
      return direction === 'asc' ? diff : -diff;
    }

    // Handle numbers
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Handle strings
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    const cmp  = aStr.localeCompare(bStr);
    return direction === 'asc' ? cmp : -cmp;
  });
}

// =============================================================================
// FUNCTION 11: computeCustomerCredit
// =============================================================================
// PURPOSE: Calculate how much credit each customer has used based on current
// order allocations. Returns a map for O(1) lookup.
//
// WHY: Credit usage changes every time we allocate. Rather than storing it in
// the order data, we calculate it fresh from the current allocations.
//
// TIME COMPLEXITY: O(n) where n = number of orders
// =============================================================================
export function computeCustomerCredit(
  orders: SubOrder[],
  customers: Customer[]
): Map<string, { used: number; limit: number; remaining: number }> {
  // Sum up total price for each customer
  const usageMap = new Map<string, number>();
  for (const order of orders) {
    const existing = usageMap.get(order.customerId) ?? 0;
    usageMap.set(order.customerId, existing + order.totalPrice);
  }

  // Build result map
  const result = new Map<string, { used: number; limit: number; remaining: number }>();
  for (const customer of customers) {
    const used      = usageMap.get(customer.id) ?? 0;
    const remaining = customer.creditLimit - used;
    result.set(customer.id, { used, limit: customer.creditLimit, remaining });
  }

  return result;
}
