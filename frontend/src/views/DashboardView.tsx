import React from 'react';
import { StatCard } from '../components/StatCard';
import { TransactionRows } from '../components/TransactionRows';
import { Button } from '../components/UI';
import { Icon } from '../components/Icon';
import type { Transaction } from '../types/transaction';

interface DashboardViewProps {
  setPage: (p: string) => void;
  onAdd: () => void;
  transactions: Transaction[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setPage, onAdd, transactions }) => {
  return (
    <>
      <div className="quick-actions">
        <Button icon="plus" onClick={onAdd}>
          Add transaction
        </Button>
        <Button icon="wallet" variant="secondary" onClick={() => setPage("budgets")}>
          Set budget
        </Button>
      </div>
      <section className="stats-grid">
        <StatCard
          label="Total balance"
          amount="$24,680.50"
          trend="+8.2%"
          icon="wallet"
          color="#526DE2"
          bg="#EDF0FF"
        />
        <StatCard
          label="Monthly income"
          amount="$6,240.00"
          trend="+12.5%"
          icon="arrowDown"
          color="#299D70"
          bg="#E8F7F1"
        />
        <StatCard
          label="Monthly expenses"
          amount="$3,482.75"
          trend="-4.1%"
          icon="arrowUp"
          color="#DF7451"
          bg="#FFF0EA"
        />
      </section>
      <section className="dashboard-grid">
        <div className="card budget-rule">
          <div className="card-heading">
            <div>
              <span className="eyebrow">MONTHLY PLAN</span>
              <h2>50 / 30 / 20 budget rule</h2>
              <p>A balanced way to put your income to work.</p>
            </div>
            <button type="button">
              <Icon name="dots" />
            </button>
          </div>
          <div className="rule-total">
            <div>
              <span>Allocated this month</span>
              <strong>
                $5,620 <small>of $6,240</small>
              </strong>
            </div>
            <div className="donut">
              <span>
                90%<small>planned</small>
              </span>
            </div>
          </div>
          <div className="rule-items">
            {[
              ["Needs", "Essentials & bills", 50, "$2,840", "$3,120", "#5B8DEF"],
              ["Wants", "Lifestyle & fun", 30, "$1,680", "$1,872", "#9874DE"],
              ["Savings", "Future & goals", 20, "$1,100", "$1,248", "#2EA879"],
            ].map(([name, sub, pct, spent, target, color]) => (
              <div className="rule-item" key={name as string}>
                <div className="rule-line">
                  <div>
                    <i style={{ background: color as string }} />
                    <strong>{name}</strong>
                    <span>{sub}</span>
                  </div>
                  <b>{pct}%</b>
                </div>
                <div className="progress">
                  <span style={{ width: `${Math.min(Number(pct) === 50 ? 91 : Number(pct) === 30 ? 90 : 88, 100)}%`, background: color as string }} />
                </div>
                <div className="rule-numbers">
                  <span>{spent} allocated</span>
                  <span>Target {target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card spending-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">SPENDING</span>
              <h2>Expense snapshot</h2>
            </div>
            <button className="select-btn" type="button">
              This month <Icon name="chevron" size={14} />
            </button>
          </div>
          <div className="spend-total">
            <span>Total spent</span>
            <strong>$3,482.75</strong>
            <small>
              <b>4.1% lower</b> than last month
            </small>
          </div>
          <div className="spend-chart">
            {[45, 68, 52, 78, 62, 88, 59].map((h, i) => (
              <div key={i}>
                <i style={{ height: `${h}%` }} className={i === 5 ? "active" : ""} />
                <span>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="card recent-card">
        <div className="card-heading">
          <div>
            <h2>Recent transactions</h2>
            <p>Your latest account activity.</p>
          </div>
          <button className="text-btn" onClick={() => setPage("transactions")} type="button">
            View all <Icon name="chevron" size={15} />
          </button>
        </div>
        <TransactionRows rows={transactions.slice(0, 5)} compact />
      </section>
    </>
  );
};