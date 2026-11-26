import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface YearlyOverviewBannerProps {
  year: string;
  yearlyIncome: number;
  yearlyExpense: number;
  expenseCount: number;

}

const STORAGE_KEY = 'financeflow_show_yearly_banner';

function formatEuro(amount: number): string {
  return `€${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const YearlyOverviewBanner: React.FC<YearlyOverviewBannerProps> = ({
  year,
  yearlyIncome,
  yearlyExpense,
  expenseCount,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isVisible));
    } catch {
      // Игнорираме ограничения на storage в частен режим
    }
  }, [isVisible]);

  const yearlyNet = yearlyIncome - yearlyExpense;

  if (!isVisible) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '12px',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          className="text-btn"
          onClick={() => setIsVisible(true)}
          style={{ fontSize: '0.8rem' }}
        >
          Show {year} annual summary
        </button>
      </div>
    );
  }

  return (
    <section
      className="card"
      style={{
        marginTop: '16px',
        marginBottom: '20px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#F4F3FF',
            color: '#7A5AF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="calendar" size={19} />
        </div>
        <div>
          <span className="eyebrow" style={{ display: 'block', marginBottom: '2px' }}>
            ANNUAL SUMMARY · {year}
          </span>
          <strong style={{ fontSize: '1.1rem', color: '#101828' }}>
            Expenses: {formatEuro(yearlyExpense)}
          </strong>
          <span style={{ display: 'block', fontSize: '0.8rem', color: '#667085', marginTop: '2px' }}>
            {expenseCount} expense {expenseCount === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#667085' }}>Income</span>
          <strong style={{ fontSize: '0.95rem', color: '#299D70' }}>
            {formatEuro(yearlyIncome)}
          </strong>
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#667085' }}>Net</span>
          <strong style={{ fontSize: '0.95rem', color: yearlyNet >= 0 ? '#101828' : '#B42318' }}>
            {formatEuro(yearlyNet)}
          </strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            style={{
              background: 'none',
              border: '1px solid #E4E7EC',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: '#667085',
              cursor: 'pointer',
            }}
          >
            Hide
          </button>
        </div>
      </div>
    </section>
  );
};