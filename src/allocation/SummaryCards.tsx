// =============================================================================
// components/allocation/SummaryCards.tsx
// =============================================================================
// PURPOSE: Shows 4 summary metric cards at the top of the page:
//   - Total Orders
//   - Allocated Orders
//   - Fulfillment Rate (%)
//   - Total Value (currency)
//
// WHY: Users need a quick overview of allocation progress at a glance,
// without having to scan every row of the table.
// =============================================================================

import React from 'react';

interface SummaryCardsProps {
  totalOrders:      number;
  allocatedOrders:  number;
  totalRequested:   number;
  totalAllocated:   number;
  totalValue:       number;
  fulfillmentRate:  number;
}

// Each card has a title, value, sub-label, color accent, and icon
interface CardData {
  title:    string;
  value:    string;
  subLabel: string;
  accent:   string;
  icon:     string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalOrders,
  allocatedOrders,
  totalRequested,
  totalAllocated,
  totalValue,
  fulfillmentRate,
}) => {
  const cards: CardData[] = [
    {
      title:    'Total Sub-Orders',
      value:    totalOrders.toLocaleString(),
      subLabel: `${allocatedOrders.toLocaleString()} allocated`,
      accent:   'border-l-blue-500',
      icon:     '📋',
    },
    {
      title:    'Fulfillment Rate',
      value:    `${fulfillmentRate}%`,
      subLabel: `${totalAllocated.toLocaleString()} / ${totalRequested.toLocaleString()} units`,
      accent:   fulfillmentRate >= 90
        ? 'border-l-emerald-500'
        : fulfillmentRate >= 60
          ? 'border-l-amber-500'
          : 'border-l-red-500',
      icon:     fulfillmentRate >= 90 ? '✅' : fulfillmentRate >= 60 ? '⚡' : '⚠️',
    },
    {
      title:    'Total Allocated',
      value:    `${totalAllocated.toLocaleString()} kg`,
      subLabel: `Requested: ${totalRequested.toLocaleString()} kg`,
      accent:   'border-l-violet-500',
      icon:     '🐟',
    },
    {
      title:    'Total Value',
      value:    `฿${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subLabel: 'Based on allocated qty',
      accent:   'border-l-amber-500',
      icon:     '💰',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(card => (
        <div
          key={card.title}
          className={`
            bg-white rounded-xl shadow-sm border border-slate-100
            border-l-4 ${card.accent}
            p-4 flex flex-col gap-1
          `}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {card.title}
            </span>
            <span className="text-lg">{card.icon}</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {card.value}
          </div>
          <div className="text-xs text-slate-400">
            {card.subLabel}
          </div>
        </div>
      ))}
    </div>
  );
};
