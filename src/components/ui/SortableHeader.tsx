// =============================================================================
// components/ui/SortableHeader.tsx
// =============================================================================
// PURPOSE: A table header cell that shows sort direction and handles clicks.
// Clicking a header sorts the table by that column.
// Clicking the same header again reverses the sort direction.
//
// WHY: Reusable component for all sortable columns.
// Instead of duplicating sort UI logic in every header cell, we extract it here.
// =============================================================================

import React from 'react';
import type { SubOrder, SortConfig } from '../../types';

interface SortableHeaderProps {
  label: string;
  sortKey: keyof SubOrder;
  sortConfig: SortConfig;
  onSort: (key: keyof SubOrder) => void;
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  sortConfig,
  onSort,
  className = '',
}) => {
  const isActive    = sortConfig.key === sortKey;
  const isAsc       = isActive && sortConfig.direction === 'asc';
  const isDesc      = isActive && sortConfig.direction === 'desc';

  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`
        px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider
        cursor-pointer select-none whitespace-nowrap
        hover:text-slate-800 hover:bg-slate-50 transition-colors duration-100
        ${isActive ? 'text-blue-600' : ''}
        ${className}
      `}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        <span className="flex flex-col leading-none">
          <span className={`text-[8px] ${isAsc ? 'text-blue-600' : 'text-slate-300'}`}>▲</span>
          <span className={`text-[8px] ${isDesc ? 'text-blue-600' : 'text-slate-300'}`}>▼</span>
        </span>
      </div>
    </th>
  );
};
