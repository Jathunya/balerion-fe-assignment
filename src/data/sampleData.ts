// =============================================================================
// data/sampleData.ts
// =============================================================================
// PURPOSE: Provides realistic sample data that matches the assignment examples.
// In a real app, this would come from an API. For this assignment, we hardcode
// it here so the app works without a backend.
//
// The data matches the Example_Data image exactly:
//   ORDER-0001 → 2 sub-orders (DAILY, WH-001/SP-001 and WH-002/SP-000)
//   ORDER-0002 → 2 sub-orders (EMERGENCY, WH-001/SP-002 and WH-000/SP-000)
//
// Price Rule: Item-1, SP-001, base=123.49
//   EMERGENCY = 125% → 154.36
//   OVERDUE   = 100% → 123.49
//   DAILY     =  90% → 111.14
// =============================================================================

import type { Customer, Supplier, Warehouse, Inventory, PriceRule, SubOrder } from '../types';

// ─── Customers ───────────────────────────────────────────────────────────────
export const SAMPLE_CUSTOMERS: Customer[] = [
  { id: 'CT-0001', name: 'Aqua Fresh Co.',       creditLimit: 50000,  usedCredit: 0 },
  { id: 'CT-0002', name: 'Nordic Seafood Ltd.',   creditLimit: 80000,  usedCredit: 0 },
  { id: 'CT-0003', name: 'Pacific Blue Trading',  creditLimit: 30000,  usedCredit: 0 },
  { id: 'CT-0004', name: 'Salmon King Corp.',     creditLimit: 120000, usedCredit: 0 },
  { id: 'CT-0005', name: 'Deep Ocean Imports',    creditLimit: 45000,  usedCredit: 0 },
];

// ─── Suppliers ───────────────────────────────────────────────────────────────
// SP-000 is a special "wildcard" — means any supplier can fill the order
export const SAMPLE_SUPPLIERS: Supplier[] = [
  { id: 'SP-000', name: 'Any Supplier (Wildcard)' },
  { id: 'SP-001', name: 'Nordic Salmon Ltd.' },
  { id: 'SP-002', name: 'Atlantic Premium Fish' },
  { id: 'SP-003', name: 'Pacific Harvest Co.' },
];

// ─── Warehouses ──────────────────────────────────────────────────────────────
// WH-000 is a special "wildcard" — means any warehouse can fill the order
export const SAMPLE_WAREHOUSES: Warehouse[] = [
  { id: 'WH-000', name: 'Any Warehouse (Wildcard)' },
  { id: 'WH-001', name: 'Bangkok Central' },
  { id: 'WH-002', name: 'Chiang Mai North' },
  { id: 'WH-003', name: 'Phuket South' },
];

// ─── Inventory ───────────────────────────────────────────────────────────────
// Each record = stock at one (warehouse + supplier + item) combination.
// This is the pool from which we allocate. The engine reduces these numbers.
export const SAMPLE_INVENTORY: Inventory[] = [
  // Bangkok Central (WH-001)
  { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-1', remainingStock: 500 },
  { warehouseId: 'WH-001', supplierId: 'SP-002', itemId: 'Item-1', remainingStock: 300 },
  { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-2', remainingStock: 200 },
  { warehouseId: 'WH-001', supplierId: 'SP-003', itemId: 'Item-2', remainingStock: 150 },

  // Chiang Mai North (WH-002)
  { warehouseId: 'WH-002', supplierId: 'SP-001', itemId: 'Item-1', remainingStock: 400 },
  { warehouseId: 'WH-002', supplierId: 'SP-002', itemId: 'Item-1', remainingStock: 250 },
  { warehouseId: 'WH-002', supplierId: 'SP-003', itemId: 'Item-2', remainingStock: 180 },

  // Phuket South (WH-003)
  { warehouseId: 'WH-003', supplierId: 'SP-002', itemId: 'Item-1', remainingStock: 350 },
  { warehouseId: 'WH-003', supplierId: 'SP-003', itemId: 'Item-1', remainingStock: 200 },
  { warehouseId: 'WH-003', supplierId: 'SP-001', itemId: 'Item-2', remainingStock: 120 },
];

// ─── Price Rules ─────────────────────────────────────────────────────────────
// Matches the Example_Data image exactly:
// Item-1, SP-001: base=123.49, EMERGENCY=125%, OVERDUE=100%, DAILY=90%
export const SAMPLE_PRICE_RULES: PriceRule[] = [
  {
    itemId: 'Item-1',
    supplierId: 'SP-001',
    basePrice: 123.49,
    tiers: [
      { orderType: 'EMERGENCY', percentage: 125 },
      { orderType: 'OVERDUE',   percentage: 100 },
      { orderType: 'DAILY',     percentage: 90  },
    ],
  },
  {
    itemId: 'Item-1',
    supplierId: 'SP-002',
    basePrice: 118.00,
    tiers: [
      { orderType: 'EMERGENCY', percentage: 125 },
      { orderType: 'OVERDUE',   percentage: 100 },
      { orderType: 'DAILY',     percentage: 90  },
    ],
  },
  {
    itemId: 'Item-1',
    supplierId: 'SP-003',
    basePrice: 115.00,
    tiers: [
      { orderType: 'EMERGENCY', percentage: 125 },
      { orderType: 'OVERDUE',   percentage: 100 },
      { orderType: 'DAILY',     percentage: 90  },
    ],
  },
  {
    itemId: 'Item-2',
    supplierId: 'SP-001',
    basePrice: 99.75,
    tiers: [
      { orderType: 'EMERGENCY', percentage: 125 },
      { orderType: 'OVERDUE',   percentage: 100 },
      { orderType: 'DAILY',     percentage: 90  },
    ],
  },
  {
    itemId: 'Item-2',
    supplierId: 'SP-002',
    basePrice: 95.00,
    tiers: [
      { orderType: 'EMERGENCY', percentage: 125 },
      { orderType: 'OVERDUE',   percentage: 100 },
      { orderType: 'DAILY',     percentage: 90  },
    ],
  },
  {
    itemId: 'Item-2',
    supplierId: 'SP-003',
    basePrice: 92.50,
    tiers: [
      { orderType: 'EMERGENCY', percentage: 125 },
      { orderType: 'OVERDUE',   percentage: 100 },
      { orderType: 'DAILY',     percentage: 90  },
    ],
  },
];

// ─── Sample Orders ────────────────────────────────────────────────────────────
// These match the Example_Data image exactly.
// All orders start with allocatedQty = 0, unitPrice = 0, totalPrice = 0.
// The allocation engine fills those values in.
export const SAMPLE_ORDERS: SubOrder[] = [
  // ── ORDER-0001 (DAILY, customer CT-0001) ───────────────────────────────────
  {
    id:           'ORDER-0001-001',
    orderId:      'ORDER-0001',
    itemId:       'Item-1',
    warehouseId:  'WH-001',
    supplierId:   'SP-001',
    requestedQty: 11,
    allocatedQty: 0,
    type:         'DAILY',
    createDate:   '2025-01-01',
    customerId:   'CT-0001',
    remark:       '',
    unitPrice:    0,
    totalPrice:   0,
  },
  {
    id:           'ORDER-0001-002',
    orderId:      'ORDER-0001',
    itemId:       'Item-2',
    warehouseId:  'WH-002',
    supplierId:   'SP-000',
    requestedQty: 20,
    allocatedQty: 0,
    type:         'DAILY',
    createDate:   '2025-01-01',
    customerId:   'CT-0001',
    remark:       '',
    unitPrice:    0,
    totalPrice:   0,
  },

  // ── ORDER-0002 (EMERGENCY, customer CT-0002) ───────────────────────────────
  {
    id:           'ORDER-0002-001',
    orderId:      'ORDER-0002',
    itemId:       'Item-1',
    warehouseId:  'WH-001',
    supplierId:   'SP-002',
    requestedQty: 300,
    allocatedQty: 0,
    type:         'EMERGENCY',
    createDate:   '2025-03-01',
    customerId:   'CT-0002',
    remark:       'Special for VIP',
    unitPrice:    0,
    totalPrice:   0,
  },
  {
    id:           'ORDER-0002-002',
    orderId:      'ORDER-0002',
    itemId:       'Item-2',
    warehouseId:  'WH-000',
    supplierId:   'SP-000',
    requestedQty: 100,
    allocatedQty: 0,
    type:         'EMERGENCY',
    createDate:   '2025-03-01',
    customerId:   'CT-0002',
    remark:       'Special for VIP',
    unitPrice:    0,
    totalPrice:   0,
  },

  // ── Extra realistic orders to demonstrate 5000+ scale ─────────────────────
  {
    id:           'ORDER-0003-001',
    orderId:      'ORDER-0003',
    itemId:       'Item-1',
    warehouseId:  'WH-002',
    supplierId:   'SP-001',
    requestedQty: 50,
    allocatedQty: 0,
    type:         'OVERDUE',
    createDate:   '2025-02-15',
    customerId:   'CT-0003',
    remark:       '',
    unitPrice:    0,
    totalPrice:   0,
  },
  {
    id:           'ORDER-0003-002',
    orderId:      'ORDER-0003',
    itemId:       'Item-2',
    warehouseId:  'WH-000',
    supplierId:   'SP-003',
    requestedQty: 80,
    allocatedQty: 0,
    type:         'OVERDUE',
    createDate:   '2025-02-15',
    customerId:   'CT-0003',
    remark:       '',
    unitPrice:    0,
    totalPrice:   0,
  },
  {
    id:           'ORDER-0004-001',
    orderId:      'ORDER-0004',
    itemId:       'Item-1',
    warehouseId:  'WH-003',
    supplierId:   'SP-002',
    requestedQty: 200,
    allocatedQty: 0,
    type:         'DAILY',
    createDate:   '2025-01-20',
    customerId:   'CT-0004',
    remark:       '',
    unitPrice:    0,
    totalPrice:   0,
  },
  {
    id:           'ORDER-0004-002',
    orderId:      'ORDER-0004',
    itemId:       'Item-2',
    warehouseId:  'WH-001',
    supplierId:   'SP-000',
    requestedQty: 60,
    allocatedQty: 0,
    type:         'DAILY',
    createDate:   '2025-01-20',
    customerId:   'CT-0004',
    remark:       '',
    unitPrice:    0,
    totalPrice:   0,
  },
  {
    id:           'ORDER-0005-001',
    orderId:      'ORDER-0005',
    itemId:       'Item-1',
    warehouseId:  'WH-000',
    supplierId:   'SP-000',
    requestedQty: 75,
    allocatedQty: 0,
    type:         'EMERGENCY',
    createDate:   '2025-02-28',
    customerId:   'CT-0005',
    remark:       'Urgent delivery',
    unitPrice:    0,
    totalPrice:   0,
  },
];

// ─── Generate Large Dataset ───────────────────────────────────────────────────
// This function generates 5000+ orders for performance testing.
// It creates realistic-looking data by cycling through customers, items, etc.
//
// WHY: The assignment requires handling 5,000+ orders. We prove performance
// by actually testing with that volume.
export function generateLargeDataset(count: number = 5000): SubOrder[] {
  const types: Array<'EMERGENCY' | 'OVERDUE' | 'DAILY'> = ['EMERGENCY', 'OVERDUE', 'DAILY'];
  const items   = ['Item-1', 'Item-2'];
  const warehouses = ['WH-000', 'WH-001', 'WH-002', 'WH-003'];
  const suppliers  = ['SP-000', 'SP-001', 'SP-002', 'SP-003'];
  const customers  = ['CT-0001', 'CT-0002', 'CT-0003', 'CT-0004', 'CT-0005'];

  const orders: SubOrder[] = [...SAMPLE_ORDERS]; // Start with real sample data

  for (let i = 6; i <= count; i++) {
    const paddedId   = String(i).padStart(4, '0');
    const typeIndex  = i % 3; // Cycles through 0, 1, 2
    const custIndex  = i % customers.length;
    const itemIndex  = i % items.length;
    const whIndex    = i % warehouses.length;
    const supIndex   = i % suppliers.length;

    // Create a date spread across 2024-2025 for realism
    const dayOffset  = (i * 7) % 365;
    const date       = new Date('2025-01-01');
    date.setDate(date.getDate() - dayOffset);
    const dateStr    = date.toISOString().split('T')[0];

    orders.push({
      id:           `ORDER-${paddedId}-001`,
      orderId:      `ORDER-${paddedId}`,
      itemId:       items[itemIndex],
      warehouseId:  warehouses[whIndex],
      supplierId:   suppliers[supIndex],
      requestedQty: Math.floor(Math.random() * 500) + 10,
      allocatedQty: 0,
      type:         types[typeIndex],
      createDate:   dateStr,
      customerId:   customers[custIndex],
      remark:       '',
      unitPrice:    0,
      totalPrice:   0,
    });
  }

  return orders;
}
