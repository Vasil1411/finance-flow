import React, { type ReactNode, useState } from 'react';
import { Icon } from './Icon';
import { Button } from './UI';
import type { Transaction } from '../types/transaction';

const categoriesKeys = ["Salary", "Groceries", "Housing", "Transport", "Shopping", "Freelance", "Entertainment", "Utilities"];

interface TransactionModalProps {
  transaction?: Transaction | null;
  onClose: () => void;
  onSave: (t: Transaction) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose, onSave }) => {
  const [type, setType] = useState<"Income" | "Expense">(transaction?.type || "Expense");

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const amount = Number(data.get("amount"));
    onSave({
      id: transaction?.id || Date.now(),
      name: String(data.get("description")),
      category: String(data.get("category")),
      date: new Date(String(data.get("date")) + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      amount: type === "Income" ? amount : -amount,
      type,
    });
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={handleSubmit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">{transaction ? "UPDATE RECORD" : "NEW RECORD"}</span>
            <h2>{transaction ? "Edit transaction" : "Add transaction"}</h2>
            <p>Keep your finances accurate and up to date.</p>
          </div>
          <button type="button" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="type-toggle">
          <button
            type="button"
            className={type === "Expense" ? "active expense-toggle" : ""}
            onClick={() => setType("Expense")}
          >
            <Icon name="arrowUp" size={17} />
            Expense
          </button>
          <button
            type="button"
            className={type === "Income" ? "active income-toggle" : ""}
            onClick={() => setType("Income")}
          >
            <Icon name="arrowDown" size={17} />
            Income
          </button>
        </div>
        <div className="field amount-field">
          <label>Amount</label>
          <div>
            <span>$</span>
            <input
              name="amount"
              required
              type="number"
              step="0.01"
              min="0"
              defaultValue={transaction ? Math.abs(transaction.amount) : ""}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Category</label>
            <select name="category" defaultValue={transaction?.category || "Groceries"}>
              {categoriesKeys.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Date</label>
            <input name="date" required type="date" defaultValue="2025-05-29" />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <input
            name="description"
            required
            defaultValue={transaction?.name}
            placeholder="What was this transaction for?"
          />
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{transaction ? "Save changes" : "Add transaction"}</Button>
        </div>
      </form>
    </div>
  );
};