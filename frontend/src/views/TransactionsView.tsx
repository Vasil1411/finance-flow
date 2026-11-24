import React, { useState, useMemo } from 'react';
import { Button } from '../components/UI';
import { Icon } from '../components/Icon';
import { TransactionRows } from '../components/TransactionRows';
import { TransactionFilters } from '../components/TransactionFilters';
import { formatMonthLabel } from '../components/MonthPicker';
import type { Transaction } from '../types/transaction';
import { useGetTransactionsQuery, useDeleteTransactionMutation } from '../services/transactionsApi';
import { useGetCategoriesQuery } from '../services/categoriesApi';

interface TransactionsViewProps {
  openModal: (t?: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ openModal }) => {
  const { data: rows = [], isLoading: loadingTx, error: errorTx } = useGetTransactionsQuery();
  const { data: categories = [], isLoading: loadingCat } = useGetCategoriesQuery();
  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [type, setType] = useState("All types");
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);

  const formattedMonthLabel = formatMonthLabel(currentDate);

  const monthTransactions = useMemo(
    () => rows.filter((t: any) => t.date && t.date.startsWith(currentDate)),
    [rows, currentDate],
  );

  const totalIncome = monthTransactions
    .filter((t) => t.type?.toUpperCase() === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type?.toUpperCase() === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const hasFilters = query !== "" || category !== "All categories" || type !== "All types";

  const filtered = useMemo(
    () =>
      monthTransactions.filter((t) => {
        const matchesQuery = (t.description || "").toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "All categories" || t.category_name === category;
        const matchesType = type === "All types" || t.type?.toUpperCase() === type.toUpperCase();
        return matchesQuery && matchesCategory && matchesType;
      }),
    [monthTransactions, query, category, type],
  );

  const confirmDelete = async () => {
    if (deleteModalId === null) return;
    try {
      await deleteTransaction(deleteModalId).unwrap();
      setDeleteModalId(null);
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    }
  };

  if (loadingTx || loadingCat) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading transactions...</div>;
  if (errorTx) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Error loading transactions.</div>;

  return (
    <>
      <div className="section-actions">
        <div className="summary-pills">
          <div>
            <span>Income</span>
            <strong className="income">+€{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
          <div>
            <span>Expenses</span>
            <strong className="expense">-€{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
        </div>
        <Button icon="plus" onClick={() => openModal()}>
          Add transaction
        </Button>
      </div>

      <section className="card transactions-card">
        <TransactionFilters
          query={query}
          onQueryChange={setQuery}
          category={category}
          onCategoryChange={setCategory}
          type={type}
          onTypeChange={setType}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          categories={categories}
        />

        <div className="table-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>
            <strong>{filtered.length} transactions</strong> found for {formattedMonthLabel}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("All categories");
                setType("All types");
              }}
              style={{ background: 'none', border: 'none', color: '#516CE5', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length ? (
          <TransactionRows rows={filtered} onEdit={openModal} onDelete={(id) => setDeleteModalId(id)} />
        ) : (
          <div className="empty-state">
            <span>
              <Icon name="search" />
            </span>
            <h3>No transactions found</h3>
            <p>Try changing or clearing your filters for {formattedMonthLabel}.</p>
          </div>
        )}

        {filtered.length > 10 && (
          <div className="pagination">
            <span>
              Showing {filtered.length} of {monthTransactions.length} transactions
            </span>
            <div>
              <button disabled type="button">Previous</button>
              <button className="active" type="button">1</button>
              <button type="button">2</button>
              <button type="button">Next</button>
            </div>
          </div>
        )}
      </section>

      {deleteModalId !== null && (
        <div className="modal-backdrop" onMouseDown={() => setDeleteModalId(null)}>
          <div className="modal" style={{ maxWidth: '400px', padding: '24px' }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head" style={{ marginBottom: '16px' }}>
              <div>
                <span className="eyebrow" style={{ color: '#E06A4E' }}>DELETE RECORD</span>
                <h2>Delete transaction</h2>
                <p style={{ marginTop: '4px', color: '#667085' }}>Are you sure you want to delete this transaction? This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setDeleteModalId(null)} type="button">
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{ background: '#E06A4E', color: '#fff' }}
                type="button"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};