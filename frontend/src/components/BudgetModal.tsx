import React from 'react';
import { Icon } from './Icon';
import { Button } from './UI';
import type { Budget } from '../types/budget';
import { useAddBudgetMutation, useUpdateBudgetMutation } from '../services/budgetsApi';
import { useGetCategoriesQuery } from '../services/categoriesApi';

interface BudgetModalProps {
  budget?: Budget | null;
  onClose: () => void;
  onSave: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ budget, onClose, onSave }) => {
  const { data: categories = [] } = useGetCategoriesQuery();
  
  // Показваме само категории от тип EXPENSE (никакви приходи!)
  const expenseCategories = categories.filter((c: any) => 
    c.type && c.type.toUpperCase() === 'EXPENSE'
  );

  const [addBudget, { isLoading: isAdding }] = useAddBudgetMutation();
  const [updateBudget, { isLoading: isUpdating }] = useUpdateBudgetMutation();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));

    const rawMonth = String(formData.get("month")); // формат YYYY-MM
    const monthFormatted = rawMonth.length === 7 ? `${rawMonth}-01` : rawMonth;

    const payload = {
      category: Number(formData.get("category")),
      amount: amount,
      month: monthFormatted,
    };

    try {
      if (budget?.id) {
        await updateBudget({ id: budget.id, data: payload }).unwrap();
      } else {
        await addBudget(payload).unwrap();
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save budget:", err);
    }
  };

  const defaultMonth = budget?.month ? budget.month.slice(0, 7) : new Date().toISOString().slice(0, 7);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={handleSubmit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">{budget ? "UPDATE BUDGET" : "NEW BUDGET"}</span>
            <h2>{budget ? "Edit budget limit" : "Set new budget"}</h2>
            <p>Control your monthly expenses per category.</p>
          </div>
          <button type="button" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        <div className="field">
          <label>Expense Category</label>
          <select name="category" defaultValue={budget?.category || ""} required>
            <option value="" disabled>Select expense category...</option>
            {expenseCategories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.allocation_type || 'NEED'})
              </option>
            ))}
          </select>
        </div>

        <div className="field amount-field">
          <label>Budget Amount</label>
          <div>
            <span>$</span>
            <input
              name="amount"
              required
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={budget ? budget.amount : ""}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="field">
          <label>Month</label>
          <input
            name="month"
            required
            type="month"
            defaultValue={defaultMonth}
          />
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isAdding || isUpdating}>
            {budget ? "Save changes" : "Create budget"}
          </Button>
        </div>
      </form>
    </div>
  );
};