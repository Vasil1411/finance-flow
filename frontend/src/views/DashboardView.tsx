import React, { useState, useMemo } from 'react';
import { StatCard } from '../components/StatCard';
import { TransactionRows } from '../components/TransactionRows';
import { BudgetRuleCard } from '../components/BudgetRuleCard';
import { MonthPicker, formatMonthLabel } from '../components/MonthPicker';
import { Icon } from '../components/Icon';
import { useGetTransactionsQuery } from '../services/transactionsApi';
import { useGetBudgetsQuery } from '../services/budgetsApi';
import { useGetCategoriesQuery } from '../services/categoriesApi';
import { useGetSavingGoalsQuery } from '../services/savingGoalsApi';

interface DashboardViewProps {
  setPage: (p: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setPage }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const formattedMonthLabel = formatMonthLabel(currentDate);

  const { data: transactions = [], isLoading: loadingTx } = useGetTransactionsQuery();
  const { data: budgets = [] } = useGetBudgetsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: goals = [] } = useGetSavingGoalsQuery();

  const monthTransactions = useMemo(() => {
    return transactions.filter((t: any) => t.date && t.date.startsWith(currentDate));
  }, [transactions, currentDate]);

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

  const totalBudgetAllocated =
    groupAllocations.Needs.allocated + groupAllocations.Wants.allocated + groupAllocations.Savings.allocated;
  const plannedPercent = totalIncome > 0 ? Math.min(Math.round((totalBudgetAllocated / totalIncome) * 100), 100) : 0;

  return (
    <>
      <div
        className="section-actions"
        style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px' }}
      >
        <MonthPicker currentDate={currentDate} onChange={setCurrentDate} variant="default" />
      </div>

      <section className="stats-grid">
        <StatCard
          label="Net Balance"
          amount={`€${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={totalBalance >= 0 ? "Positive" : "Negative"}
          icon="wallet"
          color="#526DE2"
          bg="#EDF0FF"
        />
        <StatCard
          label={`Income (${formattedMonthLabel})`}
          amount={`€${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend="Real data"
          icon="arrowDown"
          color="#299D70"
          bg="#E8F7F1"
        />
        <StatCard
          label={`Expenses (${formattedMonthLabel})`}
          amount={`€${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend="Real data"
          icon="arrowUp"
          color="#DF7451"
          bg="#FFF0EA"
        />
      </section>

      <section className="dashboard-grid">
        <BudgetRuleCard
          formattedMonthLabel={formattedMonthLabel}
          totalBudgetAllocated={totalBudgetAllocated}
          totalIncome={totalIncome}
          plannedPercent={plannedPercent}
          groupAllocations={groupAllocations}
          onOpenBudgets={() => setPage("budgets")}
        />

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
            <strong>€{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
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
          <p style={{ padding: '1.5rem', color: '#667085', textAlign: 'center' }}>
            No transactions recorded for {formattedMonthLabel}.
          </p>
        )}
      </section>
    </>
  );
};