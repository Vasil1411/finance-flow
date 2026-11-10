import React from 'react';
import { Icon } from './Icon';
import type { Transaction } from '../types/transaction';

const categories: Record<string, { color: string; bg: string; icon: string }> = {
  Salary: { color: "#2A9D70", bg: "#E8F7F1", icon: "S" },
  Groceries: { color: "#E17A4A", bg: "#FFF1E9", icon: "G" },
  Housing: { color: "#6681D9", bg: "#ECF0FF", icon: "H" },
  Transport: { color: "#8A6FD1", bg: "#F2EDFF", icon: "T" },
  Shopping: { color: "#E05A78", bg: "#FFECF1", icon: "B" },
  Freelance: { color: "#2A9D70", bg: "#E8F7F1", icon: "F" },
  Entertainment: { color: "#D39532", bg: "#FFF5DE", icon: "E" },
  Utilities: { color: "#4A91C7", bg: "#EAF5FC", icon: "U" },
};

interface TransactionRowsProps {
  rows: Transaction[];
  compact?: boolean;
  onEdit?: (t: Transaction) => void;
}

export const TransactionRows: React.FC<TransactionRowsProps> = ({ rows, compact = false, onEdit }) => {
  return (
    <div className="transaction-table">
      <div className="table-head">
        <span>TRANSACTION</span>
        <span>CATEGORY</span>
        <span>DATE</span>
        <span>AMOUNT</span>
        {!compact && <span />}
      </div>
      {rows.map((t) => {
        // Използваме category_name ако го има от бекенда, или го третираме като string/fallback
        const categoryName = t.category_name || "Shopping";
        const cat = categories[categoryName] || categories.Shopping;

        return (
          <div className="transaction-row" key={t.id}>
            <div className="transaction-name">
              <span className="category-icon" style={{ color: cat.color, background: cat.bg }}>
                {cat.icon}
              </span>
              <div>
                <strong>{t.description || "Untitled transaction"}</strong>
                <small>{t.type}</small>
              </div>
            </div>
            <span>
              <b className="category-badge" style={{ color: cat.color, background: cat.bg }}>
                {categoryName}
              </b>
            </span>
            <span className="date">{t.date}</span>
            <strong className={t.type === "INCOME" ? "income" : "expense"}>
              {t.type === "INCOME" ? "+" : "-"}$
              {Math.abs(t.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </strong>
            {!compact && (
              <button className="row-menu" onClick={() => onEdit?.(t)} type="button">
                <Icon name="edit" size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};