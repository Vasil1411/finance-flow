import React, { useState } from 'react';
import { Icon } from './Icon';
import { Button } from './UI';
import type { SavingGoal } from '../types/saving-goal';
import { useAddSavingGoalMutation, useUpdateSavingGoalMutation } from '../services/savingGoalsApi';

interface SavingGoalModalProps {
  goal?: SavingGoal | null;
  onClose: () => void;
  onSave: () => void;
}

export const SavingGoalModal: React.FC<SavingGoalModalProps> = ({ goal, onClose, onSave }) => {
  const [addSavingGoal, { isLoading: isAdding }] = useAddSavingGoalMutation();
  const [updateSavingGoal, { isLoading: isUpdating }] = useUpdateSavingGoalMutation();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const targetAmount = Number(formData.get("target_amount"));
    const currentAmount = goal ? Number(goal.current_amount) : Number(formData.get("current_amount") || 0);

    const payload = {
      name: String(formData.get("name")),
      target_amount: targetAmount,
      current_amount: currentAmount,
      deadline: formData.get("deadline") ? String(formData.get("deadline")) : null,
      is_completed: currentAmount >= targetAmount,
    };

    try {
      if (goal?.id) {
        await updateSavingGoal({ id: goal.id, data: payload }).unwrap();
      } else {
        await addSavingGoal(payload).unwrap();
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save saving goal:", err);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={handleSubmit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">{goal ? "UPDATE GOAL" : "NEW SAVING GOAL"}</span>
            <h2>{goal ? "Edit saving goal" : "Create new saving goal"}</h2>
            <p>Set targets for what matters most to your future.</p>
          </div>
          <button type="button" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        {/* Име на целта */}
        <div className="field">
          <label>Goal Name</label>
          <input
            name="name"
            required
            defaultValue={goal?.name || ""}
            placeholder="e.g. Dream home, Japan trip..."
          />
        </div>

        {/* Целева сума */}
        <div className="field amount-field">
          <label>Target Amount</label>
          <div>
            <span>$</span>
            <input
              name="target_amount"
              required
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={goal ? goal.target_amount : ""}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Начална сума (само при създаване) */}
        {!goal && (
          <div className="field amount-field">
            <label>Initial Saved Amount (Optional)</label>
            <div>
              <span>$</span>
              <input
                name="current_amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Краен срок */}
        <div className="field">
          <label>Deadline Date</label>
          <input
            name="deadline"
            type="date"
            defaultValue={goal?.deadline || ""}
          />
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isAdding || isUpdating}>
            {goal ? "Save changes" : "Create goal"}
          </Button>
        </div>
      </form>
    </div>
  );
};