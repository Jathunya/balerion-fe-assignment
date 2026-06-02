# 🐟 Salmon Allocation Management System

A React + TypeScript application for allocating salmon inventory across customer orders while enforcing allocation rules, inventory constraints, customer credit limits, and dynamic pricing.

<img width="1366" height="725" alt="salmon_allocation" src="https://github.com/user-attachments/assets/20cdc299-eaa8-44e2-9514-2c5bb47fcae9" />

## Live Demo
https://balerion-fe-assignment.vercel.app/

---

## Overview

This project was developed as a frontend assignment.

The application manages salmon inventory allocation for customer orders and supports both manual and automatic allocation workflows.

The allocation process follows business rules regarding:

* Order priority
* Inventory availability
* Customer credit limits
* Dynamic pricing
* Warehouse and supplier matching
* Banker's rounding

---

## Features

### Auto Allocation

Automatically allocates inventory based on order priority:

1. EMERGENCY
2. OVERDUE
3. DAILY

Orders within the same priority level are processed using FIFO ordering.

The allocation process also validates:

* Available inventory
* Customer credit limits
* Warehouse matching
* Supplier matching

---

### Manual Allocation

Users can manually update allocation quantities directly from the table.

Validation prevents:

* Allocating more than available inventory
* Exceeding customer credit limits

---

### Search and Filter

Users can search and filter orders to quickly locate specific records.

Available filters include:

* Customer
* Order Type
* Search keywords

---

### Performance Test Mode

The application includes support for testing with datasets containing more than 5,000 orders.

---

### CSV Export

Allocation results can be exported as CSV files.

---

## Allocation Rules

### Priority Order

```text
EMERGENCY
    ↓
OVERDUE
    ↓
DAILY
```

Orders with the same priority are processed by creation date (FIFO).

### Inventory Selection

For each order:

1. Find matching inventory
2. Resolve wildcard warehouse or supplier when applicable
3. Sort inventory by remaining stock
4. Allocate inventory until stock or demand is exhausted

### Credit Validation

Allocation is limited by the customer's available credit.

```text
Available Credit
=
Credit Limit
-
Used Credit
```

### Pricing

Pricing is calculated based on supplier and order type.

### Banker's Rounding

Financial calculations use Banker's Rounding to reduce rounding bias.

Examples:

```text
2.5 → 2
3.5 → 4
```

---

## Technical Stack

### Frontend

* React
* TypeScript
* Vite

### UI

* Tailwind CSS
* Radix UI
* Lucide React

---

## Project Structure

```text
src/
├── allocation/
├── hooks/
├── layout/
├── utils/
├── data/
├── types/
└── App.tsx
```

### Main Modules

#### allocation/

UI components related to allocation management.

#### hooks/useAllocation.ts

Manages allocation state and allocation actions.

#### utils/allocation.ts

Contains allocation calculation and validation logic.

---

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
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

* Orders can be partially allocated.
* Inventory can be partially consumed.
* `WH-000` can match any warehouse.
* `SP-000` can match any supplier.
* Credit validation is applied during allocation.
* FIFO ordering is applied within the same priority level.

---

## Future Improvements

* Unit tests
* Integration tests
* Allocation history tracking

---

