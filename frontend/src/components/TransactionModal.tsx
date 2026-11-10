import React, { useState } from 'react';
import { Icon } from './Icon';
import { Button } from './UI';
import type { Transaction, TransactionType } from '../types/transaction';
import { useAddTransactionMutation, useUpdateTransactionMutation } from '../services/transactionsApi';

interface TransactionModalProps {
  transaction?: Transaction | null;
  onClose: () => void;
  onSave: () => void;
}

const categoriesKeys = ["Salary", "Groceries", "Housing", "Transport", "Shopping", "Freelance", "Entertainment", "Utilities"];

export const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose, onSave }) => {
  // На бекенда type е 'INCOME' или 'EXPENSE'
  const [type, setType] = useState<TransactionType>(transaction?.type || "EXPENSE");

  const [addTransaction, { isLoading: isAdding }] = useAddTransactionMutation();
  const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const categoryVal = formData.get("category");

    // Подготовка на данните с правилно конвертирани типове
   const payload = {
      amount: amount, 
      type: type, // 'INCOME' или 'EXPENSE'
      date: String(formData.get("date")),
      description: String(formData.get("description")),
      category: categoryVal ? Number(categoryVal) : null,
    };

    try {
      if (transaction?.id) {
        await updateTransaction({ id: transaction.id, data: payload }).unwrap();
      } else {
        await addTransaction(payload).unwrap();
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save transaction:", err);
    }
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
            className={type === "EXPENSE" ? "active expense-toggle" : ""}
            onClick={() => setType("EXPENSE")}
          >
            <Icon name="arrowUp" size={17} />
            Expense
          </button>
          <button
            type="button"
            className={type === "INCOME" ? "active income-toggle" : ""}
            onClick={() => setType("INCOME")}
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
              min="0.01"
              defaultValue={transaction ? Math.abs(transaction.amount) : ""}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Category</label>
            <select name="category" defaultValue={transaction?.category_name || "Groceries"}>
              {categoriesKeys.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Date</label>
            <input 
              name="date" 
              required 
              type="date" 
              defaultValue={transaction?.date || new Date().toISOString().split('T')[0]} 
            />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <input
            name="description"
            required
            defaultValue={transaction?.description || ""}
            placeholder="What was this transaction for?"
          />
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isAdding || isUpdating}>
            {transaction ? "Save changes" : "Add transaction"}
          </Button>
        </div>
      </form>
    </div>
  );
};