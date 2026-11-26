import React from 'react';
import { MonthPicker } from './MonthPicker';

interface DashboardPeriodBarProps {
  currentDate: string;
  formattedMonthLabel: string;
  selectedYear: string;
  availableYears: string[];
  onChangeMonth: (nextDate: string) => void;
  onChangeYear: (nextYear: string) => void;
}

export const DashboardPeriodBar: React.FC<DashboardPeriodBarProps> = ({
  currentDate,
  formattedMonthLabel,
  selectedYear,
  availableYears,
  onChangeMonth,
  onChangeYear,
}) => {
  return (
    <div
      className="section-actions"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
      }}
    >
      <span style={{ fontSize: '0.875rem', color: '#667085' }}>
        Overview for <strong style={{ color: '#101828' }}>{formattedMonthLabel}</strong>
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid #D0D5DD',
            background: '#fff',
            fontSize: '0.85rem',
            color: '#475467',
          }}
        >
          <span>Year</span>
          <select
            value={selectedYear}
            onChange={(e) => onChangeYear(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#101828',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </label>

        <MonthPicker currentDate={currentDate} onChange={onChangeMonth} variant="default" />
      </div>
    </div>
  );
};