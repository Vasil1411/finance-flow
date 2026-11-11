import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { Button } from './UI';
import type { Category, TransactionType, RuleChoice } from '../types/transaction';
import { useAddCategoryMutation, useUpdateCategoryMutation } from '../services/categoriesApi';

interface CategoryModalProps {
  category?: Category | null;
  onClose: () => void;
  onSave: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ category, onClose, onSave }) => {
  const [name, setName] = useState(category?.name || "");
  const [type, setType] = useState<TransactionType>(category?.type || "EXPENSE");
  const [allocationType, setAllocationType] = useState<RuleChoice>(category?.allocation_type || "NEED");

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setType(category.type || "EXPENSE");
      setAllocationType(category.allocation_type || "NEED");
    } else {
      setName("");
      setType("EXPENSE");
      setAllocationType("NEED");
    }
  }, [category]);

  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      name: name,
      type: type,
      allocation_type: allocationType,
    };

    try {
      if (category?.id) {
        await updateCategory({ id: category.id, data: payload }).unwrap();
      } else {
        await addCategory(payload).unwrap();
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save category:", err);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={handleSubmit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">{category ? "UPDATE CATEGORY" : "NEW CATEGORY"}</span>
            <h2>{category ? "Edit budget category" : "Create budget category"}</h2>
            <p>Organize your transactions and 50/30/20 limits.</p>
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
        
        <div className="field">
          <label>Category Name</label>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries, Rent, Freelance..."
          />
        </div>
        
        <div className="field">
          <label>50/30/20 Budget Rule Allocation</label>
          <select 
            value={allocationType} 
            onChange={(e) => setAllocationType(e.target.value as RuleChoice)}
          >
            {/* Стойностите тук съвпадат на 100% с бекенд модела (NEED, WANT, SAVINGS, NONE) */}
            <option value="NEED">Needs (50%)</option>
            <option value="WANT">Wants (30%)</option>
            <option value="SAVINGS">Savings (20%)</option>
            <option value="NONE">None / Income</option>
          </select>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isAdding || isUpdating}>
            {category ? "Save changes" : "Create category"}
          </Button>
        </div>
      </form>
    </div>
  );
};