// =============================================================================
// components/ui/Badge.tsx
// =============================================================================
// PURPOSE: A reusable colored badge to display order types (EMERGENCY, etc.)
// Each order type gets a distinct color so users can visually scan the table.
// =============================================================================

import React from 'react';
import type { OrderType } from '../../types';

interface BadgeProps {
  type: OrderType;
}

// Color mapping: each order type gets its own color scheme
// Using Tailwind's utility classes for consistent styling
const BADGE_STYLES: Record<OrderType, string> = {
  EMERGENCY: 'bg-red-100 text-red-800 border border-red-200 font-semibold',
  OVERDUE:   'bg-amber-100 text-amber-800 border border-amber-200 font-semibold',
  DAILY:     'bg-emerald-100 text-emerald-800 border border-emerald-200',
};

export const OrderTypeBadge: React.FC<BadgeProps> = ({ type }) => {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
      ${BADGE_STYLES[type]}
    `}>
      {type}
    </span>
  );
};

// ─── Allocation Status Badge ──────────────────────────────────────────────────
interface AllocationBadgeProps {
  allocatedQty: number;
  requestedQty: number;
}

export const AllocationBadge: React.FC<AllocationBadgeProps> = ({ allocatedQty, requestedQty }) => {
  if (allocatedQty === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 border border-slate-200">
        Pending
      </span>
    );
  }
  if (allocatedQty >= requestedQty) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold">
        ✓ Full
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200">
      Partial
    </span>
  );
};
