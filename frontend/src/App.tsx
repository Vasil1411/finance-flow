import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { GoalsView } from './views/GoalsView';
import { Shell } from './components/Shell';
import { TransactionModal } from './components/TransactionModal';
import { useState, useEffect } from 'react';
import { apiSlice } from './services/api';
import { useDispatch } from 'react-redux';

// Помощен компонент за Логин с React Router пренасочване
const LoginWithNavigation = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const navigate = useNavigate();
  return (
    <LoginView
      onAuthenticate={() => {
        onLoginSuccess();
        navigate('/dashboard', { replace: true });
      }}
      onSwitchToRegister={() => navigate('/register')}
    />
  );
};

// Помощен компонент за Регистрация
const RegisterWithNavigation = () => {
  const navigate = useNavigate();
  return (
    <RegisterView
      onAuthenticate={() => navigate('/dashboard', { replace: true })}
      onSwitchToLogin={() => navigate('/login')}
    />
  );
};

// Вътрешен компонент за защитените маршрути, за да работи коректно useNavigate в Shell
const AuthenticatedApp = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState<{ open: boolean; transaction?: any | null }>({
    open: false,
  });

  const currentPage = location.pathname.replace('/', '') || 'dashboard';

  return (
    <Shell 
      page={currentPage}
      setPage={(p) => navigate(`/${p}`)}
      onLogout={onLogout}
    >
      <Routes>
        <Route 
          path="/dashboard" 
          element={
            <DashboardView 
              setPage={(p) => navigate(`/${p}`)} 
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
  );
};

export default function App() {
  const dispatch = useDispatch();
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));

  const isAuthenticated = !!token;

  const handleLoginSuccess = () => {
    setToken(localStorage.getItem('access_token'));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    dispatch(apiSlice.util.resetApiState());
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Публични маршрути */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginWithNavigation onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <RegisterWithNavigation /> : <Navigate to="/dashboard" replace />} 
        />

        {/* Защитени маршрути */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <AuthenticatedApp onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}