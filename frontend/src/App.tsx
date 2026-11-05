import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { GoalsView } from './views/GoalsView';
import { Shell } from './components/Shell';
import { TransactionModal } from './components/TransactionModal';
import type { Transaction } from './types/transaction';

const initialTransactions: Transaction[] = [
  { id: 1, name: "Monthly Salary", category: "Salary", date: "May 28, 2025", amount: 4200, type: "Income" },
  { id: 2, name: "Whole Foods Market", category: "Groceries", date: "May 27, 2025", amount: -86.42, type: "Expense" },
  { id: 3, name: "Apartment Rent", category: "Housing", date: "May 25, 2025", amount: -1450, type: "Expense" },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [modal, setModal] = useState<{ open: boolean; transaction?: Transaction | null }>({
    open: false,
  });

  const saveTransaction = (transaction: Transaction) => {
    setTransactions((prev) =>
      prev.some((t) => t.id === transaction.id)
        ? prev.map((t) => (t.id === transaction.id ? transaction : t))
        : [transaction, ...prev],
    );
    setModal({ open: false });
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            !isLoggedIn ? (
              <LoginView
                onAuthenticate={() => setIsLoggedIn(true)}
                onSwitchToRegister={() => window.location.href = '/register'}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/register"
          element={
            !isLoggedIn ? (
              <RegisterView
                onAuthenticate={() => setIsLoggedIn(true)}
                onSwitchToLogin={() => window.location.href = '/login'}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Protected routes (wrapped in Shell) */}
        <Route
          path="/*"
          element={
            isLoggedIn ? (
              <Shell
                page={window.location.pathname.replace('/', '') || 'dashboard'}
                setPage={(p) => { window.location.href = `/${p}`; }}
                onLogout={() => setIsLoggedIn(false)}
              >
                <Routes>
                  <Route
                    path="/dashboard"
                    element={
                      <DashboardView
                        setPage={(p) => { window.location.href = `/${p}`; }}
                        onAdd={() => setModal({ open: true })}
                        transactions={transactions}
                      />
                    }
                  />
                  <Route
                    path="/transactions"
                    element={
                      <TransactionsView
                        rows={transactions}
                        openModal={(t) => setModal({ open: true, transaction: t })}
                      />
                    }
                  />
                  <Route path="/budgets" element={<BudgetsView />} />
                  <Route path="/goals" element={<GoalsView />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>

                {modal.open && (
                  <TransactionModal
                    transaction={modal.transaction}
                    onClose={() => setModal({ open: false })}
                    onSave={saveTransaction}
                  />
                )}
              </Shell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}