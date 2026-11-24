import React, { useState } from 'react';
import { Button } from '../components/UI';
import { SavingGoalCard } from '../components/SavingGoalCard';
import {
  useGetSavingGoalsQuery,
  useUpdateSavingGoalMutation,
  useDeleteSavingGoalMutation,
} from '../services/savingGoalsApi';
import { SavingGoalModal } from '../components/SavingGoalModal';
import type { SavingGoal } from '../types/saving-goal';

export const GoalsView: React.FC = () => {
  const { data: goals = [], isLoading, error, refetch } = useGetSavingGoalsQuery();
  const [updateSavingGoal] = useUpdateSavingGoalMutation();
  const [deleteSavingGoal] = useDeleteSavingGoalMutation();

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);

  const handleDeposit = async (goal: SavingGoal, addValue: number) => {
    const current = Number(goal.current_amount);
    const target = Number(goal.target_amount);
    const newCurrent = current + addValue;

    try {
      await updateSavingGoal({
        id: goal.id,
        data: {
          ...goal,
          current_amount: newCurrent > target ? target : newCurrent,
        },
      }).unwrap();
    } catch (err) {
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
    </>
  );
};