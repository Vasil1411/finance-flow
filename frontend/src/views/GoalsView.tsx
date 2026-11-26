import React, { useState } from 'react';
import { Button } from '../components/UI';
import { SavingGoalCard } from '../components/SavingGoalCard';
import {
  useGetSavingGoalsQuery,
  useGetSavingsReserveSummaryQuery,
  useContributeToSavingGoalMutation,
  useDeleteSavingGoalMutation,
} from '../services/savingGoalsApi';
import { SavingGoalModal } from '../components/SavingGoalModal';
import type { SavingGoal } from '../types/saving-goal';

interface FundErrorModalState {
  message: string;
  availableAmount?: string;
  requestedAmount?: string;
  reserveAvailable?: string;
  canUseReserve?: boolean;
  goalId?: number;
  goalName?: string;
  amountNumber?: number;
}

export const GoalsView: React.FC = () => {
  const {
    data: goals = [],
    isLoading,
    error,
    refetch,
  } = useGetSavingGoalsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const { data: reserveSummary, refetch: refetchReserve } = useGetSavingsReserveSummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [contributeToSavingGoal, { isLoading: isContributingReserve }] = useContributeToSavingGoalMutation();
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
      refetchReserve();
    } catch (err: any) {
      const rawData = err?.data;
      const apiError = rawData?.errors && typeof rawData.errors === 'object' ? rawData.errors : rawData;

      if (err?.status === 400 && apiError) {
        setFundErrorModal({
          message: apiError.error || 'Monthly savings budget limit reached.',
          availableAmount: apiError.available_amount,
          requestedAmount: apiError.requested_amount,
          reserveAvailable: apiError.reserve_available,
          canUseReserve: Boolean(apiError.can_use_reserve),
          goalId: goal.id,
          goalName: goal.name,
          amountNumber: addValue,
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

  const handleDepositFromReserve = async () => {
    if (!fundErrorModal?.goalId || !fundErrorModal?.amountNumber) return;

    try {
      await contributeToSavingGoal({
        id: fundErrorModal.goalId,
        amount: fundErrorModal.amountNumber,
        create_transaction: true,
        use_reserve: true,
      }).unwrap();
      setFundErrorModal(null);
      refetch();
      refetchReserve();
    } catch (err: any) {
      const rawData = err?.data;
      const apiError = rawData?.errors && typeof rawData.errors === 'object' ? rawData.errors : rawData;
      setFundErrorModal({
        message: apiError?.error || 'Insufficient funds in your All-Time savings reserve.',
        availableAmount: apiError?.available_amount,
        requestedAmount: apiError?.requested_amount,
        canUseReserve: false,
        goalName: fundErrorModal.goalName,
      });
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await deleteSavingGoal(id).unwrap();
      setDeleteConfirmId(null);
      refetch();
      refetchReserve();
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

  const totalSavedInGoals = goals.reduce((a, g) => a + Number(g.current_amount || 0), 0);
  const freeReserve = Number(reserveSummary?.free_reserve ?? 0);
  const totalAllTimeSavings = Number(reserveSummary?.total_wealth_with_goals ?? totalSavedInGoals);

  return (
    <>
      <div
        className="section-actions"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div className="goals-total">
            <span>Saved in goals</span>
            <strong>€{totalSavedInGoals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>

          <div className="goals-total">
            <span>All-Time Savings Reserve</span>
            <strong style={{ color: freeReserve >= 0 ? '#299D70' : '#B42318' }}>
              €{freeReserve.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>

          <div className="goals-total">
            <span>Total Savings (All-Time)</span>
            <strong style={{ color: '#526DE2' }}>
              €{totalAllTimeSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
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
          onSave={() => {
            refetch();
            refetchReserve();
          }}
        />
      )}

      {fundErrorModal && (
        <div className="modal-backdrop" onMouseDown={() => setFundErrorModal(null)}>
          <div
            className="modal"
            style={{ maxWidth: '460px', padding: '24px' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-head" style={{ marginBottom: '12px' }}>
              <div>
                <span className="eyebrow" style={{ color: '#D95E44' }}>
                  MONTHLY SAVINGS LIMIT REACHED
                </span>
                <h2>Monthly budget exceeded</h2>
                <p style={{ marginTop: '8px', color: '#475467', lineHeight: 1.5 }}>
                  {fundErrorModal.message}
                  {fundErrorModal.goalName ? ` (Goal: ${fundErrorModal.goalName})` : ''}
                </p>

                {fundErrorModal.availableAmount !== undefined && (
                  <p style={{ marginTop: '8px', fontWeight: 600, color: '#1D2939' }}>
                    Monthly left: €{fundErrorModal.availableAmount}
                    {fundErrorModal.requestedAmount ? ` • Requested: €${fundErrorModal.requestedAmount}` : ''}
                  </p>
                )}

                {fundErrorModal.reserveAvailable !== undefined && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#F4F3FF',
                      border: '1px solid #D9D6FE',
                      color: '#344054',
                      fontSize: '0.875rem',
                    }}
                  >
                    <strong>All-Time Savings Reserve:</strong> €{fundErrorModal.reserveAvailable} available
                  </div>
                )}
              </div>
            </div>

            <div
              className="modal-actions"
              style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
            >
              <Button variant="secondary" onClick={() => setFundErrorModal(null)} type="button">
                Cancel
              </Button>

              {fundErrorModal.canUseReserve && (
                <Button
                  onClick={handleDepositFromReserve}
                  disabled={isContributingReserve}
                  type="button"
                >
                  {isContributingReserve
                    ? 'Depositing...'
                    : `Use All-Time Reserve (€${fundErrorModal.requestedAmount})`}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};