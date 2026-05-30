// =============================================================================
// hooks/useAllocation.ts
// =============================================================================
// PURPOSE: This is the "state manager" for the entire application.
// A custom hook is a function that starts with "use" and holds React state.
//
// WHY A CUSTOM HOOK:
//   Instead of scattering useState() calls across many components, we put ALL
//   application state in one place. Components just call useAllocation() and
//   they get everything they need. This is the "single source of truth" pattern.
//
// WHAT THIS HOOK PROVIDES:
//   State:   orders, inventory, customers, filters, sort config, loading state
//   Actions: handleAutoAllocate, handleManualAllocate, handleSearch, etc.
//
// PERFORMANCE:
//   - useMemo: Recalculates filtered/sorted orders ONLY when dependencies change
//   - useCallback: Prevents action functions from being recreated every render
//   - Both prevent unnecessary re-renders in child components
// =============================================================================

import { useState, useMemo, useCallback } from 'react';
import type { SubOrder, SortConfig, FilterState, OrderType } from '../types';
import {
  SAMPLE_ORDERS,
  SAMPLE_INVENTORY,
  SAMPLE_CUSTOMERS,
  SAMPLE_PRICE_RULES,
  generateLargeDataset,
} from '../data/sampleData';
import {
  runAutoAllocation,
  applyAllocationResults,
  validateManualAllocation,
  exportToCSV,
  filterOrders,
  sortOrders,
  computeCustomerCredit,
  bankersRound,
  getUnitPrice,
} from '../utils/allocation';

// =============================================================================
// useAllocation Hook
// =============================================================================
export function useAllocation() {
  // ─── Core Data State ────────────────────────────────────────────────────────
  // These are the "source of truth" for all data.
  // We start with sample orders and inventory from our data file.
  const [orders,    setOrders]    = useState<SubOrder[]>(SAMPLE_ORDERS);
  const [inventory, setInventory] = useState(SAMPLE_INVENTORY);
  const [customers]               = useState(SAMPLE_CUSTOMERS); // Customers don't change in this app
  const [priceRules]              = useState(SAMPLE_PRICE_RULES);

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [isLoading,  setIsLoading]  = useState(false);  // Shows loading spinner during allocation
  const [isLargeSet, setIsLargeSet] = useState(false);  // Toggle for 5000+ dataset

  // ─── Filter State ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    search:     '',
    orderType:  'ALL',
    customerId: 'ALL',
  });

  // ─── Sort State ──────────────────────────────────────────────────────────────
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key:       null,
    direction: 'asc',
  });

  // ─── Computed: Customer Credit Map ────────────────────────────────────────────
  // useMemo recalculates this ONLY when orders or customers change.
  // Without useMemo, this would run on every single render (wasteful).
  const customerCreditMap = useMemo(
    () => computeCustomerCredit(orders, customers),
    [orders, customers]
  );

  // ─── Computed: Filtered + Sorted Orders ──────────────────────────────────────
  // This is what the table actually displays. It's derived from:
  //   orders → filter → sort → displayOrders
  //
  // useMemo ensures this expensive operation only runs when its inputs change,
  // not on every render. Critical for 5000+ order performance.
  const displayOrders = useMemo(() => {
    // Step 1: Apply search and filter dropdowns
    const filtered = filterOrders(
      orders,
      filters.search,
      filters.orderType,
      filters.customerId
    );

    // Step 2: Apply column sort
    return sortOrders(filtered, sortConfig.key, sortConfig.direction);
  }, [orders, filters, sortConfig]);

  // ─── Computed: Summary Statistics ─────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    const totalOrders     = orders.length;
    const allocatedOrders = orders.filter(o => o.allocatedQty > 0).length;
    const totalRequested  = orders.reduce((sum, o) => sum + o.requestedQty, 0);
    const totalAllocated  = orders.reduce((sum, o) => sum + o.allocatedQty, 0);
    const totalValue      = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const fulfillmentRate = totalRequested > 0
      ? bankersRound((totalAllocated / totalRequested) * 100, 1)
      : 0;

    return { totalOrders, allocatedOrders, totalRequested, totalAllocated, totalValue, fulfillmentRate };
  }, [orders]);

  // =============================================================================
  // ACTION: handleAutoAllocate
  // =============================================================================
  // Runs the full auto-allocation engine on all orders.
  // Uses setTimeout to avoid blocking the UI (simulates async processing).
  // =============================================================================
  const handleAutoAllocate = useCallback(() => {
    setIsLoading(true);

    // Use setTimeout to allow React to render the loading state first,
    // then run the (potentially slow) allocation algorithm
    setTimeout(() => {
      try {
        // Step 1: Run the allocation engine
        const results = runAutoAllocation(orders, inventory, customers, priceRules);

        // Step 2: Merge results back into orders
        const updatedOrders = applyAllocationResults(orders, results);

        // Step 3: Update state → triggers re-render
        setOrders(updatedOrders);
      } finally {
        setIsLoading(false);
      }
    }, 50); // 50ms delay gives React time to show the loading spinner
  }, [orders, inventory, customers, priceRules]);

  // =============================================================================
  // ACTION: handleManualAllocate
  // =============================================================================
  // Allows a user to manually set the allocated quantity for one order.
  // Validates all business rules before applying.
  //
  // Returns: error message string if invalid, or null if success
  // =============================================================================
  const handleManualAllocate = useCallback((
    orderId: string,
    newQty: number
  ): string | null => {
    // Find the order being edited
    const order = orders.find(o => o.id === orderId);
    if (!order) return 'Order not found.';

    // Validate against all business rules
    const error = validateManualAllocation(
      order,
      newQty,
      inventory,
      customers,
      priceRules,
      orders
    );
    if (error) return error;

    // Valid — apply the allocation
    const actualSupplierId = order.supplierId === 'SP-000'
      ? (inventory.find(inv => inv.itemId === order.itemId && inv.remainingStock > 0)?.supplierId ?? order.supplierId)
      : order.supplierId;

    const unitPrice  = getUnitPrice(order.itemId, actualSupplierId, order.type, priceRules);
    const totalPrice = bankersRound(newQty * unitPrice, 2);

    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, allocatedQty: newQty, unitPrice, totalPrice }
        : o
    ));

    return null; // Success
  }, [orders, inventory, customers, priceRules]);

  // =============================================================================
  // ACTION: handleResetAllocations
  // =============================================================================
  // Resets all allocations back to 0. Useful for starting fresh.
  // =============================================================================
  const handleResetAllocations = useCallback(() => {
    setOrders(prev => prev.map(o => ({
      ...o,
      allocatedQty: 0,
      unitPrice:    0,
      totalPrice:   0,
    })));
  }, []);

  // =============================================================================
  // ACTION: handleExportCSV
  // =============================================================================
  // Exports the DISPLAYED orders (with current filters) to a CSV file.
  // =============================================================================
  const handleExportCSV = useCallback(() => {
    exportToCSV(displayOrders, `salmon_allocation_${new Date().toISOString().split('T')[0]}.csv`);
  }, [displayOrders]);

  // =============================================================================
  // ACTION: handleSort
  // =============================================================================
  // Toggles sort direction if clicking the same column, or sets new sort column.
  // =============================================================================
  const handleSort = useCallback((key: keyof SubOrder) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // =============================================================================
  // ACTION: handleFilterChange
  // =============================================================================
  const handleFilterChange = useCallback((
    field: keyof FilterState,
    value: string
  ) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  // =============================================================================
  // ACTION: handleToggleLargeDataset
  // =============================================================================
  // Switches between sample data (9 orders) and large dataset (5000+ orders)
  // to demonstrate performance capabilities.
  // =============================================================================
  const handleToggleLargeDataset = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      if (isLargeSet) {
        setOrders(SAMPLE_ORDERS);
        setInventory(SAMPLE_INVENTORY);
      } else {
        setOrders(generateLargeDataset(5000));
        // For large dataset, use scaled-up inventory
        setInventory(SAMPLE_INVENTORY.map(inv => ({
          ...inv,
          remainingStock: inv.remainingStock * 100, // Scale up for large dataset
        })));
      }
      setIsLargeSet(prev => !prev);
      setIsLoading(false);
    }, 100);
  }, [isLargeSet]);

  // Return everything the components need
  return {
    // State
    orders,
    inventory,
    customers,
    displayOrders,
    summaryStats,
    customerCreditMap,
    filters,
    sortConfig,
    isLoading,
    isLargeSet,

    // Actions
    handleAutoAllocate,
    handleManualAllocate,
    handleResetAllocations,
    handleExportCSV,
    handleSort,
    handleFilterChange,
    handleToggleLargeDataset,
  };
}
