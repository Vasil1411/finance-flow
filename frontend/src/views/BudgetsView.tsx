import React, { useState } from 'react';
import { Button } from '../components/UI';
import { Icon } from '../components/Icon';
import { useGetCategoriesQuery, useDeleteCategoryMutation } from '../services/categoriesApi';
import { useGetBudgetsQuery, useDeleteBudgetMutation } from '../services/budgetsApi';
import { useGetTransactionsQuery } from '../services/transactionsApi';
import { CategoryModal } from '../components/CategoryModal';
import { BudgetModal } from '../components/BudgetModal';
import type { Category } from '../types/transaction';
import type { Budget } from '../types/budget';

const categoriesConfig: Record<string, { color: string; bg: string; icon: string }> = {
  Housing: { color: "#6681D9", bg: "#ECF0FF", icon: "H" },
  Groceries: { color: "#E17A4A", bg: "#FFF1E9", icon: "G" },
  Transport: { color: "#8A6FD1", bg: "#F2EDFF", icon: "T" },
  Entertainment: { color: "#D39532", bg: "#FFF5DE", icon: "E" },
  Shopping: { color: "#E05A78", bg: "#FFECF1", icon: "B" },
  "Emergency fund": { color: "#2A9D70", bg: "#E8F7F1", icon: "F" },
  Rent: { color: "#6681D9", bg: "#ECF0FF", icon: "R" },
  Disco: { color: "#9855F7", bg: "#F4ECFF", icon: "D" },
};

export const BudgetsView: React.FC = () => {
  const [active, setActive] = useState("All");
  
  // Състояние за текущо избрания месец във формат "YYYY-MM" (по подразбиране текущия месец)
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
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ type: 'budget' | 'category', id: number, name: string } | null>(null);

  const { data: categories = [], isLoading: loadingCategories, refetch: refetchCategories } = useGetCategoriesQuery();
  const { data: budgets = [], isLoading: loadingBudgets, refetch: refetchBudgets } = useGetBudgetsQuery();
  const { data: transactions = [] } = useGetTransactionsQuery();
  
  const [deleteBudget] = useDeleteBudgetMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  // Функции за смяна на месеца със стрелките
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

  // Форматиране на месеца за показване (напр. "May 2025")
  const formattedMonthLabel = new Date(`${currentDate}-01`).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Строго филтриране само на разходи и изключване на фантомни групи
  const expenseCategories = categories.filter((c: Category) => {
    const isExpense = c.type?.toUpperCase() === 'EXPENSE';
    const nameUpper = (c.name || "").toUpperCase();
    const isPhantomGroup = nameUpper === 'NEEDS' || nameUpper === 'WANTS' || nameUpper === 'SAVINGS';
    return isExpense && !isPhantomGroup;
  });

  // Филтрация по табове (All, Needs, Wants, Savings)
  const visibleCategories = expenseCategories.filter((c: Category) => {
    if (active === "All") return true;
    const alloc = (c.allocation_type || "").toUpperCase();
    
    if (active === "Needs") return alloc.includes('NEED');
    if (active === "Wants") return alloc.includes('WANT');
    if (active === "Savings") return alloc.includes('SAVING') || alloc.includes('SAVINGS');
    return true;
  });

  // Филтрираме бюджетите за избрания месец (бюджетите обикновено падат на първо число на месеца "YYYY-MM-01")
  const currentMonthBudgets = budgets.filter((b: Budget) => b.month && b.month.startsWith(currentDate));

  // Филтрираме транзакциите за избрания месец (транзакциите са с дата "YYYY-MM-DD")
  const currentMonthTransactions = transactions.filter((t: any) => t.date && t.date.startsWith(currentDate));

  let totalSpentAll = 0;
  let totalBudgetLimitAll = 0;

  const groupTotals = {
    Needs: { spent: 0, limit: 0 },
    Wants: { spent: 0, limit: 0 },
    Savings: { spent: 0, limit: 0 },
  };

  expenseCategories.forEach((cat: Category) => {
    const matchedBudget = currentMonthBudgets.find((b: Budget) => b.category === cat.id);
    const budgetLimit = matchedBudget ? Number(matchedBudget.amount) : 0;
    
    const spent = currentMonthTransactions
      .filter((t: any) => (t.category === cat.id || t.category_name === cat.name) && t.type?.toUpperCase() === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

    totalSpentAll += spent;
    totalBudgetLimitAll += budgetLimit;

    const alloc = (cat.allocation_type || "").toUpperCase();
    if (alloc.includes('NEED')) {
      groupTotals.Needs.spent += spent;
      groupTotals.Needs.limit += budgetLimit;
    } else if (alloc.includes('WANT')) {
      groupTotals.Wants.spent += spent;
      groupTotals.Wants.limit += budgetLimit;
    } else if (alloc.includes('SAVING')) {
      groupTotals.Savings.spent += spent;
      groupTotals.Savings.limit += budgetLimit;
    }
  });

  const overallPercent = totalBudgetLimitAll > 0 ? Math.round((totalSpentAll / totalBudgetLimitAll) * 100) : 0;

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    try {
      if (deleteConfirmTarget.type === 'budget') {
        await deleteBudget(deleteConfirmTarget.id).unwrap();
        refetchBudgets();
      } else {
        await deleteCategory(deleteConfirmTarget.id).unwrap();
        refetchCategories();
        refetchBudgets();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
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
        {/* Динамичен месечен пикер със стрелки */}
        <div className="month-picker">
          <button type="button" onClick={handlePrevMonth} title="Previous month">
            <Icon name="chevron" size={16} />
          </button>
          <strong>{formattedMonthLabel}</strong>
          <button type="button" onClick={handleNextMonth} title="Next month">
            <Icon name="chevron" size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => { setSelectedCategory(null); setIsCategoryModalOpen(true); }}>
            + New Category
          </Button>
          <Button icon="plus" onClick={() => { setSelectedBudget(null); setIsBudgetModalOpen(true); }}>
            Create budget
          </Button>
        </div>
      </div>

      {/* Двуколонена структура за общия бюджет и 50/30/20 панела */}
      <section className="budget-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'stretch' }}>
        <div className="card overall-budget" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="card-heading">
            <div>
              <span className="eyebrow">TOTAL MONTHLY BUDGET</span>
              <h2>
                ${totalSpentAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <small>of ${totalBudgetLimitAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</small>
              </h2>
            </div>
            <div className="budget-ring">
              <span>{overallPercent}%</span>
            </div>
          </div>
          <div className="progress" style={{ margin: '16px 0' }}>
            <span style={{ width: `${Math.min(overallPercent, 100)}%`, background: "#516CE5" }} />
          </div>
          <div className="overall-labels" style={{ display: 'flex', justifyContent: 'space-between', color: '#667085', fontSize: '0.875rem' }}>
            <span>${Math.max(totalBudgetLimitAll - totalSpentAll, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining</span>
            <span>Current month</span>
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#516CE5' }} />
              <span style={{ fontWeight: 500, color: '#344054' }}>Needs</span>
            </div>
            <span style={{ fontWeight: 600, color: '#1D2939' }}>
              ${groupTotals.Needs.spent.toLocaleString()} / ${groupTotals.Needs.limit.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9855F7' }} />
              <span style={{ fontWeight: 500, color: '#344054' }}>Wants</span>
            </div>
            <span style={{ fontWeight: 600, color: '#1D2939' }}>
              ${groupTotals.Wants.spent.toLocaleString()} / ${groupTotals.Wants.limit.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#17B26A' }} />
              <span style={{ fontWeight: 500, color: '#344054' }}>Savings</span>
            </div>
            <span style={{ fontWeight: 600, color: '#1D2939' }}>
              ${groupTotals.Savings.spent.toLocaleString()} / ${groupTotals.Savings.limit.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* Табове за филтриране */}
      <div className="tabs">
        {["All", "Needs", "Wants", "Savings"].map((t) => (
          <button key={t} className={active === t ? "active" : ""} onClick={() => setActive(t)} type="button">
            {t}
          </button>
        ))}
      </div>

      <section className="budget-cards">
        {visibleCategories.map((cat: Category) => {
          const matchedBudget = currentMonthBudgets.find((b: Budget) => b.category === cat.id);
          const budgetLimit = matchedBudget ? Number(matchedBudget.amount) : 0;
          
          const spent = currentMonthTransactions
            .filter((t: any) => (t.category === cat.id || t.category_name === cat.name) && t.type?.toUpperCase() === 'EXPENSE')
            .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

          const percent = budgetLimit > 0 ? Math.round((spent / budgetLimit) * 100) : 0;
          const catStyle = categoriesConfig[cat.name] || { color: "#516CE5", bg: "#EDF0FF", icon: cat.name[0]?.toUpperCase() || "C" };
          
          const allocUpper = (cat.allocation_type || "NEED").toUpperCase();
          const typeLabel = allocUpper.includes('WANT') ? 'WANT' : allocUpper.includes('SAVING') ? 'SAVINGS' : 'NEED';
          
          const badgeStyles = typeLabel === 'WANT' 
            ? { color: '#7F56D9', bg: '#F4EBFF' }
            : typeLabel === 'SAVINGS'
            ? { color: '#039855', bg: '#ECFDF3' }
            : { color: '#3538CD', bg: '#EEF4FF' };

          const isMenuOpen = openMenuId === cat.id;

          return (
            <article className="card budget-card" key={cat.id} style={{ position: 'relative' }}>
              <div className="budget-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="category-icon" style={{ color: catStyle.color, background: catStyle.bg, width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    {catStyle.icon}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', color: badgeStyles.color, background: badgeStyles.bg }}>
                    {typeLabel}
                  </span>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <button 
                    type="button" 
                    onClick={() => setOpenMenuId(isMenuOpen ? null : cat.id)}
                    title="Options"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                  >
                    <Icon name="dots" />
                  </button>

                  {isMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '28px',
                      background: '#fff',
                      boxShadow: '0px 10px 24px rgba(16, 24, 40, 0.1)',
                      borderRadius: '10px',
                      padding: '6px',
                      zIndex: 10,
                      minWidth: '150px',
                      border: '1px solid #EAECF0'
                    }}>
                      <button 
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setSelectedBudget(matchedBudget || { id: 0, category: cat.id, amount: 0, month: `${currentDate}-01` });
                          setIsBudgetModalOpen(true);
                        }}
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 12px', fontSize: '0.875rem', cursor: 'pointer', color: '#344054', borderRadius: '6px' }}
                      >
                        {matchedBudget ? "Edit budget" : "Set budget"}
                      </button>

                      <button 
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setSelectedCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 12px', fontSize: '0.875rem', cursor: 'pointer', color: '#344054', borderRadius: '6px' }}
                      >
                        Edit category
                      </button>

                      {matchedBudget && (
                        <button 
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            setDeleteConfirmTarget({ type: 'budget', id: matchedBudget.id, name: cat.name });
                          }}
                          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 12px', fontSize: '0.875rem', cursor: 'pointer', color: '#D95E44', borderRadius: '6px' }}
                        >
                          Delete budget
                        </button>
                      )}

                      <button 
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setDeleteConfirmTarget({ type: 'category', id: cat.id, name: cat.name });
                        }}
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 12px', fontSize: '0.875rem', cursor: 'pointer', color: '#D95E44', borderRadius: '6px' }}
                      >
                        Delete category
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 style={{ marginTop: '12px', fontSize: '1.1rem', fontWeight: 600, color: '#1D2939' }}>{cat.name}</h3>
              
              <div className="budget-value" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
                <strong style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1D2939' }}>
                  ${spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <span style={{ fontSize: '0.9rem', color: '#667085' }}>
                  of ${budgetLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="progress" style={{ margin: '12px 0 8px 0', background: '#EAECF0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${Math.min(percent, 100)}%`, background: percent > 100 ? "#E06A4E" : catStyle.color, borderRadius: '4px' }} />
              </div>

              <div className="budget-status" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: percent > 100 ? "#D95E44" : "#667085", fontWeight: 500 }}>
                  {percent}% used
                </span>
                <strong style={{ color: percent > 100 ? "#D95E44" : "#344054" }}>
                  {percent > 100 ? `$${(spent - budgetLimit).toLocaleString()} over` : `$${(budgetLimit - spent).toLocaleString()} left`}
                </strong>
              </div>
            </article>
          );
        })}
      </section>

      {/* Вътрешен модал за потвърждение на изтриване */}
      {deleteConfirmTarget !== null && (
        <div className="modal-backdrop" onMouseDown={() => setDeleteConfirmTarget(null)}>
          <div className="modal" style={{ maxWidth: '400px', padding: '24px' }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head" style={{ marginBottom: '16px' }}>
              <div>
                <span className="eyebrow" style={{ color: '#E06A4E' }}>CONFIRM DELETION</span>
                <h2>Delete {deleteConfirmTarget.type === 'budget' ? 'budget' : 'category'}</h2>
                <p style={{ marginTop: '4px', color: '#667085' }}>
                  Are you sure you want to delete {deleteConfirmTarget.type === 'budget' ? 'the budget for' : 'category'} <strong>{deleteConfirmTarget.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
          onClose={() => { setIsCategoryModalOpen(false); setSelectedCategory(null); }}
          onSave={() => { refetchCategories(); setIsCategoryModalOpen(false); setSelectedCategory(null); }}
        />
      )}

      {isBudgetModalOpen && (
        <BudgetModal
          budget={selectedBudget}
          onClose={() => { setIsBudgetModalOpen(false); setSelectedBudget(null); }}
          onSave={() => { refetchBudgets(); setIsBudgetModalOpen(false); setSelectedBudget(null); }}
        />
      )}
    </>
  );
};