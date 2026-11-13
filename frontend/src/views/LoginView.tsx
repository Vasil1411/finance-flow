import React, { useState } from "react";
import { Button, Logo } from "../components/UI";
import { Icon } from "../components/Icon";
import { AuthBrandArt } from "../components/AuthBrandArt";
import { useLoginMutation, useRequestPasswordResetMutation } from "../services/authApi";

interface LoginViewProps {
  onAuthenticate: () => void;
  onSwitchToRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onAuthenticate, onSwitchToRegister }) => {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const [login, { isLoading: isLoggingIn, error: loginError }] = useLoginMutation();
  const [requestReset, { isLoading: isResetting }] = useRequestPasswordResetMutation();

  const handleLoginSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await login({ username: email, password }).unwrap();

      localStorage.setItem("access_token", response.access);
      localStorage.setItem("refresh_token", response.refresh);
      localStorage.setItem("email", email);

      if ((response as any).username) {
        localStorage.setItem("username", (response as any).username);
      }

      // 👈 ЗАПИСВАМЕ ДАЛИ ПОТРЕБИТЕЛЯТ Е АДМИН (is_staff)
      if ((response as any).is_staff !== undefined) {
        localStorage.setItem("is_staff", (response as any).is_staff ? "true" : "false");
      }

      onAuthenticate();
    } catch (err) {
      console.error("Login Error:", err);
      setPassword("");
    }
  };

  const handleResetSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await requestReset({ email }).unwrap();
      setResetSubmitted(true);
    } catch (err) {
      console.error("Reset password error:", err);
      setResetSubmitted(true);
    }
  };

  return (
    <div className="auth-page">
      <AuthBrandArt />
      <main className="auth-form-wrap">
        {!isForgotPassword ? (
          <form className="auth-form" onSubmit={handleLoginSubmit} autoComplete="off">
            <div className="mobile-auth-logo">
              <Logo />
            </div>
            <span className="eyebrow">WELCOME BACK</span>
            <h1>Good to see you again</h1>
            <p className="auth-sub">Enter your details to access your financial dashboard.</p>
            
            {loginError && (
              <div style={{ color: "red", fontSize: "0.875rem", marginBottom: "1rem" }}>
                Invalid email or password. Please try again.
              </div>
            )}

            <div className="field">
              <label>Email</label>
              <input 
                type="email" 
                required 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="field">
              <div className="label-row">
                <label>Password</label>
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: '0.85rem', fontWeight: 500, padding: 0 }}
                >
                  Forgot password?
                </button>
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
                  style={{position: 'absolute', 
                  right: '14px', 
                  top: '5%',
                  transform: 'translateY(-50%)',
                  background: "none", 
                  border: "none", 
                  cursor: "pointer", 
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#667085',
                  zIndex: 2 }}
                >
                  <Icon name= "eye" size={18} />
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? "Signing in..." : "Sign in to FinanceFlow"}
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
        ) : (
          <form className="auth-form" onSubmit={handleResetSubmit}>
            <div className="mobile-auth-logo">
              <Logo />
            </div>
            <span className="eyebrow">RECOVER PASSWORD</span>
            <h1>Reset your password</h1>
            <p className="auth-sub">Enter your account email and we'll send you a reset link.</p>

            {resetSubmitted ? (
              <div style={{ padding: '16px', background: '#ECFDF3', color: '#027A48', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
                If an account with that email exists, we have sent instructions to reset your password.
              </div>
            ) : (
              <>
                <div className="field">
                  <label>Email address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="alex@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={isResetting}>
                  {isResetting ? "Sending link..." : "Send reset link"}
                </Button>
              </>
            )}

            <p className="auth-switch" style={{ marginTop: '16px' }}>
              Remembered your password?{" "}
              <button type="button" onClick={() => setIsForgotPassword(false)}>
                Sign in
              </button>
            </p>
          </form>
        )}
      </main>
    </div>
  );
};