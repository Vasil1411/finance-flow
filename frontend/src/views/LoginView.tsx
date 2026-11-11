import React, { useState } from "react";
import { Button, Logo } from "../components/UI";
import { Icon } from "../components/Icon";
import { AuthBrandArt } from "../components/AuthBrandArt";
import { useLoginMutation } from "../services/authApi";

interface LoginViewProps {
  onAuthenticate: () => void;
  onSwitchToRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onAuthenticate, onSwitchToRegister }) => {
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await login({ username, password }).unwrap();

      localStorage.setItem("access_token", response.access);
      localStorage.setItem("refresh_token", response.refresh);
      localStorage.setItem("username", username); 
      

      onAuthenticate();
    } catch (err) {
      console.error("Login Error:", err);
      setPassword("");
    }
  };

  return (
    <div className="auth-page">
      <AuthBrandArt />
      <main className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="mobile-auth-logo">
            <Logo />
          </div>
          <span className="eyebrow">WELCOME BACK</span>
          <h1>Good to see you again</h1>
          <p className="auth-sub">Enter your details to access your financial dashboard.</p>
          
          {error && (
            <div style={{ color: "red", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Invalid username or password. Please try again.
            </div>
          )}

          <div className="field">
            <label>Username</label>
            <input 
              type="text" 
              required 
              placeholder="Enter your username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <div className="label-row">
              <label>Password</label>
              <button type="button">Forgot password?</button>
            </div>
            <div className="input-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '40px' }}
                autoComplete="current-password"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '14px', 
                  background: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  color: '#667085',
                  zIndex: 2
                }}
              >
                <Icon name={showPassword ? "eye" : "eye"} size={18} />
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in to FinanceFlow"}
          </Button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <button className="google-btn" type="button">
            <span className="google-g">G</span> Google
          </button>

          <p className="auth-switch">
            Don't have an account?{" "}
            <button type="button" onClick={onSwitchToRegister}>
              Create account
            </button>
          </p>
        </form>
      </main>
    </div>
  );
};