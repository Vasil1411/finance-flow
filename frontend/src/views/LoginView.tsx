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

      
      onAuthenticate();
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="auth-page">
      <AuthBrandArt />
      <main className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="mobile-auth-logo">
            <Logo />
          </div>
          <span className="eyebrow">WELCOME BACK</span>
          <h1>Good to see you again</h1>
          <p className="auth-sub">Enter your details to access your financial dashboard.</p>
          
          {/* Error message for invalid credentials */}
          {error && (
            <div style={{ color: "red", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Invalid username or password. Please try again.
            </div>
          )}

          <div className="field">
            <label>Username / Email</label>
            <input 
              type="text" 
              required 
              placeholder="alex@example.com" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="label-row">
              <label>Password</label>
              <button type="button">Forgot password?</button>
            </div>
            <div className="input-icon">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <Icon name="eye" size={18} />
              </button>
            </div>
          </div>

          <label className="checkbox">
            <input type="checkbox" />
            <span>Remember me for 30 days</span>
          </label>

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