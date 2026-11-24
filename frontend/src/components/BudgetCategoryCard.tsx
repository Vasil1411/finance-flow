import React from 'react';
import { Icon } from './Icon';
import type { Category } from '../types/transaction';
import type { Budget } from '../types/budget';

export const categoriesConfig: Record<string, { color: string; bg: string; icon: string }> = {
  Housing: { color: "#6681D9", bg: "#ECF0FF", icon: "H" },
  Groceries: { color: "#E17A4A", bg: "#FFF1E9", icon: "G" },
  Transport: { color: "#8A6FD1", bg: "#F2EDFF", icon: "T" },
  Entertainment: { color: "#D39532", bg: "#FFF5DE", icon: "E" },
  Shopping: { color: "#E05A78", bg: "#FFECF1", icon: "B" },
  "Emergency fund": { color: "#2A9D70", bg: "#E8F7F1", icon: "F" },
  Rent: { color: "#6681D9", bg: "#ECF0FF", icon: "R" },
  Disco: { color: "#9855F7", bg: "#F4ECFF", icon: "D" },
};

interface BudgetCategoryCardProps {
  category: Category;
  matchedBudget?: Budget;
  amountTotal: number;
  formattedMonthLabel: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onEditBudget: () => void;
  onEditCategory: () => void;
  onDeleteBudget: () => void;
  onDeleteCategory: () => void;
}

export const BudgetCategoryCard: React.FC<BudgetCategoryCardProps> = ({
  category,
  matchedBudget,
  amountTotal,
  formattedMonthLabel,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onEditBudget,
  onEditCategory,
  onDeleteBudget,
  onDeleteCategory,
}) => {
  const isIncome = category.type?.toUpperCase() === 'INCOME';
  const budgetLimit = matchedBudget ? Number(matchedBudget.amount) : 0;
  const percent = budgetLimit > 0 ? Math.round((amountTotal / budgetLimit) * 100) : 0;

  const catStyle = categoriesConfig[category.name] || {
    color: isIncome ? "#17B26A" : "#516CE5",
    bg: isIncome ? "#ECFDF3" : "#EDF0FF",
    icon: category.name[0]?.toUpperCase() || "C",
  };

  const allocUpper = (category.allocation_type || "NEED").toUpperCase();
  const typeLabel = isIncome
    ? 'INCOME'
    : allocUpper.includes('WANT')
    ? 'WANT'
    : allocUpper.includes('SAVING')
    ? 'SAVINGS'
    : 'NEED';

  const badgeStyles = isIncome
    ? { color: '#039855', bg: '#ECFDF3' }
    : typeLabel === 'WANT'
    ? { color: '#7F56D9', bg: '#F4EBFF' }
    : typeLabel === 'SAVINGS'
    ? { color: '#039855', bg: '#ECFDF3' }
    : { color: '#3538CD', bg: '#EEF4FF' };

  return (
    <article className="card budget-card" style={{ position: 'relative' }}>
      <div className="budget-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="category-icon"
            style={{
              color: catStyle.color,
              background: catStyle.bg,
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            }}
          >
            {catStyle.icon}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              color: badgeStyles.color,
              background: badgeStyles.bg,
            }}
          >
            {typeLabel}
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={onToggleMenu}
            title="Options"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
          >
            <Icon name="dots" />
          </button>

          {isMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '28px',
                background: '#fff',
                boxShadow: '0px 10px 24px rgba(16, 24, 40, 0.1)',
                borderRadius: '10px',
                padding: '6px',
                zIndex: 10,
                minWidth: '150px',
                border: '1px solid #EAECF0',
              }}
            >
              {!isIncome && (
                <button
                  type="button"
                  onClick={() => {
                    onCloseMenu();
                    onEditBudget();
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    color: '#344054',
                    borderRadius: '6px',
                  }}
                >
                  {matchedBudget ? "Edit budget" : "Set budget"}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onCloseMenu();
                  onEditCategory();
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: '#344054',
                  borderRadius: '6px',
                }}
              >
                Edit category
              </button>

              {!isIncome && matchedBudget && (
                <button
                  type="button"
                  onClick={() => {
                    onCloseMenu();
                    onDeleteBudget();
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    color: '#D95E44',
                    borderRadius: '6px',
                  }}
                >
                  Delete budget
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onCloseMenu();
                  onDeleteCategory();
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: '#D95E44',
                  borderRadius: '6px',
                }}
              >
                Delete category
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 style={{ marginTop: '12px', fontSize: '1.1rem', fontWeight: 600, color: '#1D2939' }}>{category.name}</h3>

      {isIncome ? (
        <>
          <div className="budget-value" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
            <strong style={{ fontSize: '1.35rem', fontWeight: 700, color: '#039855' }}>
              +€{amountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
            <span style={{ fontSize: '0.9rem', color: '#667085' }}>received</span>
          </div>
          <div className="progress" style={{ margin: '12px 0 8px 0', background: '#ECFDF3', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: amountTotal > 0 ? '100%' : '0%', background: '#17B26A', borderRadius: '4px' }} />
          </div>
          <div className="budget-status" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: '#667085', fontWeight: 500 }}>Income category</span>
            <strong style={{ color: '#039855' }}>{formattedMonthLabel}</strong>
          </div>
        </>
      ) : (
        <>
          <div className="budget-value" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
            <strong style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1D2939' }}>
              €{amountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
            <span style={{ fontSize: '0.9rem', color: '#667085' }}>
              of €{budgetLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="progress" style={{ margin: '12px 0 8px 0', background: '#EAECF0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <span
              style={{
                display: 'block',
                height: '100%',
                width: `${Math.min(percent, 100)}%`,
                background: percent > 100 ? "#E06A4E" : catStyle.color,
                borderRadius: '4px',
              }}
            />
          </div>

          <div className="budget-status" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: percent > 100 ? "#D95E44" : "#667085", fontWeight: 500 }}>{percent}% used</span>
            <strong style={{ color: percent > 100 ? "#D95E44" : "#344054" }}>
              {percent > 100 ? `€${(amountTotal - budgetLimit).toLocaleString()} over` : `€${(budgetLimit - amountTotal).toLocaleString()} left`}
            </strong>
          </div>
        </>
      )}
    </article>
  );
};