import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { useGetTransactionsQuery } from '../services/transactionsApi';

interface MonthlyPoint {
  monthKey: string; // YYYY-MM
  label: string;    // Jan, Feb...
  income: number;
  expense: number;
  net: number;
  hasActivity: boolean;
  momExpenseDiff: number | null;
  momExpensePct: number | null;
}

interface ItemStat {
  name: string;
  totalAmount: number;
  totalQuantity: number;
  occurrences: number;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function roundTo3(num: number): number {
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

function formatQty3(num: number): string {
  const rounded = roundTo3(num);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/\.?0+$/, '');
}

function formatEuro(val: number): string {
  return `€${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const AnalyticsView: React.FC = () => {
  const { data: transactions = [], isLoading, error } = useGetTransactionsQuery();
  const [selectedYear, setSelectedYear] = useState<string>(() => String(new Date().getFullYear()));
  const [itemSearch, setItemSearch] = useState<string>('');
  const [exportScope, setExportScope] = useState<'year' | 'all'>('year');
  const [onlyActiveMonths, setOnlyActiveMonths] = useState<boolean>(false);

  const availableYears = useMemo(() => {
    const set = new Set<string>([String(new Date().getFullYear()), selectedYear]);
    transactions.forEach((t: any) => {
      if (typeof t.date === 'string' && t.date.length >= 4) {
        set.add(t.date.slice(0, 4));
      }
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [transactions, selectedYear]);

  const yearTransactions = useMemo(() => {
    return transactions.filter((t: any) => typeof t.date === 'string' && t.date.startsWith(`${selectedYear}-`));
  }, [transactions, selectedYear]);

  const monthlySeries = useMemo<MonthlyPoint[]>(() => {
    const rawMonths = MONTH_SHORT.map((label, idx) => {
      const mm = String(idx + 1).padStart(2, '0');
      const monthKey = `${selectedYear}-${mm}`;
      let income = 0;
      let expense = 0;
      let txCount = 0;

      yearTransactions.forEach((t: any) => {
        if (typeof t.date === 'string' && t.date.startsWith(monthKey)) {
          const amt = Number(t.amount || 0);
          txCount += 1;
          if (t.type?.toUpperCase() === 'INCOME') income += amt;
          else if (t.type?.toUpperCase() === 'EXPENSE') expense += amt;
        }
      });

      return {
        monthKey,
        label,
        income,
        expense,
        net: income - expense,
        hasActivity: txCount > 0 || income > 0 || expense > 0,
      };
    });

    return rawMonths.map((item, index) => {
      if (index === 0) {
        return { ...item, momExpenseDiff: null, momExpensePct: null };
      }
      const prev = rawMonths[index - 1];
      const diff = item.expense - prev.expense;
      const pct = prev.expense > 0 ? (diff / prev.expense) * 100 : null;
      return {
        ...item,
        momExpenseDiff: diff,
        momExpensePct: pct,
      };
    });
  }, [yearTransactions, selectedYear]);

  const visibleMonths = useMemo(() => {
    if (!onlyActiveMonths) return monthlySeries;
    return monthlySeries.filter((m) => m.hasActivity);
  }, [monthlySeries, onlyActiveMonths]);

  const maxMonthlyExpense = useMemo(() => {
    const maxVal = Math.max(...monthlySeries.map((m) => m.expense), 0);
    return maxVal > 0 ? maxVal : 1;
  }, [monthlySeries]);

  const itemStats = useMemo<ItemStat[]>(() => {
    const map = new Map<string, ItemStat>();

    yearTransactions.forEach((t: any) => {
      if (t.type?.toUpperCase() !== 'EXPENSE') return;
      let parsedItems = t.items;
      if (typeof parsedItems === 'string') {
        try {
          parsedItems = JSON.parse(parsedItems);
        } catch {
          parsedItems = [];
        }
      }
      if (!Array.isArray(parsedItems)) return;

      parsedItems.forEach((rawItem: any) => {
        const cleanName = String(rawItem?.name || '').trim();
        if (!cleanName) return;
        const key = cleanName.toLowerCase();
        const qty = roundTo3(Number(rawItem?.quantity ?? 1) || 1);
        const price = Number(rawItem?.price ?? 0) || 0;
        const lineTotal = roundTo3(price * qty);

        const existing = map.get(key);
        if (existing) {
          existing.totalAmount = roundTo3(existing.totalAmount + lineTotal);
          existing.totalQuantity = roundTo3(existing.totalQuantity + qty);
          existing.occurrences += 1;
        } else {
          map.set(key, {
            name: cleanName,
            totalAmount: lineTotal,
            totalQuantity: qty,
            occurrences: 1,
          });
        }
      });
    });

    const list = Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    if (!itemSearch.trim()) return list;
    const q = itemSearch.trim().toLowerCase();
    return list.filter((i) => i.name.toLowerCase().includes(q));
  }, [yearTransactions, itemSearch]);

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Failed to load analytics data.</div>;
  }

  const totalYearIncome = monthlySeries.reduce((s, m) => s + m.income, 0);
  const totalYearExpense = monthlySeries.reduce((s, m) => s + m.expense, 0);

  return (
    <>
      <div
        className="section-actions analytics-toolbar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div className="analytics-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#475467' }}>
            <span>Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #D0D5DD',
                background: '#fff',
                color: '#101828',
                fontWeight: 500,
              }}
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </label>

          <select
            value={exportScope}
            onChange={(e) => setExportScope(e.target.value as 'year' | 'all')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #D0D5DD',
              background: '#fff',
              color: '#344054',
              fontSize: '0.875rem',
            }}
          >
            <option value="year">Export: Year {selectedYear}</option>
            <option value="all">Export: All-Time</option>
          </select>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.825rem',
              color: '#475467',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={onlyActiveMonths}
              onChange={(e) => setOnlyActiveMonths(e.target.checked)}
            />
            <span>Active months only</span>
          </label>
        </div>
      </div>

      {/* Годишна крива на разходите по месеци */}
      <section className="card analytics-card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div className="card-heading" style={{ marginBottom: '16px' }}>
          <div>
            <span className="eyebrow">MONTHLY CURVE · {selectedYear}</span>
            <h2>Expenses by month ({selectedYear})</h2>
            <p>
              Total Income: <strong style={{ color: '#299D70' }}>{formatEuro(totalYearIncome)}</strong> · Total Expenses:{' '}
              <strong style={{ color: '#DF7451' }}>{formatEuro(totalYearExpense)}</strong>
            </p>
          </div>
        </div>

        <div className="analytics-chart-scroll">
          <div className="analytics-months-grid">
            {monthlySeries.map((m) => {
              const heightPct = m.expense > 0 ? Math.max(Math.round((m.expense / maxMonthlyExpense) * 100), 8) : 2;
              return (
                <div
                  key={m.monthKey}
                  className="analytics-month-col"
                  title={`${m.label} ${selectedYear}: ${formatEuro(m.expense)}`}
                >
                  <span className="analytics-month-val" style={{ color: m.expense > 0 ? '#344054' : '#98A2B3' }}>
                    {m.expense > 0 ? formatEuro(m.expense) : '—'}
                  </span>
                  <div
                    className="analytics-month-bar"
                    style={{
                      height: `${heightPct}%`,
                      background: m.expense > 0 ? '#526DE2' : '#E4E7EC',
                    }}
                  />
                  <span className="analytics-month-label">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* MoM таблица */}
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>MoM Change (Expenses)</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {visibleMonths.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '14px', textAlign: 'center', color: '#667085' }}>
                    No monthly activity recorded for {selectedYear}.
                  </td>
                </tr>
              ) : (
                visibleMonths.map((m) => {
                  const hasPrevExpense = m.momExpenseDiff !== null;
                  const diffVal = m.momExpenseDiff ?? 0;

                  let diffText = '—';
                  let diffColor = '#98A2B3';

                  if (hasPrevExpense) {
                    if (Math.abs(diffVal) < 0.005) {
                      diffText = '€0,00 (0.0%)';
                      diffColor = '#667085';
                    } else if (diffVal > 0) {
                      diffText = `+${formatEuro(diffVal)}${
                        m.momExpensePct !== null ? ` (+${m.momExpensePct.toFixed(1)}%)` : ''
                      }`;
                      diffColor = '#D95E44';
                    } else {
                      diffText = `${formatEuro(diffVal)}${
                        m.momExpensePct !== null ? ` (${m.momExpensePct.toFixed(1)}%)` : ''
                      }`;
                      diffColor = '#299D70';
                    }
                  }

                  return (
                    <tr key={m.monthKey}>
                      <td style={{ fontWeight: 500, color: '#101828' }}>
                        {m.label} {selectedYear}
                      </td>
                      <td style={{ color: m.income > 0 ? '#299D70' : '#667085' }}>{formatEuro(m.income)}</td>
                      <td style={{ color: '#101828' }}>{formatEuro(m.expense)}</td>
                      <td style={{ color: diffColor, fontWeight: 500 }}>{diffText}</td>
                      <td style={{ color: m.net >= 0 ? '#101828' : '#B42318' }}>{formatEuro(m.net)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Статистика по артикули от бележките */}
      <section className="card analytics-card" style={{ padding: '20px' }}>
        <div
          className="card-heading analytics-items-head"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '14px',
          }}
        >
          <div>
            <span className="eyebrow">RECEIPT ITEMS · {selectedYear}</span>
            <h2>Top scanned & recorded items</h2>
            <p>Aggregated from transaction line items in {selectedYear}.</p>
          </div>

          <div className="analytics-item-search">
            <Icon name="search" size={16} />
            <input
              type="text"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Filter item name..."
            />
          </div>
        </div>

        {itemStats.length === 0 ? (
          <p style={{ padding: '1.25rem', color: '#667085', textAlign: 'center' }}>
            No receipt items found for {selectedYear}.
          </p>
        ) : (
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Total Qty</th>
                  <th>Purchases</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {itemStats.slice(0, 20).map((item) => (
                  <tr key={item.name}>
                    <td style={{ fontWeight: 500, color: '#101828' }}>{item.name}</td>
                    <td style={{ color: '#475467' }}>{formatQty3(item.totalQuantity)}</td>
                    <td style={{ color: '#475467' }}>{item.occurrences}</td>
                    <td style={{ fontWeight: 600, color: '#101828' }}>{formatEuro(item.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};