// =============================================================================
// App.tsx
// =============================================================================
// PURPOSE: The root component of the application. This is where everything
// comes together. It:
//   1. Calls useAllocation() to get all state and actions
//   2. Renders the Navbar with action buttons
//   3. Renders the AllocationView with the main content
//
// WHY SO SIMPLE: App.tsx intentionally does very little itself. It just
// connects the hook (data + logic) to the UI components (visual layer).
// This separation makes each part easy to understand and test independently.
//
// MENTAL MODEL:
//   useAllocation hook  →  data + logic
//   App.tsx             →  connects hook to UI
//   Navbar              →  top bar with action buttons
//   AllocationView      →  main content area
// =============================================================================

import { Navbar }         from './layout/Navbar';
import { AllocationView } from './layout/AllocationView';
import { useAllocation }  from './hooks/useAllocation';

function App() {
  // All state and actions come from this one hook
  const {
    displayOrders,
    customers,
    summaryStats,
    filters,
    sortConfig,
    isLoading,
    isLargeSet,
    handleAutoAllocate,
    handleResetAllocations,
    handleExportCSV,
    handleToggleLargeDataset,
    handleSort,
    handleFilterChange,
    handleManualAllocate,
  } = useAllocation();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top navigation bar with action buttons */}
      <Navbar
        onAutoAllocate={handleAutoAllocate}
        onReset={handleResetAllocations}
        onExportCSV={handleExportCSV}
        onToggleLargeDataset={handleToggleLargeDataset}
        isLoading={isLoading}
        isLargeSet={isLargeSet}
        totalOrders={summaryStats.totalOrders}
      />

      {/* Main content area */}
      <AllocationView
        displayOrders={displayOrders}
        customers={customers}
        summaryStats={summaryStats}
        filters={filters}
        sortConfig={sortConfig}
        isLoading={isLoading}
        onSort={handleSort}
        onFilterChange={handleFilterChange}
        onManualAllocate={handleManualAllocate}
      />
    </div>
  );
}

export default App;
