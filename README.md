# 🐟 Salmon Allocation Management System

## Complete Setup, Code Explanation & Interview Guide

---

## PART 1: QUICK START

### Step 1: Create the Project

```bash
# Create the Vite + React + TypeScript project
npm create vite@latest salmon-allocation -- --template react-ts
cd salmon-allocation
```

### Step 2: Install Dependencies

```bash
# Core dependencies (already in package.json)
npm install

# Install Tailwind CSS and its peer dependencies
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind config files
npx tailwindcss init -p
```

### Step 3: Copy All Source Files

Copy every file from this project into the correct locations as shown in the project structure below.

### Step 4: Run the Development Server

```bash
npm run dev
# → Opens at http://localhost:5173
```

### Step 5: Build for Production

```bash
npm run build
# → Creates /dist folder ready for deployment
```

### Deploy to Vercel (Bonus)

```bash
npm install -g vercel
vercel
# Follow the prompts. Your app will be live in ~60 seconds.
```

---

## PART 2: PROJECT STRUCTURE

```
salmon-allocation/
├── index.html                  ← HTML entry point (Vite reads this first)
├── vite.config.ts              ← Vite bundler configuration
├── tsconfig.json               ← TypeScript rules
├── tailwind.config.js          ← Tailwind CSS configuration
├── postcss.config.js           ← PostCSS (required by Tailwind)
├── package.json                ← Dependencies and scripts
└── src/
    ├── main.tsx                ← React app entry point
    ├── App.tsx                 ← Root component (connects hook to UI)
    ├── index.css               ← Tailwind directives
    ├── types/
    │   └── index.ts            ← ALL TypeScript interfaces and types
    ├── data/
    │   └── sampleData.ts       ← Sample + generated test data
    ├── utils/
    │   └── allocation.ts       ← Business logic (allocation engine, CSV export)
    ├── hooks/
    │   └── useAllocation.ts    ← State management (custom React hook)
    └── components/
        ├── ui/
        │   ├── Badge.tsx           ← Color-coded type/status badges
        │   ├── EditableCell.tsx    ← Click-to-edit table cell
        │   └── SortableHeader.tsx  ← Sortable table column header
        ├── layout/
        │   ├── Navbar.tsx          ← Top nav with action buttons
        │   └── AllocationView.tsx  ← Main content area
        └── allocation/
            ├── SummaryCards.tsx    ← Metric cards at top of page
            └── AllocationTable.tsx ← Main data table
```

---

## PART 3: FILE-BY-FILE EXPLANATION

---

### `types/index.ts`

**What it does:**
Defines the "shape" of every data object in the application using TypeScript interfaces.

**Why it exists:**
TypeScript catches bugs at compile time (before the code runs). Without types, you might pass `"hello"` where a number was expected, and only find out at runtime. With types, your editor tells you immediately.

**Key types:**
- `SubOrder` — one line item in an order (the main entity we work with)
- `Customer` — has a `creditLimit` that we must not exceed
- `Inventory` — stock at a specific warehouse + supplier + item combination
- `PriceRule` — base price + tier adjustments per order type
- `ORDER_PRIORITY` — maps EMERGENCY=0, OVERDUE=1, DAILY=2 for sorting

**Interview Explanation:**
> "I put all TypeScript interfaces in one file. This gives you a single place to look when you want to understand the data structure. TypeScript interfaces act like contracts — they guarantee that every SubOrder object has the same fields. This prevents whole classes of bugs."

---

### `data/sampleData.ts`

**What it does:**
Provides realistic hardcoded data that matches the assignment's Example_Data image. Also exports `generateLargeDataset()` for 5000+ order performance testing.

**Why it exists:**
Without a backend API, we need data to work with. In a real app, this would be replaced by `fetch()` calls to an API endpoint.

**Key data:**
- 5 customers with credit limits (CT-0001 to CT-0005)
- 4 suppliers including SP-000 (wildcard)
- 4 warehouses including WH-000 (wildcard)
- 10 inventory records across warehouse/supplier/item combinations
- 6 price rules with EMERGENCY/OVERDUE/DAILY tiers
- 9 sample orders matching the assignment exactly

**`generateLargeDataset(count)` algorithm:**
- Uses modulo (`%`) to cycle through types, customers, items etc.
- Spreads dates across the past year for realism
- Time Complexity: O(n) — one loop, one push per order
- Space Complexity: O(n) — stores all orders in memory

**Interview Explanation:**
> "I separated sample data from business logic. If we connect to a real API later, I only need to change this file — everything else stays the same. I also built a data generator to prove the app handles 5,000+ orders. This demonstrates I thought about the performance requirement, not just the happy path."

---

### `utils/allocation.ts`

**What it does:**
Contains all business logic. This is the most important file in the project.

**Why it exists:**
Business logic must be separated from UI code. If you mix them, changing a business rule means touching components, which can introduce UI bugs. Pure utility functions are also easy to unit test.

**Functions explained:**

#### `bankersRound(value, decimalPlaces)`
- **Purpose:** Round using Banker's Rounding (round half to even)
- **Why not `Math.round()`?** Math.round always rounds 0.5 up. Over millions of financial transactions, this creates a statistical upward bias. Banker's rounding is unbiased.
- **Algorithm:** Multiply to remove decimals → check if exactly 0.5 → round to nearest even → divide back
- **Time:** O(1) — pure math

#### `getUnitPrice(itemId, supplierId, orderType, rules)`
- **Purpose:** Look up the correct price for an order
- **Algorithm:** Find matching price rule → find matching tier → apply percentage
- **Example:** Item-1 + SP-001 + EMERGENCY = 123.49 × 125% = 154.36
- **Time:** O(P) where P = price rules (small constant)

#### `sortByPriority(orders)`
- **Purpose:** Sort EMERGENCY first, then OVERDUE, then DAILY. Within same type, older dates first (FIFO).
- **Algorithm:** JavaScript's `.sort()` with a comparator function
- **Uses `[...orders]` to avoid mutating the original array**
- **Time:** O(n log n) — TimSort

#### `runAutoAllocation(orders, inventory, customers, priceRules)`
- **Purpose:** The main allocation engine
- **Algorithm (step by step):**
  1. Deep-copy inventory (prevents mutating original state)
  2. Build customer credit Map (O(1) lookups)
  3. Sort orders by priority
  4. For each order: find matching inventory → check credit → fill from highest-stock slot → apply Banker's Rounding
  5. Return results array
- **Time:** O(n log n) for sort + O(n × I) for allocation (I = inventory records, small constant)
- **Space:** O(n + I) for copies

#### `filterOrders(orders, search, typeFilter, customerFilter)`
- **Purpose:** Apply search text and dropdown filters
- **Searches across:** orderId, subOrderId, customerId, itemId, type, warehouseId, supplierId, remark
- **Time:** O(n) — single pass

#### `sortOrders(orders, key, direction)`
- **Purpose:** Sort by any column, ascending or descending
- **Handles:** strings (localeCompare), numbers (subtraction), dates (Date.getTime())
- **Time:** O(n log n)

#### `exportToCSV(orders, filename)`
- **Purpose:** Download current data as a CSV file
- **Algorithm:** Build header string → map orders to rows → join with newlines → create Blob → click invisible `<a>` tag → cleanup
- **UTF-8 BOM (\uFEFF):** Makes Excel open the file with correct Thai/special character encoding

**Interview Explanation:**
> "I put all business logic in utils/allocation.ts as pure functions — functions with no side effects that always return the same output for the same input. This makes them easy to test and reuse. The allocation engine follows the exact priority rules from the assignment: EMERGENCY first, then FIFO within same priority, with credit limit enforcement and Banker's Rounding."

---

### `hooks/useAllocation.ts`

**What it does:**
A custom React hook that manages ALL application state and provides action functions.

**Why it exists:**
Rather than putting state in every component (which gets messy fast), we centralize it here. Every component that calls `useAllocation()` gets the same data. This is the "single source of truth" pattern.

**Key React concepts used:**

#### `useState`
Stores mutable data. When you call `setOrders(newOrders)`, React re-renders all components that use `orders`.

#### `useMemo`
```typescript
const displayOrders = useMemo(() => {
  return sortOrders(filterOrders(orders, ...), ...)
}, [orders, filters, sortConfig]);
```
This recalculates `displayOrders` ONLY when `orders`, `filters`, or `sortConfig` changes. Without `useMemo`, this would run on every single render — catastrophic for 5000+ orders.

#### `useCallback`
```typescript
const handleSort = useCallback((key) => { ... }, []);
```
This prevents `handleSort` from being recreated as a new function on every render. Without this, every render creates a new function reference, which causes child components using `React.memo` to unnecessarily re-render.

**Performance chain:**
`useMemo` (avoids re-filtering) + `useCallback` (stable function refs) + `React.memo` on rows (skip unchanged rows) = renders only what changed.

**Interview Explanation:**
> "I created a custom hook to centralize state management. Every action — auto-allocate, manual edit, sort, filter, export — lives here. Components just call the hook and get data and functions back. This separation means if I need to change how allocation works, I only touch the hook, not every component that displays data."

---

### `components/ui/EditableCell.tsx`

**What it does:**
A table cell that switches between display and edit mode on click.

**States:**
- `isEditing: false` → shows value as text with a ✏ hover hint
- `isEditing: true` → shows `<input>` field with Enter/Escape handlers

**Keyboard UX:**
- `Enter` → save
- `Escape` → cancel
- `blur` (click away) → save

**Validation flow:**
1. Parse input as float
2. Check if NaN
3. Pass to `onSave` callback (which does full business rule validation)
4. If error returned, show it in red below the input

**Interview Explanation:**
> "This is a controlled input pattern. React controls the value via state — the input is never 'raw HTML'. I validate on both blur and Enter key for maximum usability. The parent component provides the validation function via props, so this UI component doesn't know about business rules. That separation is intentional."

---

### `components/allocation/AllocationTable.tsx`

**What it does:**
The main data table displaying all orders.

**Performance techniques:**
1. **`React.memo` on `OrderRow`** — the row only re-renders if that specific order's data changes. With 5000 rows, this is crucial.
2. **`max-h-[calc(100vh-380px)]`** — limits table height, enabling browser scrolling which is more performant than rendering 5000 DOM nodes.
3. **`overflow-y-auto`** — only the viewport area is rendered actively by the browser.

**Sticky header:**
`sticky top-0 z-10` keeps the header visible while scrolling through thousands of rows.

**Interview Explanation:**
> "I used React.memo on the row component. In a 5000-row table, if one order changes, we don't want all 5000 rows to re-render — only the changed one. React.memo does this by doing a shallow comparison of props before deciding to re-render."

---

## PART 4: KEY ALGORITHMS IN DEPTH

---

### Algorithm 1: Auto-Allocation Engine

**Problem:** Given thousands of orders and limited inventory, distribute stock fairly.

**Approach: Priority Queue (simulated) + Greedy**

```
Step 1: Sort orders by priority
   [EMERGENCY orders by date] → [OVERDUE orders by date] → [DAILY orders by date]

Step 2: For each order in sorted order:
   a. Find all inventory that can fill this order
   b. Sort inventory by remaining stock (most first — greedy)
   c. Check customer credit
   d. Fill from inventory until satisfied or stock/credit runs out
   e. Banker's Round the result

Step 3: Return allocation results
```

**Why greedy?** Taking from the biggest inventory slot first minimizes the number of slots we need to split across, reducing fragmentation. This is the same approach used in real warehouse management systems.

**Time Complexity:** O(n log n + n×I)
- n log n for sorting
- n×I for the allocation loop (n orders × I inventory records each)
- Since I is small (bounded by warehouse count), this is effectively O(n log n)

**Space Complexity:** O(n + I)
- O(n) for the sorted copy
- O(I) for the working inventory copy

---

### Algorithm 2: Banker's Rounding

**Problem:** Standard rounding creates upward bias in financial calculations.

**Normal rounding:**
- 0.5 → 1 (rounds up)
- 1.5 → 2 (rounds up)
- 2.5 → 3 (rounds up)
- Bias: always goes up!

**Banker's rounding:**
- 0.5 → 0 (nearest even = 0)
- 1.5 → 2 (nearest even = 2)
- 2.5 → 2 (nearest even = 2)
- 3.5 → 4 (nearest even = 4)
- Unbiased: goes up half the time, down half the time

**Implementation:**
```typescript
const fraction = shifted - Math.floor(shifted);
if (fraction === 0.5) {
  // Round to nearest even
  rounded = floor % 2 === 0 ? floor : floor + 1;
} else {
  rounded = Math.round(shifted);
}
```

---

### Algorithm 3: FIFO within Priority

**Problem:** When two EMERGENCY orders compete for the same stock, which one wins?

**Answer:** The OLDER one (First In, First Out — FIFO).

**Implementation:**
```typescript
.sort((a, b) => {
  // Priority first
  const priorityDiff = ORDER_PRIORITY[a.type] - ORDER_PRIORITY[b.type];
  if (priorityDiff !== 0) return priorityDiff;
  
  // FIFO: older date = smaller number = comes first
  return new Date(a.createDate).getTime() - new Date(b.createDate).getTime();
})
```

**Why FIFO?** It's the fairest ordering rule. Customers who waited longer shouldn't be penalized by late-arriving high-priority orders from other customers.

---

### Algorithm 4: Wildcard Resolution (WH-000 / SP-000)

**Problem:** Some orders can be filled by ANY warehouse or supplier.

**Logic:**
```typescript
const isAnyWarehouse = order.warehouseId === 'WH-000';
const isAnySupplier  = order.supplierId  === 'SP-000';

inventory.filter(inv => {
  if (inv.itemId !== order.itemId) return false;
  if (!isAnyWarehouse && inv.warehouseId !== order.warehouseId) return false;
  if (!isAnySupplier  && inv.supplierId  !== order.supplierId)  return false;
  return true;
}).sort((a, b) => b.remainingStock - a.remainingStock); // Most stock first
```

**Why prefer most stock?** This greedy approach maximizes the chance that subsequent orders can also be fulfilled. Taking from the most abundant source leaves more balanced stock across all locations.

---

## PART 5: "HOW TO EXPLAIN THIS PROJECT DURING AN INTERVIEW"

---

### Project Overview (30-second pitch)

> "I built a Salmon Allocation Management System. It's a React TypeScript application that solves a real distribution problem: given thousands of customer orders and limited warehouse stock, allocate salmon fairly based on business rules — priority, credit limits, FIFO ordering, and pricing tiers."

---

### Architecture Explanation

> "The project has four layers:
> 1. **Types** — define the data shapes. Everything flows through these contracts.
> 2. **Utils** — pure business logic functions. No React, no side effects. Easy to test.
> 3. **Hook** — centralized state management using React hooks. One place for all state.
> 4. **Components** — visual layer only. They receive data and call actions from the hook.
>
> I separated business logic from UI so that changing a business rule doesn't risk breaking the UI, and vice versa."

---

### Allocation Algorithm Explanation

> "The algorithm has three main steps:
> 1. **Sort** orders by priority: EMERGENCY first, then OVERDUE, then DAILY. Within the same priority, older orders go first — that's FIFO.
> 2. **Allocate** greedily: for each order, find the inventory slot with the most remaining stock that matches the warehouse and supplier requirements. Fill from there until the request is satisfied or we run out.
> 3. **Validate** credit limits: before filling, check if the customer has enough credit. If not, reduce the allocation to what they can afford.
>
> I used Banker's Rounding for all price calculations, which is the standard in financial systems — it avoids statistical bias unlike regular rounding."

---

### Performance Explanation

> "I applied three performance optimizations:
> 1. **useMemo** — the filtered and sorted order list is recalculated only when filters or orders change. Not on every render.
> 2. **useCallback** — action functions have stable references so they don't cause unnecessary child re-renders.
> 3. **React.memo on table rows** — with 5000 rows, only rows whose data changed will re-render, not all 5000.
>
> I also built a dataset generator to actually test with 5000+ orders, not just claim it works."

---

### State Management Explanation

> "I chose a custom hook instead of Redux or Context because the app's state is simple enough — one main list of orders, some filter state, some sort state. A custom hook gives us the same benefits (single source of truth, centralized mutations) without the complexity overhead of a state management library. If the app grew to need cross-tree state sharing, I'd add Context."

---

### TypeScript Explanation

> "I used TypeScript to define every data shape as an interface. The biggest benefit was catching mistakes at compile time — for example, TypeScript would immediately flag if I tried to pass a string where allocatedQty expected a number. I also used `keyof SubOrder` to type the sort key, which means if I rename a field, TypeScript will tell me everywhere that breaks."

---

### Component Structure Explanation

> "I organized components into three folders: `ui` for reusable atoms like badges and editable cells, `layout` for page-level containers, and `allocation` for domain-specific components. This mirrors Atomic Design principles — atoms → organisms → templates."

---

## PART 6: INTERVIEW QUESTIONS YOU MIGHT BE ASKED

---

### Q1: "Walk me through the auto-allocation algorithm."

**Answer:**
> "It's a greedy priority-based algorithm. First I sort all orders by type — EMERGENCY, OVERDUE, DAILY — and within each type by creation date so older orders go first (FIFO). Then I process each order in that sorted order. For each order, I find all inventory records that match the required item, warehouse, and supplier — if the order says WH-000 or SP-000, it's a wildcard so any match works. I sort those inventory slots by remaining stock descending and fill from the largest slot first. Before filling, I check the customer's credit limit and reduce the allocation if needed. Finally, I apply Banker's Rounding to the result."

**Follow-up: "Why greedy?"**
> "Because we're not looking for the globally optimal allocation across all orders — that would be an NP-hard bin packing problem. The greedy approach with priority sorting gives us a deterministic, fast solution that satisfies the business rules. Priority orders always get stock before lower-priority ones, which is the core business requirement."

---

### Q2: "How do you handle 5000+ orders efficiently?"

**Answer:**
> "Three main things. First, useMemo — the expensive filter+sort operation runs only when the data or filters actually change, not on every render. Second, React.memo on table rows — in a 5000-row table, only changed rows re-render. Third, the allocation algorithm itself is O(n log n) — the bottleneck is just the sort step, which JavaScript's TimSort handles very efficiently. I also tested it with a generated 5000-order dataset to confirm it stays responsive."

---

### Q3: "What is Banker's Rounding and why did you use it?"

**Answer:**
> "Banker's Rounding, also called Round Half to Even, rounds 0.5 to the nearest even number rather than always rounding up. So 2.5 rounds to 2, and 3.5 rounds to 4. The reason it matters in financial systems is that regular rounding creates a statistical upward bias — if you always round 0.5 up, over millions of transactions you're consistently calculating slightly too high. Banker's Rounding is unbiased because it rounds up half the time and down half the time, so errors cancel out. The assignment specifically required it, which told me they care about financial accuracy."

---

### Q4: "Why did you use a custom hook instead of Redux?"

**Answer:**
> "The app has one main entity (orders) with simple state mutations (allocate, reset, filter, sort). Redux would add boilerplate — actions, reducers, store setup, connect — for minimal benefit at this scale. A custom hook gives us the same single-source-of-truth benefit with less code to understand and maintain. I'd reconsider if the app needed shared state across many disconnected components, or if we needed time-travel debugging or complex middleware."

---

### Q5: "How would you scale this to 100,000+ orders?"

**Answer:**
> "A few approaches. First, virtualization — only render the rows actually visible in the viewport using a library like react-window or TanStack Virtual. Right now we render all DOM nodes, which would become slow. Second, move filtering and sorting to the server — send search terms as query parameters and let the database handle it with indexed queries. Third, paginate the results instead of loading everything at once. Fourth, if auto-allocation needs to handle 100k orders, move it to a background job on the server and poll for results."

---

### Q6: "How does the credit limit validation work?"

**Answer:**
> "Before allocating stock to an order, I calculate how much the customer has already spent across all their other orders. Then I calculate what the current order would cost at the applicable unit price. If the sum exceeds their credit limit, I reduce the allocation to the maximum they can afford. The formula is: `maxQty = Math.floor(remainingCredit / unitPrice)`. I apply this before filling from inventory so we never over-commit credit."

---

### Q7: "What is the purpose of WH-000 and SP-000?"

**Answer:**
> "They're wildcards. WH-000 means the order can be filled from any warehouse, and SP-000 means any supplier can fill it. In the allocation engine, I check `if warehouseId === 'WH-000'` and skip the warehouse filter, allowing any warehouse to match. I prefer the slot with the most remaining stock. This flexibility lets the business accommodate orders when a specific warehouse is out of stock."

---

### Q8: "How would you add unit tests to this project?"

**Answer:**
> "The utility functions in allocation.ts are pure functions — same input always gives same output, no side effects. They're ideal for unit testing with Vitest or Jest. I'd write tests for bankersRound (especially the exact 0.5 cases), sortByPriority (verify EMERGENCY before OVERDUE before DAILY, verify FIFO), runAutoAllocation (verify credit limits, verify wildcard resolution, verify priority order). The hook would be tested with React Testing Library's renderHook. I separated business logic from UI specifically to make this easier."

---

### Q9: "Future improvements you'd make?"

**Answer:**
> "Several things. First, virtual scrolling for true 100k+ row support. Second, server-side allocation with a job queue for large datasets. Third, an undo/redo history for manual allocations (using a stack of previous states). Fourth, real-time updates with WebSocket so multiple users can see each other's allocations. Fifth, a customer dashboard showing their credit usage across all orders. Sixth, Excel export in addition to CSV, since the business likely uses Excel."

---

### Q10: "Explain React.memo vs useMemo vs useCallback."

**Answer:**
> "They all relate to preventing unnecessary work, but at different levels.
> - `React.memo` wraps a component and skips re-rendering if the props haven't changed. I use it on OrderRow so that when one order changes, only that one row re-renders, not all 5000.
> - `useMemo` memoizes an expensive computed value. I use it for the filtered+sorted order list — recalculating this for 5000 orders on every render would be very slow.
> - `useCallback` memoizes a function itself — gives it a stable reference. This is important when you pass functions as props to memoized children, because a new function object each render would make React.memo think the props changed."

---

## PART 7: TRADE-OFFS AND DECISIONS

| Decision | Why | Alternative |
|----------|-----|-------------|
| Custom hook vs Redux | Simpler, less boilerplate, sufficient for this scope | Redux Toolkit if app grows |
| Client-side allocation | Works without backend, demonstrates algorithm | Server-side for 100k+ orders |
| useMemo filtering | Avoids re-computation, easy to understand | Debounced search with worker thread |
| React.memo on rows | Prevents 5000-row re-renders on single change | Virtual scrolling (better at 100k+) |
| Pure functions in utils | Testable, separation of concerns | Methods on classes (over-engineered) |
| Greedy allocation | Fast, deterministic, meets requirements | Linear programming (complex, overkill) |
| Banker's Rounding | Financial accuracy, required by spec | Math.round (biased, wrong) |
| In-memory state | Simple, no backend needed | Database (required for persistence) |

---

*Built with React 18 + TypeScript + Vite + Tailwind CSS*
*Interview 12.1 — Allocation Problem*
