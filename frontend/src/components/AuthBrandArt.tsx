// src/components/AuthBrandArt.tsx
import React from 'react';
import { Logo } from './UI';
import { Icon } from './Icon';

export const AuthBrandArt: React.FC = () => {
  return (
    <div className="auth-brand">
      <Logo />
      <div className="auth-art">
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="art-card balance-card">
          <div className="art-label">
            <span>Available balance</span>
            <span className="mini-icon">
              <Icon name="wallet" size={16} />
            </span>
          </div>
          <strong>$24,680.50</strong>
          <span className="art-up">
            <Icon name="arrowUp" size={12} /> 12.8% this month
          </span>
        </div>
        <div className="art-card chart-card">
          <div className="chart-head">
            <div>
              <span>Cash flow</span>
              <strong>$8,420</strong>
            </div>
            <span className="chart-pill">May</span>
          </div>
          <div className="chart-bars">
            {[38, 61, 47, 78, 55, 88, 70].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} className={i === 5 ? "active" : ""} />
            ))}
          </div>
        </div>
        <div className="art-caption">
          <h2>Your money, beautifully organized.</h2>
          <p>
            Build better habits, reach your goals, and feel confident about every financial
            decision.
          </p>
        </div>
      </div>
    </div>
  );
};