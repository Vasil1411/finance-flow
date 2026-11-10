import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { GoalsView } from './views/GoalsView';
import { Shell } from './components/Shell';
import { TransactionModal } from './components/TransactionModal';
import { useState } from 'react';
import { apiSlice } from './services/api';
import { useDispatch } from 'react-redux';

// Higher-order component to wrap LoginView with navigation
const LoginWithNavigation = () => {
  const navigate = useNavigate();
  return (
    <LoginView
      onAuthenticate={() => navigate('/dashboard', { replace: true })}
      onSwitchToRegister={() => navigate('/register')}
    />
  );
};

// Help component for Register with needed props
const RegisterWithNavigation = () => {
  const navigate = useNavigate();
  return (
    <RegisterView
      onAuthenticate={() => navigate('/dashboard', { replace: true })}
      onSwitchToLogin={() => navigate('/login')}
    />
  );
};

export default function App() {
  const dispatch = useDispatch();
  const [modal, setModal] = useState<{ open: boolean; transaction?: any | null }>({
    open: false,
  });

  const isAuthenticated = !!localStorage.getItem('access_token');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    dispatch(apiSlice.util.resetApiState());
    window.location.href = '/login';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginWithNavigation /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <RegisterWithNavigation /> : <Navigate to="/dashboard" replace />} 
        />

        {/* Protected routes within Shell */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Shell 
                page={window.location.pathname.replace('/', '') || 'dashboard'}
                setPage={(p) => { window.location.href = `/${p}`; }}
                onLogout={handleLogout}
              >
                <Routes>
                  <Route 
                    path="/dashboard" 
                    element={
                      <DashboardView 
                        setPage={(p) => { window.location.href = `/${p}`; }}
                        onAdd={() => setModal({ open: true })} 
                        transactions={[]} 
                      />
                    } 
                  />
                  <Route 
                    path="/transactions" 
                    element={
                      <TransactionsView 
                        rows={[]} 
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
                    onSave={() => setModal({ open: false })}
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