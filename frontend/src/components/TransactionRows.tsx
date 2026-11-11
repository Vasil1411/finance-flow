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
  onDelete?: (id: number) => void;
}

export const TransactionRows: React.FC<TransactionRowsProps> = ({ rows, compact = false, onEdit, onDelete }) => {
  return (
    <div className="transaction-table">
      <div className="table-head" style={{ display: 'grid', gridTemplateColumns: compact ? '2fr 1fr 1fr 1fr' : '2fr 1.2fr 1fr 1fr 90px', alignItems: 'center' }}>
        <span>TRANSACTION</span>
        <span>CATEGORY</span>
        <span>DATE</span>
        <span style={{ textAlign: 'right' }}>AMOUNT</span>
        {!compact && <span style={{ textAlign: 'right' }}>ACTIONS</span>}
      </div>
      {rows.map((t) => {
        const categoryName = t.category_name || "Shopping";
        const cat = categories[categoryName] || categories.Shopping;

        return (
          <div 
            className="transaction-row" 
            key={t.id}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: compact ? '2fr 1fr 1fr 1fr' : '2fr 1.2fr 1fr 1fr 90px', 
              alignItems: 'center' 
            }}
          >
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
            <strong className={t.type === "INCOME" ? "income" : "expense"} style={{ textAlign: 'right' }}>
              {t.type === "INCOME" ? "+" : "-"}$
              {Math.abs(t.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </strong>
            {!compact && (
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button 
                  className="row-menu" 
                  onClick={() => onEdit?.(t)} 
                  type="button" 
                  title="Edit transaction"
                >
                  <Icon name="edit" size={16} />
                </button>
                {onDelete && t.id && (
                  <button 
                    className="row-menu delete-btn" 
                    onClick={() => onDelete(t.id)} 
                    type="button" 
                    title="Delete transaction"
                    style={{ color: '#E06A4E' }}
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};