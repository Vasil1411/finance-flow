import React, { type ReactNode, useState } from 'react';
import { Logo } from './UI';
import { Icon } from './Icon';
import type { IconName } from '../types/icons';

const navItems: { id: string; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Overview", icon: "grid" },
  { id: "transactions", label: "Transactions", icon: "swap" },
  { id: "budgets", label: "Budgets & categories", icon: "wallet" },
  { id: "goals", label: "Saving goals", icon: "target" },
];

interface ShellProps {
  page: string;
  setPage: (p: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ page, setPage, onLogout, children }) => {
  const [mobileMenu, setMobileMenu] = useState(false);

  // Извличаме само потребителското име и инициалите от localStorage
  const username = localStorage.getItem("username") || "User";
  const initials = username.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const names: Record<string, [string, string]> = {
    dashboard: [`Good morning, ${username}`, "Here's how your money is doing this month."],
    transactions: ["Transactions", "View and manage all your income and expenses."],
    budgets: ["Budgets & categories", "Stay on track with your monthly spending plan."],
    goals: ["Saving goals", "Turn your plans into progress, one deposit at a time."],
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button className="close-menu" onClick={() => setMobileMenu(false)} type="button">
            <Icon name="close" />
          </button>
        </div>
        <nav>
          <span className="nav-label">MENU</span>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => {
                setPage(item.id);
                setMobileMenu(false);
              }}
              type="button"
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
          <span className="nav-label settings-label">ACCOUNT</span>
          <button type="button">
            <Icon name="settings" />
            <span>Settings</span>
          </button>
        </nav>
        <div className="sidebar-foot">
          <div className="mini-promo">
            <span className="spark">
              <Icon name="target" size={14} />
            </span>
            <strong>Money tip</strong>
            <p>Review your subscriptions monthly to keep expenses lean.</p>
          </div>
          <div className="profile">
            <div className="avatar">{initials}</div>
            <div>
              <strong>{username}</strong>
              {/* Имейлът е премахнат напълно от тук */}
            </div>
            <button onClick={onLogout} title="Sign out" type="button">
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="menu-overlay"
          onClick={() => setMobileMenu(false)}
          aria-label="Close menu"
          type="button"
        />
      )}
      <section className="main-area">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMobileMenu(true)} type="button">
            <Icon name="menu" />
          </button>
          <div className="page-title">
            <h1>{names[page]?.[0] || `Good morning, ${username}`}</h1>
            <p>{names[page]?.[1] || ""}</p>
          </div>
          <div className="top-actions">
            <button className="icon-btn" type="button">
              <Icon name="search" />
            </button>
            <button className="icon-btn bell" type="button">
              <Icon name="bell" />
              <i />
            </button>
            <div className="avatar">{initials}</div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </section>
    </div>
  );
};