// =============================================================================
// components/layout/AllocationView.tsx
// =============================================================================
// PURPOSE: The main content area below the navbar. It contains:
//   1. Summary Cards (metrics overview)
//   2. Search + Filter toolbar
//   3. The Allocation Table
//
// This is a "layout" component — it organizes other components on the page.
// It receives all data and actions from App.tsx (through the hook) and passes
// them down to child components.
//
// ARCHITECTURE NOTE:
//   App.tsx → AllocationView → SummaryCards + AllocationTable
//
// This "prop drilling" is intentional — the app is not complex enough to
// warrant a context provider, and it keeps data flow easy to trace.
// =============================================================================

import React from 'react';
import type { SubOrder, SortConfig, FilterState, Customer } from '../types';
import { SummaryCards } from '../allocation/SummaryCards';
import { AllocationTable } from '../allocation/AllocationTable';

interface AllocationViewProps {
  displayOrders:  SubOrder[];
  customers:      Customer[];
  summaryStats: {
    totalOrders:     number;
    allocatedOrders: number;
    totalRequested:  number;
    totalAllocated:  number;
    totalValue:      number;
    fulfillmentRate: number;
  };
  filters:         FilterState;
  sortConfig:      SortConfig;
  isLoading:       boolean;
  onSort:          (key: keyof SubOrder) => void;
  onFilterChange:  (field: keyof FilterState, value: string) => void;
  onManualAllocate:(orderId: string, qty: number) => string | null;
}

export const AllocationView: React.FC<AllocationViewProps> = ({
  displayOrders,
  customers,
  summaryStats,
  filters,
  sortConfig,
  isLoading,
  onSort,
  onFilterChange,
  onManualAllocate,
}) => {
  return (
    <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">

      {/* ─── Summary Cards ─────────────────────────────────────────────── */}
      <SummaryCards {...summaryStats} />

      {/* ─── Filters Toolbar ───────────────────────────────────────────── */}
      <div className="
        bg-white rounded-xl shadow-sm border border-slate-100
        px-4 py-3 mb-4 flex items-center gap-3 flex-wrap
      ">
        {/* Search input */}
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search orders, customers, items..."
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            className="
              w-full pl-9 pr-4 py-2 text-sm
              border border-slate-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder:text-slate-400
            "
          />
        </div>

        {/* Order Type filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Type:</label>
          <select
            value={filters.orderType}
            onChange={e => onFilterChange('orderType', e.target.value)}
            className="
              text-sm border border-slate-200 rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-blue-500
              text-slate-700 bg-white cursor-pointer
            "
          >
            <option value="ALL">All Types</option>
            <option value="EMERGENCY">🔴 EMERGENCY</option>
            <option value="OVERDUE">🟡 OVERDUE</option>
            <option value="DAILY">🟢 DAILY</option>
          </select>
        </div>

        {/* Customer filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Customer:</label>
          <select
            value={filters.customerId}
            onChange={e => onFilterChange('customerId', e.target.value)}
            className="
              text-sm border border-slate-200 rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-blue-500
              text-slate-700 bg-white cursor-pointer
            "
          >
            <option value="ALL">All Customers</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter indicator */}
        {(filters.search || filters.orderType !== 'ALL' || filters.customerId !== 'ALL') && (
          <button
            onClick={() => {
              onFilterChange('search', '');
              onFilterChange('orderType', 'ALL');
              onFilterChange('customerId', 'ALL');
            }}
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* ─── Allocation Rules Reference ────────────────────────────────── */}
      <div className="
        bg-blue-50 border border-blue-100 rounded-lg
        px-4 py-2.5 mb-4 flex items-start gap-3
      ">
        <span className="text-blue-500 text-sm mt-0.5">ℹ</span>
        <div className="text-xs text-blue-700 leading-relaxed">
          <strong>Allocation Rules:</strong>{' '}
          Priority: EMERGENCY &gt; OVERDUE &gt; DAILY.{' '}
          Within same type, older orders are processed first (FIFO).{' '}
          Credit limits are enforced per customer.{' '}
          <span className="font-mono text-violet-600">WH-000</span> / <span className="font-mono text-violet-600">SP-000</span> = wildcard (any warehouse/supplier).{' '}
          Quantities rounded with <strong>Banker's Rounding</strong>.
        </div>
      </div>

      {/* ─── Allocation Table ───────────────────────────────────────────── */}
      <AllocationTable
        orders={displayOrders}
        sortConfig={sortConfig}
        customers={customers}
        onSort={onSort}
        onManualAllocate={onManualAllocate}
        isLoading={isLoading}
      />

    </main>
  );
};
