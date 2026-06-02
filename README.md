# Salmon Allocation Management System

A React + TypeScript application for allocating limited salmon inventory across customer orders based on business priority rules, inventory availability, customer credit limits, and dynamic pricing.

<img width="1366" height="725" alt="salmon_allocation" src="https://github.com/user-attachments/assets/20cdc299-eaa8-44e2-9514-2c5bb47fcae9" />

---

## Problem Statement

The company receives a large volume of salmon orders from multiple customers.

Available inventory is limited and distributed across multiple warehouses and suppliers.

The system must allocate inventory fairly and efficiently while enforcing business rules such as:

- Order priority
- FIFO processing
- Credit limits
- Dynamic pricing
- Warehouse/Supplier wildcard handling
- Banker's rounding

The application supports both manual allocation and automated allocation.

---

## Features

### Auto Allocation Engine

Automatically allocates inventory using the following priority:

1. EMERGENCY
2. OVERDUE
3. DAILY

Within the same priority group:

- Older orders are processed first (FIFO)

Additional rules:

- Customer credit limits are enforced
- Inventory availability is validated
- Wildcard warehouse (`WH-000`) is resolved automatically
- Wildcard supplier (`SP-000`) is resolved automatically
- Quantities use Banker's Rounding
- Pricing is calculated dynamically per supplier and order type

---

### Manual Allocation

Users can manually edit allocated quantities directly from the allocation table.

Validation includes:

- Cannot exceed available inventory
- Cannot exceed customer credit limit
- Pricing recalculates automatically

---

### Search & Filtering

Users can quickly locate orders using:

- Global search
- Order type filtering
- Customer filtering

Designed for large datasets (5,000+ orders).

---

### Performance Testing Mode

The application includes a built-in dataset generator that loads more than 5,000 orders for performance validation.

Users can switch between:

- Sample dataset
- Large dataset (5,000+ orders)

---

### Export CSV

Current allocation results can be exported for downstream processing.

---

## Allocation Algorithm

### Priority Sorting

Orders are processed using:

```text
EMERGENCY
    ↓
OVERDUE
    ↓
DAILY
```

Orders with the same priority are sorted by creation date (FIFO).

---

### Inventory Selection Strategy

For each order:

1. Find matching inventory records
2. Resolve wildcard warehouse/supplier if applicable
3. Sort inventory by remaining stock (highest first)
4. Allocate greedily until demand or stock is exhausted

---

### Credit Enforcement

Before allocating:

```text
Remaining Credit
=
Credit Limit
-
Used Credit
```

Allocation is capped by the customer's available credit.

---

### Pricing

Unit price is calculated using:

```text
Base Price × Price Tier %
```

Example:

| Order Type | Multiplier |
|------------|------------|
| EMERGENCY | 125% |
| OVERDUE | 100% |
| DAILY | 90% |

---

### Banker's Rounding

Financial calculations use Banker's Rounding to eliminate systematic upward rounding bias.

Examples:

```text
2.5 → 2
3.5 → 4
```

---

## Technical Stack

### Frontend

- React 19
- TypeScript
- Vite

### UI

- Tailwind CSS 4
- ShadCN UI
- Radix UI

### Utilities

- CSV Export
- Custom Allocation Engine

---

## Architecture

```text
src/
│
├── components/
│   ├── allocation/
│   └── layout/
│
├── hooks/
│   └── useAllocation.ts
│
├── utils/
│   └── allocation.ts
│
├── data/
│
├── types/
│
└── App.tsx
```

### Design Decisions

#### Business Logic Isolation

Allocation logic is separated from UI components.

```text
UI Components
    ↓
useAllocation Hook
    ↓
Allocation Engine
```

Benefits:

- Easier testing
- Better maintainability
- Clear separation of concerns

---

#### Centralized State Management

A custom `useAllocation` hook acts as the single source of truth for:

- Orders
- Inventory
- Customers
- Filters
- Sorting
- Allocation actions

---

#### Performance Optimizations

To support 5,000+ orders:

- `useMemo`
  - Prevents unnecessary filtering/sorting recalculations
- `useCallback`
  - Prevents unnecessary function recreation
- Derived state is memoized
- Allocation engine operates on copied inventory state

---

## Getting Started

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Application will be available at:

```text
http://localhost:5173
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## Assumptions

- Inventory can be partially allocated.
- Orders can be partially fulfilled.
- `WH-000` means any warehouse.
- `SP-000` means any supplier.
- Credit checks occur during allocation.
- FIFO is applied within the same priority level.

---

## Future Improvements

- Virtualized table rendering (react-window)
- Unit tests (Vitest)
- Integration tests
- Web Worker allocation processing
- Allocation audit history
- Multi-user collaboration
- Real backend integration

---

## Evaluation Goals

This project focuses on:

- Correct business rule implementation
- Algorithm design
- Performance with large datasets
- User experience
- Maintainable architecture
