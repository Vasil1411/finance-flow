import React, { useState } from 'react';
import { Button } from '../components/UI';
import { Icon } from '../components/Icon';
import type { IconName } from '../types/icons';

const initialGoals = [
  {
    id: 1,
    name: "Dream home",
    icon: "wallet" as IconName,
    current: 18500,
    target: 40000,
    deadline: "December 2026",
    color: "#526DE2",
    bg: "#EDF0FF",
  },
  {
    id: 2,
    name: "Japan adventure",
    icon: "target" as IconName,
    current: 4850,
    target: 7500,
    deadline: "April 2026",
    color: "#9874DE",
    bg: "#F3EEFF",
  },
  {
    id: 3,
    name: "Emergency fund",
    icon: "plus" as IconName,
    current: 9200,
    target: 12000,
    deadline: "September 2025",
    color: "#299D70",
    bg: "#E8F7F1",
  },
  {
    id: 4,
    name: "New car",
    icon: "grid" as IconName,
    current: 6300,
    target: 25000,
    deadline: "June 2027",
    color: "#E58A4B",
    bg: "#FFF2E8",
  },
];

export const GoalsView: React.FC = () => {
  const [goals, setGoals] = useState(initialGoals);
  const [depositId, setDepositId] = useState<number | null>(null);

  const deposit = (id: number) => {
    setGoals(
      goals.map((g) => (g.id === id ? { ...g, current: Math.min(g.target, g.current + 500) } : g)),
    );
    setDepositId(null);
  };

  return (
    <>
      <div className="section-actions">
        <div className="goals-total">
          <span>Total saved across goals</span>
          <strong>${goals.reduce((a, g) => a + g.current, 0).toLocaleString()}</strong>
        </div>
        <Button icon="plus">New saving goal</Button>
      </div>
      <section className="goals-grid">
        {goals.map((g) => {
          const percent = Math.round((g.current / g.target) * 100);
          return (
            <article className="card goal-card" key={g.id}>
              <div className="goal-top">
                <span className="goal-icon" style={{ color: g.color, background: g.bg }}>
                  <Icon name={g.icon} size={19} />
                </span>
                <button type="button">
                  <Icon name="dots" />
                </button>
              </div>
              <h3>{g.name}</h3>
              <p>
                <Icon name="calendar" size={14} /> Goal date: {g.deadline}
              </p>
              <div className="goal-money">
                <strong>${g.current.toLocaleString()}</strong>
                <span>of ${g.target.toLocaleString()}</span>
              </div>
              <div className="progress">
                <span style={{ width: `${Math.min(percent, 100)}%`, background: g.color }} />
              </div>
              <div className="goal-percent">
                <span>{percent}% complete</span>
                <strong>${(g.target - g.current).toLocaleString()} to go</strong>
              </div>
              {depositId === g.id ? (
                <div className="deposit-confirm">
                  <span>Add $500 to this goal?</span>
                  <div>
                    <button onClick={() => setDepositId(null)} type="button">Cancel</button>
                    <button onClick={() => deposit(g.id)} type="button">Confirm</button>
                  </div>
                </div>
              ) : (
                <button
                  className="deposit-btn"
                  style={{ color: g.color, borderColor: `${g.color}40`, background: g.bg }}
                  onClick={() => setDepositId(g.id)}
                  type="button"
                >
                  <Icon name="plus" size={16} />
                  Deposit funds
                </button>
              )}
            </article>
          );
        })}
        <button className="new-goal-card" type="button">
          <span>
            <Icon name="plus" />
          </span>
          <strong>Create a new goal</strong>
          <p>Start saving for what matters next.</p>
        </button>
      </section>
    </>
  );
};