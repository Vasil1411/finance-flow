import React, { useState, useMemo } from 'react';
import { StatCard } from '../components/StatCard';
import { TransactionRows } from '../components/TransactionRows';
import { Icon } from '../components/Icon';
import { useGetTransactionsQuery } from '../services/transactionsApi';
import { useGetBudgetsQuery } from '../services/budgetsApi';
import { useGetCategoriesQuery } from '../services/categoriesApi';
import { useGetSavingGoalsQuery } from '../services/savingGoalsApi';

interface DashboardViewProps {
  setPage: (p: string) => void;
  onAdd: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setPage }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const handlePrevMonth = () => {
    const [year, month] = currentDate.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setCurrentDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentDate.split('-').map(Number);
    const date = new Date(year, month, 1);
    setCurrentDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formattedMonthLabel = new Date(`${currentDate}-01`).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const { data: transactions = [], isLoading: loadingTx } = useGetTransactionsQuery();
  const { data: budgets = [] } = useGetBudgetsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: goals = [] } = useGetSavingGoalsQuery();

  // 1. Филтрираме транзакциите строго за избрания месец
  const monthTransactions = useMemo(() => {
    return transactions.filter((t: any) => t.date && t.date.startsWith(currentDate));
  }, [transactions, currentDate]);

  // 2. Филтрираме бюджетите строго за избрания месец
  const monthBudgets = useMemo(() => {
    return budgets.filter((b: any) => b.month && b.month.startsWith(currentDate));
  }, [budgets, currentDate]);

  const totalIncome = monthTransactions
    .filter((t: any) => t.type?.toUpperCase() === 'INCOME')
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const totalExpense = monthTransactions
    .filter((t: any) => t.type?.toUpperCase() === 'EXPENSE')
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const totalBalance = totalIncome - totalExpense;

  // 3. Изчисляване на реалните суми по 50/30/20 групите спрямо категориите и бюджетите за месеца
  const groupAllocations = useMemo(() => {
    const groups = {
      Needs: { allocated: 0, target: totalIncome * 0.5 },
      Wants: { allocated: 0, target: totalIncome * 0.3 },
      Savings: { allocated: 0, target: totalIncome * 0.2 },
    };

    monthBudgets.forEach((b: any) => {
      const cat = categories.find((c: any) => c.id === b.category);
      if (!cat) return;
      const alloc = (cat.allocation_type || "").toUpperCase();
      const amount = Number(b.amount || 0);

      if (alloc.includes('NEED')) {
        groups.Needs.allocated += amount;
      } else if (alloc.includes('WANT')) {
        groups.Wants.allocated += amount;
      } else if (alloc.includes('SAVING')) {
        groups.Savings.allocated += amount;
      }
    });

    return groups;
  }, [monthBudgets, categories, totalIncome]);

  const totalBudgetAllocated = groupAllocations.Needs.allocated + groupAllocations.Wants.allocated + groupAllocations.Savings.allocated;
  const plannedPercent = totalIncome > 0 ? Math.min(Math.round((totalBudgetAllocated / totalIncome) * 100), 100) : 0;

  return (
    <>
      <div className="section-actions" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px' }}>
        <div className="month-picker" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#fff', border: '1px solid #D0D5DD', borderRadius: '8px' }}>
          <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Previous month">
            <Icon name="chevron" size={16} />
          </button>
          <strong style={{ fontSize: '0.9rem', color: '#344054', minWidth: '100px', textAlign: 'center' }}>{formattedMonthLabel}</strong>
          <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Next month">
            <Icon name="chevron" size={16}  style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </div>

      <section className="stats-grid">
        <StatCard
          label="Net Balance"
          amount={`$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={totalBalance >= 0 ? "Positive" : "Negative"}
          icon="wallet"
          color="#526DE2"
          bg="#EDF0FF"
        />
        <StatCard
          label={`Income (${formattedMonthLabel})`}
          amount={`$${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend="Real data"
          icon="arrowDown"
          color="#299D70"
          bg="#E8F7F1"
        />
        <StatCard
          label={`Expenses (${formattedMonthLabel})`}
          amount={`$${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend="Real data"
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
              <p>A balanced way to put your budget to work for {formattedMonthLabel}.</p>
            </div>
            <button type="button" onClick={() => setPage("budgets")}>
              <Icon name="dots" />
            </button>
          </div>
          <div className="rule-total">
            <div>
              <span>Allocated this month</span>
              <strong>
                ${totalBudgetAllocated.toLocaleString()} <small>of ${totalIncome > 0 ? totalIncome.toLocaleString() : totalBudgetAllocated.toLocaleString()}</small>
              </strong>
            </div>
            <div className="donut">
              <span>
                {plannedPercent}%<small>planned</small>
              </span>
            </div>
          </div>
          <div className="rule-items">
            {[
              ["Needs", "Essentials & bills", 50, groupAllocations.Needs.allocated, groupAllocations.Needs.target || totalBudgetAllocated * 0.5, "#5B8DEF"],
              ["Wants", "Lifestyle & fun", 30, groupAllocations.Wants.allocated, groupAllocations.Wants.target || totalBudgetAllocated * 0.3, "#9874DE"],
              ["Savings", "Future & goals", 20, groupAllocations.Savings.allocated, groupAllocations.Savings.target || totalBudgetAllocated * 0.2, "#2EA879"],
            ].map(([name, sub, pct, allocated, target, color]) => {
              const allocNum = Number(allocated);
              const targetNum = Number(target);
              const progressWidth = targetNum > 0 ? Math.min(Math.round((allocNum / targetNum) * 100), 100) : 0;
              const isOver = allocNum > targetNum && targetNum > 0;
              const diff = Math.abs(allocNum - targetNum);

              return (
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
                    <span style={{ width: `${progressWidth}%`, background: isOver ? "#E06A4E" : (color as string) }} />
                  </div>
                  <div className="rule-numbers" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#667085' }}>
                      ${allocNum.toLocaleString()} allocated (Target: ${targetNum.toLocaleString()})
                    </span>
                    <strong style={{ color: isOver ? "#D95E44" : "#039855" }}>
                      {targetNum === 0 
                        ? "No target" 
                        : isOver 
                        ? `$${diff.toLocaleString()} over` 
                        : `$${diff.toLocaleString()} left`}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card spending-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">SPENDING</span>
              <h2>Expense snapshot</h2>
            </div>
            <span style={{ fontSize: '0.875rem', color: '#667085', fontWeight: 500 }}>
              {formattedMonthLabel}
            </span>
          </div>
          <div className="spend-total">
            <span>Total spent</span>
            <strong>${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <small>
              <b>Active budgets:</b> {monthBudgets.length} | <b>Goals:</b> {goals.length}
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
            <p>Latest activity for {formattedMonthLabel}.</p>
          </div>
          <button className="text-btn" onClick={() => setPage("transactions")} type="button">
            View all <Icon name="chevron" size={15} />
          </button>
        </div>
        {loadingTx ? (
          <p style={{ padding: '1rem', color: '#666' }}>Loading recent transactions...</p>
        ) : monthTransactions.length > 0 ? (
          <TransactionRows rows={monthTransactions.slice(0, 5)} compact />
        ) : (
          <p style={{ padding: '1.5rem', color: '#667085', textAlign: 'center' }}>No transactions recorded for {formattedMonthLabel}.</p>
        )}
      </section>
    </>
  );
};