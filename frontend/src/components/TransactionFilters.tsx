import React from 'react';
import { Icon } from './Icon';
import { MonthPicker } from './MonthPicker';

interface TransactionFiltersProps {
  query: string;
  onQueryChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  type: string;
  onTypeChange: (val: string) => void;
  currentDate: string;
  onDateChange: (val: string) => void;
  categories: Array<{ id: number; name: string }>;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  type,
  onTypeChange,
  currentDate,
  onDateChange,
  categories,
}) => {
  return (
    <div className="filters">
      <div className="search-box">
        <Icon name="search" size={18} />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search transactions..."
        />
      </div>
      <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
        <option>All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <select value={type} onChange={(e) => onTypeChange(e.target.value)}>
        <option>All types</option>
        <option value="INCOME">Income</option>
        <option value="EXPENSE">Expense</option>
      </select>
      <MonthPicker currentDate={currentDate} onChange={onDateChange} />
    </div>
  );
};