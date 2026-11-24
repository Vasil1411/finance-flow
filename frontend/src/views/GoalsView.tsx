import React, { useState } from 'react';
import { Button } from '../components/UI';
import { SavingGoalCard } from '../components/SavingGoalCard';
import {
  useGetSavingGoalsQuery,
  useContributeToSavingGoalMutation,
  useDeleteSavingGoalMutation,
} from '../services/savingGoalsApi';
import { SavingGoalModal } from '../components/SavingGoalModal';
import type { SavingGoal } from '../types/saving-goal';

interface FundErrorModalState {
  message: string;
  availableAmount?: string;
  requestedAmount?: string;
  goalName?: string;
}

export const GoalsView: React.FC = () => {
  const { data: goals = [], isLoading, error, refetch } = useGetSavingGoalsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [contributeToSavingGoal] = useContributeToSavingGoalMutation();
  const [deleteSavingGoal] = useDeleteSavingGoalMutation();

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);
  const [fundErrorModal, setFundErrorModal] = useState<FundErrorModalState | null>(null);

  const handleDeposit = async (goal: SavingGoal, addValue: number) => {
    if (addValue <= 0) return;

    try {
      await contributeToSavingGoal({
        id: goal.id,
        amount: addValue,
        create_transaction: true,
      }).unwrap();
      refetch();
    } catch (err: any) {
      const apiError = err?.data;
      if (err?.status === 400 && apiError) {
        setFundErrorModal({
          message: apiError.error || 'Insufficient funds in savings fund.',
          availableAmount: apiError.available_amount,
          requestedAmount: apiError.requested_amount,
          goalName: goal.name,
        });
      } else {
        setFundErrorModal({
          message: 'Failed to deposit funds. Please try again.',
          goalName: goal.name,
        });
      }
      console.error('Failed to deposit funds:', err);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await deleteSavingGoal(id).unwrap();
      setDeleteConfirmId(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedGoal(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: SavingGoal) => {
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading saving goals...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Error loading saving goals.</div>;

  const totalSaved = goals.reduce((a, g) => a + Number(g.current_amount || 0), 0);

  return (
    <>
      <div className="section-actions">
        <div className="goals-total">
          <span>Total saved across goals</span>
          <strong>€{totalSaved.toLocaleString()}</strong>
        </div>
        <Button icon="plus" onClick={handleOpenAddModal}>
          New saving goal
        </Button>
      </div>

      <section className="goals-grid">
        {goals.map((g: SavingGoal) => (
          <SavingGoalCard
            key={g.id}
            goal={g}
            isDeleteConfirmOpen={deleteConfirmId === g.id}
            onOpenDeleteConfirm={() => setDeleteConfirmId(g.id)}
            onCancelDeleteConfirm={() => setDeleteConfirmId(null)}
            onConfirmDelete={() => handleDeleteGoal(g.id)}
            onEdit={handleOpenEditModal}
            onDeposit={handleDeposit}
          />
        ))}
      </section>

      {isModalOpen && (
        <SavingGoalModal
          goal={selectedGoal}
          onClose={() => setIsModalOpen(false)}
          onSave={() => refetch()}
        />
      )}

      {fundErrorModal && (
        <div className="modal-backdrop" onMouseDown={() => setFundErrorModal(null)}>
          <div
            className="modal"
            style={{ maxWidth: '420px', padding: '24px' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-head" style={{ marginBottom: '12px' }}>
              <div>
                <span className="eyebrow" style={{ color: '#D95E44' }}>
                  SAVINGS FUND LIMIT
                </span>
                <h2>Cannot add deposit</h2>
                <p style={{ marginTop: '8px', color: '#475467', lineHeight: 1.5 }}>
                  {fundErrorModal.message}
                  {fundErrorModal.goalName ? ` (Goal: ${fundErrorModal.goalName})` : ''}
                </p>
                {fundErrorModal.availableAmount !== undefined && (
                  <p style={{ marginTop: '8px', fontWeight: 600, color: '#1D2939' }}>
                    Available in fund: €{fundErrorModal.availableAmount}
                    {fundErrorModal.requestedAmount ? ` • Requested: €${fundErrorModal.requestedAmount}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div
              className="modal-actions"
              style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}
            >
              <Button onClick={() => setFundErrorModal(null)} type="button">
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};