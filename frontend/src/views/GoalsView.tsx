import React, { useState } from 'react';
import { Button } from '../components/UI';
import { Icon } from '../components/Icon';
import { 
  useGetSavingGoalsQuery, 
  useUpdateSavingGoalMutation 
} from '../services/savingGoalsApi';
import { SavingGoalModal } from '../components/SavingGoalModal';
import type { SavingGoal } from '../types/saving-goal';

export const GoalsView: React.FC = () => {
  const { data: goals = [], isLoading, error, refetch } = useGetSavingGoalsQuery();
  const [updateSavingGoal] = useUpdateSavingGoalMutation();
  
  const [depositId, setDepositId] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("100");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);

  const handleDeposit = async (goal: SavingGoal) => {
    const current = Number(goal.current_amount);
    const target = Number(goal.target_amount);
    const addValue = Number(depositAmount) || 0;
    const newCurrent = current + addValue;
    
    try {
      await updateSavingGoal({
        id: goal.id,
        data: {
          ...goal,
          current_amount: newCurrent > target ? target : newCurrent,
        },
      }).unwrap();
      setDepositId(null);
      setDepositAmount("100");
    } catch (err) {
      console.error("Failed to deposit funds:", err);
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
          <strong>${totalSaved.toLocaleString()}</strong>
        </div>
        <Button icon="plus" onClick={handleOpenAddModal}>New saving goal</Button>
      </div>

      <section className="goals-grid">
        {goals.map((g: SavingGoal) => {
          const current = Number(g.current_amount || 0);
          const target = Number(g.target_amount || 1);
          const percent = Math.round((current / target) * 100);
          
          const color = "#526DE2";
          const bg = "#EDF0FF";
          const iconName = "wallet";

          return (
            <article className="card goal-card" key={g.id}>
              <div className="goal-top">
                <span className="goal-icon" style={{ color, background: bg }}>
                  <Icon name={iconName} size={19} />
                </span>
                <button type="button" onClick={() => handleOpenEditModal(g)}>
                  <Icon name="dots" />
                </button>
              </div>
              <h3>{g.name}</h3>
              <p>
                <Icon name="calendar" size={14} /> Goal date: {g.deadline || "No deadline"}
              </p>
              <div className="goal-money">
                <strong>${current.toLocaleString()}</strong>
                <span>of ${target.toLocaleString()}</span>
              </div>
              <div className="progress">
                <span style={{ width: `${Math.min(percent, 100)}%`, background: color }} />
              </div>
              <div className="goal-percent">
                <span>{percent}% complete</span>
                <strong>${(target - current).toLocaleString()} to go</strong>
              </div>

              {depositId === g.id ? (
                <div className="deposit-confirm" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Enter amount to deposit ($):</span>
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
                    <button onClick={() => setDepositId(null)} type="button" style={{ padding: '6px 12px', background: '#f1f1f1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => handleDeposit(g)} type="button" style={{ padding: '6px 12px', background: '#526DE2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirm</button>
                  </div>
                </div>
              ) : (
                <button
                  className="deposit-btn"
                  style={{ color, borderColor: `${color}40`, background: bg }}
                  onClick={() => { setDepositId(g.id); setDepositAmount("100"); }}
                  type="button"
                >
                  <Icon name="plus" size={16} />
                  Deposit funds
                </button>
              )}
            </article>
          );
        })}
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