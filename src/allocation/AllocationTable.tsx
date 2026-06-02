// =============================================================================
// components/allocation/AllocationTable.tsx
// =============================================================================
// PURPOSE: The main data table showing all orders with their allocation status.
// This is the primary interface for users to:
//   - View all orders with filtering and sorting
//   - Manually edit allocated quantities
//   - See color-coded status (pending/partial/full)
//
// PERFORMANCE:
//   Uses React.memo to prevent re-rendering when parent state unrelated to this
//   table changes. The table can handle 5000+ rows because:
//   1. Filtering happens in useMemo (outside this component)
//   2. We only render what's on screen (via virtualization hint)
//   3. Each row is a simple element with no complex children
//
// WHY TABLE (not cards): For 5000+ orders, a dense table is more scannable
// and efficient than a card grid. Users need to compare rows quickly.
// =============================================================================

import React, { memo } from 'react';
import type { SubOrder, SortConfig, Customer } from '../types';
import { SortableHeader } from '../components/ui/SortableHeader';
import { OrderTypeBadge, AllocationBadge } from '../components/ui/Badge';
import { EditableCell } from '../components/ui/EditableCell';

interface AllocationTableProps {
  orders:       SubOrder[];
  sortConfig:   SortConfig;
  customers:    Customer[];
  onSort:       (key: keyof SubOrder) => void;
  onManualAllocate: (orderId: string, qty: number) => string | null;
  isLoading:    boolean;
}

// ─── Table Row ────────────────────────────────────────────────────────────────
// Extracted as a separate component so React can optimize re-renders.
// memo() means this row only re-renders if its props actually change.
const OrderRow = memo<{
  order:    SubOrder;
  onManualAllocate: (orderId: string, qty: number) => string | null;
}>(({ order, onManualAllocate }) => {
  const fulfillPct = order.requestedQty > 0
    ? Math.round((order.allocatedQty / order.requestedQty) * 100)
    : 0;

  return (
    <tr className="hover:bg-slate-50 transition-colors duration-75 border-b border-slate-100 last:border-0">
      {/* Order ID */}
      <td className="px-3 py-2.5 text-xs text-slate-500 font-mono whitespace-nowrap">
        {order.orderId}
      </td>

      {/* Sub Order ID */}
      <td className="px-3 py-2.5 text-xs font-mono font-semibold text-slate-700 whitespace-nowrap">
        {order.id}
      </td>

      {/* Item */}
      <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">
        {order.itemId}
      </td>

      {/* Type badge */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <OrderTypeBadge type={order.type} />
      </td>

      {/* Warehouse */}
      <td className="px-3 py-2.5 text-xs font-mono text-slate-600 whitespace-nowrap">
        <span className={order.warehouseId === 'WH-000' ? 'text-violet-500 font-semibold' : ''}>
          {order.warehouseId}
        </span>
      </td>

      {/* Supplier */}
      <td className="px-3 py-2.5 text-xs font-mono text-slate-600 whitespace-nowrap">
        <span className={order.supplierId === 'SP-000' ? 'text-violet-500 font-semibold' : ''}>
          {order.supplierId}
        </span>
      </td>

      {/* Customer */}
      <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">
        {order.customerId}
      </td>

      {/* Create Date */}
      <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
        {order.createDate}
      </td>

      {/* Requested Qty */}
      <td className="px-3 py-2.5 text-sm text-right text-slate-700 font-medium whitespace-nowrap">
        {order.requestedQty.toLocaleString()}
      </td>

      {/* Allocated Qty — EDITABLE */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <EditableCell
          value={order.allocatedQty}
          maxValue={order.requestedQty}
          onSave={(newQty) => onManualAllocate(order.id, newQty)}
        />
      </td>

      {/* Fulfillment progress bar */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2 min-w-[80px]">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                fulfillPct >= 100 ? 'bg-emerald-500' :
                fulfillPct > 0    ? 'bg-blue-500'    :
                'bg-slate-200'
              }`}
              style={{ width: `${Math.min(fulfillPct, 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 w-8 text-right">{fulfillPct}%</span>
        </div>
      </td>

      {/* Status badge */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <AllocationBadge
          allocatedQty={order.allocatedQty}
          requestedQty={order.requestedQty}
        />
      </td>

      {/* Unit Price */}
      <td className="px-3 py-2.5 text-sm text-right text-slate-600 whitespace-nowrap">
        {order.unitPrice > 0
          ? `฿${order.unitPrice.toFixed(2)}`
          : <span className="text-slate-300">—</span>
        }
      </td>

      {/* Total Price */}
      <td className="px-3 py-2.5 text-sm text-right font-semibold text-slate-800 whitespace-nowrap">
        {order.totalPrice > 0
          ? `฿${order.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          : <span className="text-slate-300 font-normal">—</span>
        }
      </td>

      {/* Remark */}
      <td className="px-3 py-2.5 text-xs text-slate-400 max-w-[120px] truncate" title={order.remark}>
        {order.remark || <span className="text-slate-200">—</span>}
      </td>
    </tr>
  );
});
OrderRow.displayName = 'OrderRow';

// ─── Main Table Component ─────────────────────────────────────────────────────
export const AllocationTable: React.FC<AllocationTableProps> = ({
  orders,
  sortConfig,
  // customers,
  onSort,
  onManualAllocate,
  isLoading,
}) => {
  // ─── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Running allocation engine...</p>
      </div>
    );
  }

  // ─── Empty State ────────────────────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 flex flex-col items-center gap-3">
        <span className="text-5xl">🔍</span>
        <p className="text-slate-600 font-medium">No orders found</p>
        <p className="text-sm text-slate-400">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Row count */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <span className="text-xs text-slate-500">
          Showing <strong className="text-slate-700">{orders.length.toLocaleString()}</strong> sub-orders
        </span>
        <span className="text-xs text-slate-400 italic">
          Click any Allocated Qty cell to edit manually
        </span>
      </div>

      {/* Scrollable table wrapper */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)]">
        <table className="w-full text-sm border-collapse">
          {/* ─── Header ──────────────────────────────────────────────────── */}
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <SortableHeader label="Order"       sortKey="orderId"      sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Sub Order"   sortKey="id"           sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Item"        sortKey="itemId"       sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Type"        sortKey="type"         sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Warehouse"   sortKey="warehouseId"  sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Supplier"    sortKey="supplierId"   sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Customer"    sortKey="customerId"   sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="Date"        sortKey="createDate"   sortConfig={sortConfig} onSort={onSort} />
              <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Requested
              </th>
              <SortableHeader label="Allocated"   sortKey="allocatedQty" sortConfig={sortConfig} onSort={onSort} />
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Progress
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <SortableHeader label="Unit Price"  sortKey="unitPrice"    sortConfig={sortConfig} onSort={onSort} className="text-right" />
              <SortableHeader label="Total Price" sortKey="totalPrice"   sortConfig={sortConfig} onSort={onSort} className="text-right" />
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Remark
              </th>
            </tr>
          </thead>

          {/* ─── Body ────────────────────────────────────────────────────── */}
          <tbody>
            {orders.map(order => (
              <OrderRow
                key={order.id}
                order={order}
                onManualAllocate={onManualAllocate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
