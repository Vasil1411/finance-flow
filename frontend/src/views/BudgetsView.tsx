import React, { useState } from 'react';
import { Button } from '../components/UI';
import { Icon } from '../components/Icon';

const budgets = [
  { name: "Housing", type: "Needs", spent: 1450, budget: 1600, color: "#5B8DEF" },
  { name: "Groceries", type: "Needs", spent: 486, budget: 600, color: "#5B8DEF" },
  { name: "Transport", type: "Needs", spent: 318, budget: 400, color: "#5B8DEF" },
  { name: "Entertainment", type: "Wants", spent: 285, budget: 300, color: "#9874DE" },
  { name: "Shopping", type: "Wants", spent: 375, budget: 350, color: "#E27A54" },
  { name: "Emergency fund", type: "Savings", spent: 680, budget: 800, color: "#2EA879" },
];

const categories: Record<string, { color: string; bg: string; icon: string }> = {
  Housing: { color: "#6681D9", bg: "#ECF0FF", icon: "H" },
  Groceries: { color: "#E17A4A", bg: "#FFF1E9", icon: "G" },
  Transport: { color: "#8A6FD1", bg: "#F2EDFF", icon: "T" },
  Entertainment: { color: "#D39532", bg: "#FFF5DE", icon: "E" },
  Shopping: { color: "#E05A78", bg: "#FFECF1", icon: "B" },
  "Emergency fund": { color: "#2A9D70", bg: "#E8F7F1", icon: "F" },
};

export const BudgetsView: React.FC = () => {
  const [active, setActive] = useState("All");
  const visible = active === "All" ? budgets : budgets.filter((b) => b.type === active);

  return (
    <>
      <div className="section-actions">
        <div className="month-picker">
          <button type="button">
            <Icon name="chevron" size={16} />
          </button>
          <strong>May 2025</strong>
          <button type="button">
            <Icon name="chevron" size={16} />
          </button>
        </div>
        <Button icon="plus">Create budget</Button>
      </div>
      <section className="budget-summary-grid">
        <div className="card overall-budget">
          <div className="card-heading">
            <div>
              <span className="eyebrow">TOTAL MONTHLY BUDGET</span>
              <h2>
                $4,050 <small>of $4,600</small>
              </h2>
            </div>
            <div className="budget-ring">
              <span>88%</span>
            </div>
          </div>
          <div className="progress">
            <span style={{ width: "88%", background: "#516CE5" }} />
          </div>
          <div className="overall-labels">
            <span>$550 remaining</span>
            <span>9 days left</span>
          </div>
        </div>
        <div className="card rule-mini">
          <div>
            <i style={{ background: "#5B8DEF" }} />
            <span>Needs</span>
            <strong>$2,254 / $2,600</strong>
          </div>
          <div>
            <i style={{ background: "#9874DE" }} />
            <span>Wants</span>
            <strong>$660 / $650</strong>
          </div>
          <div>
            <i style={{ background: "#2EA879" }} />
            <span>Savings</span>
            <strong>$1,136 / $1,350</strong>
          </div>
        </div>
      </section>
      <div className="tabs">
        {["All", "Needs", "Wants", "Savings"].map((t) => (
          <button key={t} className={active === t ? "active" : ""} onClick={() => setActive(t)} type="button">
            {t}
          </button>
        ))}
      </div>
      <section className="budget-cards">
        {visible.map((b) => {
          const percent = Math.round((b.spent / b.budget) * 100);
          const cat = categories[b.name] || categories.Housing;
          return (
            <article className="card budget-card" key={b.name}>
              <div className="budget-card-top">
                <span className="category-icon" style={{ color: cat.color, background: cat.bg }}>
                  {cat.icon}
                </span>
                <span className={`type-badge ${b.type.toLowerCase()}`}>{b.type}</span>
                <button type="button">
                  <Icon name="dots" />
                </button>
              </div>
              <h3>{b.name}</h3>
              <div className="budget-value">
                <strong>${b.spent.toLocaleString()}</strong>
                <span>of ${b.budget.toLocaleString()}</span>
              </div>
              <div className="progress">
                <span style={{ width: `${Math.min(percent, 100)}%`, background: percent > 100 ? "#E06A4E" : b.color }} />
              </div>
              <div className="budget-status">
                <span style={{ color: percent > 100 ? "#D95E44" : "#667085" }}>
                  {percent}% used
                </span>
                <strong>
                  {percent > 100 ? `$${b.spent - b.budget} over` : `$${b.budget - b.spent} left`}
                </strong>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
};