import React, { type FormEvent } from "react";
import { Button, Logo } from "../components/UI";
import { Icon } from "../components/Icon";
import { AuthBrandArt } from "../components/AuthBrandArt";

interface LoginViewProps {
  onAuthenticate: () => void;
  onSwitchToRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onAuthenticate, onSwitchToRegister }) => {
  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAuthenticate();
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
          
          <div className="field">
            <label>Email address</label>
            <input type="email" required placeholder="alex@example.com" />
          </div>

          <div className="field">
            <div className="label-row">
              <label>Password</label>
              <button type="button">Forgot password?</button>
            </div>
            <div className="input-icon">
              <input type="password" required placeholder="Enter your password" />
              <Icon name="eye" size={18} />
            </div>
          </div>

          <label className="checkbox">
            <input type="checkbox" />
            <span>Remember me for 30 days</span>
          </label>

          <Button type="submit">Sign in to FinanceFlow</Button>

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