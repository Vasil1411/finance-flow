import React from 'react';
import { Icon } from './Icon';

interface MonthPickerProps {
  currentDate: string; // "YYYY-MM"
  onChange: (nextDate: string) => void;
  variant?: 'default' | 'subtle';
}

export const formatMonthLabel = (yearMonth: string): string =>
  new Date(`${yearMonth}-01`).toLocaleString('en-US', { month: 'long', year: 'numeric' });

export const MonthPicker: React.FC<MonthPickerProps> = ({
  currentDate,
  onChange,
  variant = 'subtle',
}) => {
  const handlePrevMonth = () => {
    const [year, month] = currentDate.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentDate.split('-').map(Number);
    const date = new Date(year, month, 1);
    onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div
      className="month-picker"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        background: variant === 'subtle' ? '#F9FAFB' : '#fff',
        border: '1px solid #D0D5DD',
        borderRadius: '8px',
      }}
    >
      <button
        type="button"
        onClick={handlePrevMonth}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        title="Previous month"
      >
        <Icon name="chevron" size={16} />
      </button>
      <strong style={{ fontSize: '0.9rem', color: '#344054', minWidth: '90px', textAlign: 'center' }}>
        {formatMonthLabel(currentDate)}
      </strong>
      <button
        type="button"
        onClick={handleNextMonth}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        title="Next month"
      >
        <Icon name="chevron" size={16} style={{ transform: 'rotate(180deg)' }} />
      </button>
    </div>
  );
};