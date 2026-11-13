import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { ResetPasswordConfirmView } from './components/ResetPasswordConfirmView';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { GoalsView } from './views/GoalsView';
import { AdminView } from './views/AdminView'; // 👈 НОВО: Импортираме нашия Админ панел
import { Shell } from './components/Shell';
import { TransactionModal } from './components/TransactionModal';
import { useState } from 'react';
import { apiSlice } from './services/api';
import { useDispatch } from 'react-redux';

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

const RegisterWithNavigation = () => {
  const navigate = useNavigate();
  return (
    <RegisterView
      onAuthenticate={() => navigate('/dashboard', { replace: true })}
      onSwitchToLogin={() => navigate('/login')}
    />
  );
};

const AuthenticatedApp = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState<{ open: boolean; transaction?: any | null }>({ open: false });

  const currentPage = location.pathname.replace('/', '') || 'dashboard';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Shell page={currentPage} setPage={(p) => navigate(`/${p}`)} onLogout={onLogout}>
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/dashboard" element={<DashboardView setPage={(p) => navigate(`/${p}`)} onAdd={() => setModal({ open: true })} transactions={[]} />} />
            <Route path="/transactions" element={<TransactionsView rows={[]} openModal={(t) => setModal({ open: true, transaction: t })} />} />
            <Route path="/budgets" element={<BudgetsView />} />
            <Route path="/goals" element={<GoalsView />} />
            
            {/* 👈 НОВО: Маршрут за Админ панела (може да добавим и защитна проверка) */}
            <Route 
              path="/admin" 
              element={
                localStorage.getItem('is_staff') === 'true' ? (
                  <AdminView onBackToDashboard={() => navigate('/dashboard')} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>

        {modal.open && (
          <TransactionModal
            transaction={modal.transaction}
            onClose={() => setModal({ open: false })}
            onSave={() => setModal({ open: false })}
          />
        )}
      </Shell>
    </div>
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
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('is_staff'); // 👈 НОВО: Чистим и staff флага при изход
    dispatch(apiSlice.util.resetApiState());
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginWithNavigation onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterWithNavigation /> : <Navigate to="/login" replace />} />
        
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordConfirmView />} />

        <Route path="/*" element={isAuthenticated ? <AuthenticatedApp onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}