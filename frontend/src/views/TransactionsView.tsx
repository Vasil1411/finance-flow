import React, { useState, useMemo } from 'react';
import { Button } from '../components/UI';
import { Icon } from '../components/Icon';
import { TransactionRows } from '../components/TransactionRows';
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
  
  // Състояние за текущо избрания месец във формат "YYYY-MM" (по подразбиране текущия месец)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  
  // Състояние за нашия собствен красив модал за изтриване
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);

  // Функции за смяна на месеца със стрелките
  const handlePrevMonth = () => {
    const [year, month] = currentDate.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setCurrentDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentDate.split('-').map(Number);
    const date = new Date(year, month, 1);
    setCurrentDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  // Форматиране на месеца за показване (напр. "May 2025")
  const formattedMonthLabel = new Date(`${currentDate}-01`).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // 1. Филтрираме транзакциите за избрания месец (датата е във формат "YYYY-MM-DD")
  const monthTransactions = useMemo(() => {
    return rows.filter((t: any) => t.date && t.date.startsWith(currentDate));
  }, [rows, currentDate]);

  const totalIncome = monthTransactions
    .filter((t) => t.type?.toUpperCase() === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type?.toUpperCase() === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const hasFilters = query !== "" || category !== "All categories" || type !== "All types";

  // 2. Прилагаме търсенето, категорията и типа върху месечните транзакции
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
    if (deleteModalId !== null) {
      try {
        await deleteTransaction(deleteModalId).unwrap();
        setDeleteModalId(null);
      } catch (err) {
        console.error("Failed to delete transaction:", err);
      }
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
            <strong className="income">+${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
          <div>
            <span>Expenses</span>
            <strong className="expense">-${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
        </div>
        <Button icon="plus" onClick={() => openModal()}>
          Add transaction
        </Button>
      </div>

      <section className="card transactions-card">
        <div className="filters">
          <div className="search-box">
            <Icon name="search" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions..."
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option>All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          
          {/* Динамичен месечен пикер със стрелки вместо статичния текст */}
          <div className="month-picker" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#F9FAFB', border: '1px solid #D0D5DD', borderRadius: '8px' }}>
            <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Previous month">
              <Icon name="chevron" size={16} />
            </button>
            <strong style={{ fontSize: '0.9rem', color: '#344054', minWidth: '90px', textAlign: 'center' }}>{formattedMonthLabel}</strong>
            <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Next month">
              <Icon name="chevron" size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        </div>

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

      {/* Персонален модал за потвърждение на изтриването */}
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