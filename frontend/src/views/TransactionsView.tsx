import React, { useState, useMemo } from 'react';
import { Button } from '../components/UI';
import { Icon } from '../components/Icon';
import { TransactionRows } from '../components/TransactionRows';
import type { Transaction } from '../types/transaction';

const categories: Record<string, { color: string; bg: string; icon: string }> = {
  Salary: { color: "#2A9D70", bg: "#E8F7F1", icon: "S" },
  Groceries: { color: "#E17A4A", bg: "#FFF1E9", icon: "G" },
  Housing: { color: "#6681D9", bg: "#ECF0FF", icon: "H" },
  Transport: { color: "#8A6FD1", bg: "#F2EDFF", icon: "T" },
  Shopping: { color: "#E05A78", bg: "#FFECF1", icon: "B" },
  Freelance: { color: "#2A9D70", bg: "#E8F7F1", icon: "F" },
  Entertainment: { color: "#D39532", bg: "#FFF5DE", icon: "E" },
  Utilities: { color: "#4A91C7", bg: "#EAF5FC", icon: "U" },
};

interface TransactionsViewProps {
  rows: Transaction[];
  openModal: (t?: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ rows, openModal }) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [type, setType] = useState("All types");

  const filtered = useMemo(
    () =>
      rows.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) &&
          (category === "All categories" || t.category === category) &&
          (type === "All types" || t.type === type),
      ),
    [rows, query, category, type],
  );

  return (
    <>
      <div className="section-actions">
        <div className="summary-pills">
          <div>
            <span>Income</span>
            <strong className="income">+$5,060.00</strong>
          </div>
          <div>
            <span>Expenses</span>
            <strong className="expense">-$1,817.12</strong>
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
            {Object.keys(categories).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option>All types</option>
            <option>Income</option>
            <option>Expense</option>
          </select>
          <button className="date-filter" type="button">
            <Icon name="calendar" size={17} />
            May 1 – May 31
          </button>
        </div>
        <div className="table-summary">
          <p>
            <strong>{filtered.length} transactions</strong> in May 2025
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All categories");
              setType("All types");
            }}
          >
            Clear filters
          </button>
        </div>
        {filtered.length ? (
          <TransactionRows rows={filtered} onEdit={openModal} />
        ) : (
          <div className="empty-state">
            <span>
              <Icon name="search" />
            </span>
            <h3>No transactions found</h3>
            <p>Try changing or clearing your filters.</p>
          </div>
        )}
        <div className="pagination">
          <span>
            Showing {filtered.length} of {rows.length} transactions
          </span>
          <div>
            <button disabled type="button">Previous</button>
            <button className="active" type="button">1</button>
            <button type="button">2</button>
            <button type="button">Next</button>
          </div>
        </div>
      </section>
    </>
  );
};