// =============================================================================
// components/layout/Navbar.tsx
// =============================================================================
// PURPOSE: The top navigation bar. Shows the app title/logo and the main
// action buttons: Auto Allocate, Reset, Export CSV, and Load Large Dataset.
//
// WHY IN NAVBAR: Action buttons that affect the whole app belong at the top
// where they're always visible, even when the user scrolls down in the table.
// =============================================================================

import React from 'react';

interface NavbarProps {
  onAutoAllocate:        () => void;
  onReset:               () => void;
  onExportCSV:           () => void;
  onToggleLargeDataset:  () => void;
  isLoading:             boolean;
  isLargeSet:            boolean;
  totalOrders:           number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAutoAllocate,
  onReset,
  onExportCSV,
  onToggleLargeDataset,
  isLoading,
  isLargeSet,
  totalOrders,
}) => {
  return (
    <nav className="
      bg-white border-b border-slate-200 shadow-sm
      sticky top-0 z-20
    ">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">

        {/* ─── Logo / Brand ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="
            w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500
            rounded-lg flex items-center justify-center text-white text-lg
            shadow-sm
          ">
            🐟
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">
              Salmon Allocation
            </h1>
            <p className="text-xs text-slate-400 leading-tight">
              {totalOrders.toLocaleString()} orders loaded
            </p>
          </div>
        </div>

        {/* ─── Action Buttons ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Load Large Dataset toggle */}
          <button
            onClick={onToggleLargeDataset}
            disabled={isLoading}
            title="Toggle between sample data and 5000+ orders for performance testing"
            className="
              px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-150
              border-violet-200 text-violet-700 bg-violet-50
              hover:bg-violet-100 hover:border-violet-300
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-1.5
            "
          >
            ⚡ {isLargeSet ? 'Load Sample (9)' : 'Load 5,000+ Orders'}
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            disabled={isLoading}
            title="Clear all allocations"
            className="
              px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-150
              border-slate-200 text-slate-600 bg-white
              hover:bg-slate-50 hover:border-slate-300
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-1.5
            "
          >
            ↺ Reset
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCSV}
            disabled={isLoading}
            title="Download current view as CSV"
            className="
              px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-150
              border-emerald-200 text-emerald-700 bg-emerald-50
              hover:bg-emerald-100 hover:border-emerald-300
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-1.5
            "
          >
            ⬇ Export CSV
          </button>

          {/* Auto Allocate — Primary CTA */}
          <button
            onClick={onAutoAllocate}
            disabled={isLoading}
            title="Run automatic allocation algorithm"
            className="
              px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150
              bg-blue-600 text-white shadow-sm
              hover:bg-blue-700 hover:shadow
              active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
            "
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Allocating...
              </>
            ) : (
              <>
                ▶ Auto Allocate
              </>
            )}
          </button>

        </div>
      </div>
    </nav>
  );
};
