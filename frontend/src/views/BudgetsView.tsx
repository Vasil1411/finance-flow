import React, { useState } from 'react';
import { Button } from '../components/UI';
import { Icon } from '../components/Icon';
import { useGetCategoriesQuery } from '../services/categoriesApi';
import { useGetBudgetsQuery } from '../services/budgetsApi';
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
};

export const BudgetsView: React.FC = () => {
  const [active, setActive] = useState("All");
  
  // Състояния за модалите
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Извличаме категориите и бюджетите едновременно от бекенда
  const { data: categories = [], isLoading: loadingCategories, refetch: refetchCategories } = useGetCategoriesQuery();
  const { data: budgets = [], isLoading: loadingBudgets, refetch: refetchBudgets } = useGetBudgetsQuery();

  // Филтриране на категориите спрямо активния таб (All, Needs, Wants, Savings)
  const visibleCategories = active === "All" 
    ? categories 
    : categories.filter((c: Category) => c.allocation_type?.toUpperCase() === active.toUpperCase());

  // Изчисляване на общия бюджет и суми спрямо реалните данни
  const totalBudgetLimit = budgets.reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const totalSpent = 4050; // Тук може да се замени със сумата от реалните транзакции по категории

  if (loadingCategories || loadingBudgets) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading budgets & categories...</div>;
  }

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
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setIsCategoryModalOpen(true)}>
            + New Category
          </Button>
          <Button icon="plus" onClick={() => { setSelectedCategory(null); setIsBudgetModalOpen(true); }}>
            Create budget
          </Button>
        </div>
      </div>

      <section className="budget-summary-grid">
        <div className="card overall-budget">
          <div className="card-heading">
            <div>
              <span className="eyebrow">TOTAL MONTHLY BUDGET</span>
              <h2>
                ${totalSpent.toLocaleString()} <small>of ${totalBudgetLimit.toLocaleString()}</small>
              </h2>
            </div>
            <div className="budget-ring">
              <span>{totalBudgetLimit > 0 ? Math.round((totalSpent / totalBudgetLimit) * 100) : 0}%</span>
            </div>
          </div>
          <div className="progress">
            <span style={{ width: `${Math.min(totalBudgetLimit > 0 ? (totalSpent / totalBudgetLimit) * 100 : 0, 100)}%`, background: "#516CE5" }} />
          </div>
          <div className="overall-labels">
            <span>${Math.abs(totalBudgetLimit - totalSpent)} remaining</span>
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
        {visibleCategories.map((cat: Category) => {
          // Намираме съответния бюджет за тази категория (ако има зададен)
          const matchedBudget = budgets.find((b: Budget) => b.category === cat.id);
          const budgetLimit = matchedBudget ? Number(matchedBudget.amount) : 500; // дефолтен лимит ако няма бюджет
          const spent = 350; // реално оразходвана сума
          const percent = budgetLimit > 0 ? Math.round((spent / budgetLimit) * 100) : 0;
          
          const catStyle = categoriesConfig[cat.name] || categoriesConfig.Shopping;
          const typeLabel = cat.allocation_type || "NEED";

          return (
            <article className="card budget-card" key={cat.id}>
              <div className="budget-card-top">
                <span className="category-icon" style={{ color: catStyle.color, background: catStyle.bg }}>
                  {catStyle.icon}
                </span>
                <span className={`type-badge ${typeLabel.toLowerCase()}`}>{typeLabel}</span>
                <button type="button" onClick={() => { setSelectedCategory(cat); setIsCategoryModalOpen(true); }}>
                  <Icon name="dots" />
                </button>
              </div>
              <h3>{cat.name}</h3>
              <div className="budget-value">
                <strong>${spent.toLocaleString()}</strong>
                <span>of ${budgetLimit.toLocaleString()}</span>
              </div>
              <div className="progress">
                <span style={{ width: `${Math.min(percent, 100)}%`, background: percent > 100 ? "#E06A4E" : catStyle.color }} />
              </div>
              <div className="budget-status">
                <span style={{ color: percent > 100 ? "#D95E44" : "#667085" }}>
                  {percent}% used
                </span>
                <strong>
                  {percent > 100 ? `$${spent - budgetLimit} over` : `$${budgetLimit - spent} left`}
                </strong>
              </div>
            </article>
          );
        })}
      </section>

      {/* Модали за категории и бюджети */}
      {isCategoryModalOpen && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={() => refetchCategories()}
        />
      )}

      {isBudgetModalOpen && (
        <BudgetModal
          onClose={() => setIsBudgetModalOpen(false)}
          onSave={() => refetchBudgets()}
        />
      )}
    </>
  );
};