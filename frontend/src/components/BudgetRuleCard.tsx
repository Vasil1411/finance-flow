import React from 'react';
import { Icon } from './Icon';

interface GroupAllocation {
  allocated: number;
  target: number;
}

interface BudgetRuleCardProps {
  formattedMonthLabel: string;
  totalBudgetAllocated: number;
  totalIncome: number;
  plannedPercent: number;
  groupAllocations: {
    Needs: GroupAllocation;
    Wants: GroupAllocation;
    Savings: GroupAllocation;
  };
  onOpenBudgets: () => void;
}

export const BudgetRuleCard: React.FC<BudgetRuleCardProps> = ({
  formattedMonthLabel,
  totalBudgetAllocated,
  totalIncome,
  plannedPercent,
  groupAllocations,
  onOpenBudgets,
}) => {
  const ruleRows: Array<[string, string, number, number, number, string]> = [
    [
      'Needs',
      'Essentials & bills',
      50,
      groupAllocations.Needs.allocated,
      groupAllocations.Needs.target || totalBudgetAllocated * 0.5,
      '#5B8DEF',
    ],
    [
      'Wants',
      'Lifestyle & fun',
      30,
      groupAllocations.Wants.allocated,
      groupAllocations.Wants.target || totalBudgetAllocated * 0.3,
      '#9874DE',
    ],
    [
      'Savings',
      'Future & goals',
      20,
      groupAllocations.Savings.allocated,
      groupAllocations.Savings.target || totalBudgetAllocated * 0.2,
      '#2EA879',
    ],
  ];

  return (
    <div className="card budget-rule">
      <div className="card-heading">
        <div>
          <span className="eyebrow">MONTHLY PLAN</span>
          <h2>50 / 30 / 20 budget rule</h2>
          <p>A balanced way to put your budget to work for {formattedMonthLabel}.</p>
        </div>
        <button type="button" onClick={onOpenBudgets}>
          <Icon name="dots" />
        </button>
      </div>

      <div className="rule-total">
        <div>
          <span>Allocated this month</span>
          <strong>
            €{totalBudgetAllocated.toLocaleString()}{' '}
            <small>
              of €{totalIncome > 0 ? totalIncome.toLocaleString() : totalBudgetAllocated.toLocaleString()}
            </small>
          </strong>
        </div>
        <div className="donut">
          <span>
            {plannedPercent}%<small>planned</small>
          </span>
        </div>
      </div>

      <div className="rule-items">
        {ruleRows.map(([name, sub, pct, allocated, target, color]) => {
          const allocNum = Number(allocated);
          const targetNum = Number(target);
          const progressWidth = targetNum > 0 ? Math.min(Math.round((allocNum / targetNum) * 100), 100) : 0;
          const isOver = allocNum > targetNum && targetNum > 0;
          const diff = Math.abs(allocNum - targetNum);

          return (
            <div className="rule-item" key={name}>
              <div className="rule-line">
                <div>
                  <i style={{ background: color }} />
                  <strong>{name}</strong>
                  <span>{sub}</span>
                </div>
                <b>{pct}%</b>
              </div>
              <div className="progress">
                <span style={{ width: `${progressWidth}%`, background: isOver ? '#E06A4E' : color }} />
              </div>
              <div
                className="rule-numbers"
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
              >
                <span style={{ color: '#667085' }}>
                  €{allocNum.toLocaleString()} allocated (Target: €{targetNum.toLocaleString()})
                </span>
                <strong style={{ color: isOver ? '#D95E44' : '#039855' }}>
                  {targetNum === 0
                    ? 'No target'
                    : isOver
                    ? `€${diff.toLocaleString()} over`
                    : `€${diff.toLocaleString()} left`}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};