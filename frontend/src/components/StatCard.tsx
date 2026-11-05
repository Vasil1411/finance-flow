import React from 'react';
import { Icon } from './Icon';
import type { IconName } from '../types/icons';

interface StatCardProps {
  label: string;
  amount: string;
  trend: string;
  icon: IconName;
  color: string;
  bg: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, amount, trend, icon, color, bg }) => {
  return (
    <div className="stat-card card">
      <div className="stat-top">
        <span className="stat-icon" style={{ color, background: bg }}>
          <Icon name={icon} />
        </span>
        <button type="button">
          <Icon name="dots" />
        </button>
      </div>
      <span className="stat-label">{label}</span>
      <strong>{amount}</strong>
      <span className="trend" style={{ color }}>
        <Icon name={trend.startsWith("+") ? "arrowUp" : "arrowDown"} size={13} /> {trend}{" "}
        <em>vs last month</em>
      </span>
    </div>
  );
};