import React, { useState } from 'react';
import { Icon } from './Icon';
import type { SavingGoal } from '../types/saving-goal';

interface SavingGoalCardProps {
  goal: SavingGoal;
  isDeleteConfirmOpen: boolean;
  onOpenDeleteConfirm: () => void;
  onCancelDeleteConfirm: () => void;
  onConfirmDelete: () => void;
  onEdit: (goal: SavingGoal) => void;
  onDeposit: (goal: SavingGoal, amount: number) => Promise<void>;
}

const GOAL_COLOR = '#526DE2';
const GOAL_BG = '#EDF0FF';

export const SavingGoalCard: React.FC<SavingGoalCardProps> = ({
  goal,
  isDeleteConfirmOpen,
  onOpenDeleteConfirm,
  onCancelDeleteConfirm,
  onConfirmDelete,
  onEdit,
  onDeposit,
}) => {
  const [isDepositingOpen, setIsDepositingOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  const current = Number(goal.current_amount || 0);
  const target = Number(goal.target_amount || 1);
  const percent = Math.round((current / target) * 100);

  const handleDepositSubmit = async () => {
    const addValue = Number(depositAmount) || 0;
    setIsSubmittingDeposit(true);
    try {
      await onDeposit(goal, addValue);
      setIsDepositingOpen(false);
      setDepositAmount('100');
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  return (
    <article className="card goal-card" style={{ position: 'relative' }}>
      {isDeleteConfirmOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 600, color: '#1D2939' }}>
            Are you sure you want to delete this goal?
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onCancelDeleteConfirm}
              type="button"
              style={{
                padding: '6px 14px',
                background: '#F2F4F7',
                color: '#344054',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirmDelete}
              type="button"
              style={{
                padding: '6px 14px',
                background: '#D95E44',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="goal-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="goal-icon" style={{ color: GOAL_COLOR, background: GOAL_BG }}>
          <Icon name="wallet" size={19} />
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onEdit(goal)}
            title="Edit goal"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}
          >
            <Icon name="dots" />
          </button>
          <button
            type="button"
            onClick={onOpenDeleteConfirm}
            title="Delete goal"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D95E44' }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>

      <h3>{goal.name}</h3>
      <p>
        <Icon name="calendar" size={14} /> Goal date: {goal.deadline || 'No deadline'}
      </p>
      <div className="goal-money">
        <strong>€{current.toLocaleString()}</strong>
        <span>of €{target.toLocaleString()}</span>
      </div>
      <div className="progress">
        <span style={{ width: `${Math.min(percent, 100)}%`, background: GOAL_COLOR }} />
      </div>
      <div className="goal-percent">
        <span>{percent}% complete</span>
        <strong>€{(target - current).toLocaleString()} to go</strong>
      </div>

      {isDepositingOpen ? (
        <div className="deposit-confirm" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Enter amount to deposit (€):</span>
          <input
            type="number"
            step="0.01"
            min="1"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            autoFocus
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', width: '100%' }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsDepositingOpen(false)}
              type="button"
              style={{ padding: '6px 12px', background: '#f1f1f1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDepositSubmit}
              disabled={isSubmittingDeposit}
              type="button"
              style={{ padding: '6px 12px', background: '#526DE2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {isSubmittingDeposit ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>
      ) : (
        <button
          className="deposit-btn"
          style={{ color: GOAL_COLOR, borderColor: `${GOAL_COLOR}40`, background: GOAL_BG }}
          onClick={() => {
            setDepositAmount('100');
            setIsDepositingOpen(true);
          }}
          type="button"
        >
          <Icon name="plus" size={16} />
          Deposit funds
        </button>
      )}
    </article>
  );
};