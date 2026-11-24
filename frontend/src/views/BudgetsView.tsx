import React, { useState } from 'react';
import { Button } from '../components/UI';
import { MonthPicker, formatMonthLabel } from '../components/MonthPicker';
import { BudgetCategoryCard } from '../components/BudgetCategoryCard';
import { useGetCategoriesQuery, useDeleteCategoryMutation } from '../services/categoriesApi';
import {
  useGetBudgetsQuery,
  useGetBudgetSummaryQuery,
  useDeleteBudgetMutation,
} from '../services/budgetsApi';
import { useGetTransactionsQuery } from '../services/transactionsApi';
import { CategoryModal } from '../components/CategoryModal';
import { BudgetModal } from '../components/BudgetModal';
import type { Category } from '../types/transaction';
import type { Budget } from '../types/budget';

export const BudgetsView: React.FC = () => {
  const [active, setActive] = useState('All');

  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'budget' | 'category';
    id: number;
    name: string;
  } | null>(null);

  const {
    data: categories = [],
    isLoading: loadingCategories,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();
  const {
    data: budgets = [],
    isLoading: loadingBudgets,
    refetch: refetchBudgets,
  } = useGetBudgetsQuery();
  const { data: transactions = [] } = useGetTransactionsQuery();
  const { data: summary, refetch: refetchSummary } = useGetBudgetSummaryQuery(currentDate);

  const [deleteBudget] = useDeleteBudgetMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const formattedMonthLabel = formatMonthLabel(currentDate);

  const validCategories = categories.filter((c: Category) => {
    const typeUpper = c.type?.toUpperCase();
    const isValidType = typeUpper === 'EXPENSE' || typeUpper === 'INCOME';
    const nameUpper = (c.name || '').toUpperCase();
    const isPhantomGroup = nameUpper === 'NEEDS' || nameUpper === 'WANTS' || nameUpper === 'SAVINGS';
    return isValidType && !isPhantomGroup;
  });

  const visibleCategories = validCategories.filter((c: Category) => {
    const isIncome = c.type?.toUpperCase() === 'INCOME';
    if (active === 'All') return true;
    if (active === 'Income') return isIncome;

    if (isIncome) return false;
    const alloc = (c.allocation_type || '').toUpperCase();
    if (active === 'Needs') return alloc.includes('NEED');
    if (active === 'Wants') return alloc.includes('WANT');
    if (active === 'Savings') return alloc.includes('SAVING') || alloc.includes('SAVINGS');
    return true;
  });

  const currentMonthBudgets = budgets.filter((b: Budget) => b.month && b.month.startsWith(currentDate));
  const currentMonthTransactions = transactions.filter(
    (t: any) => t.date && t.date.startsWith(currentDate)
  );

  // Използваме сметките от бекенда (`budgets/summary/`), когато са налични
  const summaryByCategoryId = new Map(
    (summary?.budgets || []).map((item) => [item.category_id, item])
  );

  const totalSpentAll =
    summary?.totals?.total_spent_in_budgets !== undefined
      ? Number(summary.totals.total_spent_in_budgets)
      : currentMonthBudgets.reduce((sum, b) => {
          const spent = currentMonthTransactions
            .filter(
              (t: any) => t.category === b.category && t.type?.toUpperCase() === 'EXPENSE'
            )
            .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
          return sum + spent;
        }, 0);

  const totalBudgetLimitAll =
    summary?.totals?.total_budgeted !== undefined
      ? Number(summary.totals.total_budgeted)
      : currentMonthBudgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const remainingBudgetAll =
    summary?.totals?.total_remaining_in_budgets !== undefined
      ? Number(summary.totals.total_remaining_in_budgets)
      : totalBudgetLimitAll - totalSpentAll;

  const groupTotals = {
    Needs: {
      spent: summary?.rule_50_30_20?.needs ? Number(summary.rule_50_30_20.needs.amount) : 0,
      limit: 0,
    },
    Wants: {
      spent: summary?.rule_50_30_20?.wants ? Number(summary.rule_50_30_20.wants.amount) : 0,
      limit: 0,
    },
    Savings: {
      spent: summary?.rule_50_30_20?.savings ? Number(summary.rule_50_30_20.savings.amount) : 0,
      limit: 0,
    },
  };

  validCategories
    .filter((cat: Category) => cat.type?.toUpperCase() === 'EXPENSE')
    .forEach((cat: Category) => {
      const matchedBudget = currentMonthBudgets.find((b: Budget) => b.category === cat.id);
      const budgetLimit = matchedBudget ? Number(matchedBudget.amount) : 0;
      const alloc = (cat.allocation_type || '').toUpperCase();

      if (alloc.includes('NEED')) {
        groupTotals.Needs.limit += budgetLimit;
        if (!summary?.rule_50_30_20?.needs) {
          groupTotals.Needs.spent += summaryByCategoryId.get(cat.id)
            ? Number(summaryByCategoryId.get(cat.id)!.spent_amount)
            : 0;
        }
      } else if (alloc.includes('WANT')) {
        groupTotals.Wants.limit += budgetLimit;
        if (!summary?.rule_50_30_20?.wants) {
          groupTotals.Wants.spent += summaryByCategoryId.get(cat.id)
            ? Number(summaryByCategoryId.get(cat.id)!.spent_amount)
            : 0;
        }
      } else if (alloc.includes('SAVING')) {
        groupTotals.Savings.limit += budgetLimit;
        if (!summary?.rule_50_30_20?.savings) {
          groupTotals.Savings.spent += summaryByCategoryId.get(cat.id)
            ? Number(summaryByCategoryId.get(cat.id)!.spent_amount)
            : 0;
        }
      }
    });

  const overallPercent =
    totalBudgetLimitAll > 0 ? Math.round((totalSpentAll / totalBudgetLimitAll) * 100) : 0;

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    try {
      if (deleteConfirmTarget.type === 'budget') {
        await deleteBudget(deleteConfirmTarget.id).unwrap();
        refetchBudgets();
        refetchSummary();
      } else {
        await deleteCategory(deleteConfirmTarget.id).unwrap();
        refetchCategories();
        refetchBudgets();
        refetchSummary();
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleteConfirmTarget(null);
    }
  };

  if (loadingCategories || loadingBudgets) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading budgets & categories...</div>;
  }

  return (
    <>
      <div className="section-actions">
        <MonthPicker currentDate={currentDate} onChange={setCurrentDate} variant="default" />
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedCategory(null);
              setIsCategoryModalOpen(true);
            }}
          >
            + New Category
          </Button>
          <Button
            icon="plus"
            onClick={() => {
              setSelectedBudget(null);
              setIsBudgetModalOpen(true);
            }}
          >
            Create budget
          </Button>
        </div>
      </div>

      <section
        className="budget-summary-grid"
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'stretch' }}
      >
        <div
          className="card overall-budget"
          style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div className="card-heading">
            <div>
              <span className="eyebrow">TOTAL MONTHLY BUDGET</span>
              <h2>
                €{totalSpentAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <small>
                  of €
                  {totalBudgetLimitAll.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </small>
              </h2>
            </div>
            <div className="budget-ring">
              <span>{overallPercent}%</span>
            </div>
          </div>
          <div className="progress" style={{ margin: '16px 0' }}>
            <span style={{ width: `${Math.min(overallPercent, 100)}%`, background: '#516CE5' }} />
          </div>
          <div
            className="overall-labels"
            style={{ display: 'flex', justifyContent: 'space-between', color: '#667085', fontSize: '0.875rem' }}
          >
            <span>
              €
              {Math.max(remainingBudgetAll, 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              remaining
            </span>
            <span>{formattedMonthLabel}</span>
          </div>
        </div>

        <div
          className="card"
          style={{
            margin: 0,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#516CE5' }} />
              <span style={{ fontWeight: 500, color: '#344054' }}>Needs</span>
            </div>
            <span style={{ fontWeight: 600, color: '#1D2939' }}>
              €{groupTotals.Needs.spent.toLocaleString()} / €{groupTotals.Needs.limit.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9855F7' }} />
              <span style={{ fontWeight: 500, color: '#344054' }}>Wants</span>
            </div>
            <span style={{ fontWeight: 600, color: '#1D2939' }}>
              €{groupTotals.Wants.spent.toLocaleString()} / €{groupTotals.Wants.limit.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#17B26A' }} />
              <span style={{ fontWeight: 500, color: '#344054' }}>Savings</span>
            </div>
            <span style={{ fontWeight: 600, color: '#1D2939' }}>
              €{groupTotals.Savings.spent.toLocaleString()} / €{groupTotals.Savings.limit.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      <div className="tabs">
        {['All', 'Needs', 'Wants', 'Savings', 'Income'].map((t) => (
          <button
            key={t}
            className={active === t ? 'active' : ''}
            onClick={() => setActive(t)}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>

      <section className="budget-cards">
        {visibleCategories.map((cat: Category) => {
          const isIncome = cat.type?.toUpperCase() === 'INCOME';
          const matchedBudget = isIncome
            ? undefined
            : currentMonthBudgets.find((b: Budget) => b.category === cat.id);
          const summaryItem = !isIncome ? summaryByCategoryId.get(cat.id) : undefined;

          const amountTotal = summaryItem
            ? Number(summaryItem.spent_amount)
            : currentMonthTransactions
                .filter(
                  (t: any) =>
                    (t.category === cat.id || t.category_name === cat.name) &&
                    t.type?.toUpperCase() === (isIncome ? 'INCOME' : 'EXPENSE')
                )
                .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

          return (
            <BudgetCategoryCard
              key={cat.id}
              category={cat}
              matchedBudget={matchedBudget}
              amountTotal={amountTotal}
              formattedMonthLabel={formattedMonthLabel}
              isMenuOpen={openMenuId === cat.id}
              onToggleMenu={() => setOpenMenuId(openMenuId === cat.id ? null : cat.id)}
              onCloseMenu={() => setOpenMenuId(null)}
              onEditBudget={() => {
                setSelectedBudget(
                  matchedBudget || {
                    id: 0,
                    category: cat.id,
                    amount: 0,
                    month: `${currentDate}-01`,
                  }
                );
                setIsBudgetModalOpen(true);
              }}
              onEditCategory={() => {
                setSelectedCategory(cat);
                setIsCategoryModalOpen(true);
              }}
              onDeleteBudget={() => {
                if (matchedBudget) {
                  setDeleteConfirmTarget({ type: 'budget', id: matchedBudget.id, name: cat.name });
                }
              }}
              onDeleteCategory={() =>
                setDeleteConfirmTarget({ type: 'category', id: cat.id, name: cat.name })
              }
            />
          );
        })}
      </section>

      {deleteConfirmTarget !== null && (
        <div className="modal-backdrop" onMouseDown={() => setDeleteConfirmTarget(null)}>
          <div
            className="modal"
            style={{ maxWidth: '400px', padding: '24px' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-head" style={{ marginBottom: '16px' }}>
              <div>
                <span className="eyebrow" style={{ color: '#E06A4E' }}>
                  CONFIRM DELETION
                </span>
                <h2>Delete {deleteConfirmTarget.type === 'budget' ? 'budget' : 'category'}</h2>
                <p style={{ marginTop: '4px', color: '#667085' }}>
                  Are you sure you want to delete{' '}
                  {deleteConfirmTarget.type === 'budget' ? 'the budget for' : 'category'}{' '}
                  <strong>{deleteConfirmTarget.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div
              className="modal-actions"
              style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
            >
              <Button variant="secondary" onClick={() => setDeleteConfirmTarget(null)} type="button">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                style={{ background: '#E06A4E', color: '#fff' }}
                type="button"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setSelectedCategory(null);
          }}
          onSave={() => {
            refetchCategories();
            refetchSummary();
            setIsCategoryModalOpen(false);
            setSelectedCategory(null);
          }}
        />
      )}

      {isBudgetModalOpen && (
        <BudgetModal
          budget={selectedBudget}
          onClose={() => {
            setIsBudgetModalOpen(false);
            setSelectedBudget(null);
          }}
          onSave={() => {
            refetchBudgets();
            refetchSummary();
            setIsBudgetModalOpen(false);
            setSelectedBudget(null);
          }}
        />
      )}
    </>
  );
};