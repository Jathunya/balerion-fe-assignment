export default function App() {
  const {
    orders,
    prices,
    tab,
    filters,
    allResults,
    filteredResults,
    summary,
    setTab,
    updateOrder,
    addOrder,
    deleteOrder,
    updatePrice,
    addPrice,
    deletePrice,
    setSearch,
    setStatusFilter,
    toggleSort,
  } = useAllocation();

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4fb", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <Navbar tab={tab} onTabChange={setTab} />

      <main style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
        {tab === "allocation" && (
          <AllocationView
            summary={summary}
            allResults={allResults}
            filteredResults={filteredResults}
            filters={filters}
            onSearch={setSearch}
            onStatusFilter={setStatusFilter}
            onSort={toggleSort}
          />
        )}

        {tab === "orders" && (
          <OrdersTable
            orders={orders}
            onUpdate={updateOrder}
            onDelete={deleteOrder}
            onAdd={addOrder}
          />
        )}

        {tab === "prices" && (
          <PricesTable
            prices={prices}
            onUpdate={updatePrice}
            onDelete={deletePrice}
            onAdd={addPrice}
          />
        )}
      </main>
    </div>
  );
}
