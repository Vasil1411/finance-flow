import React, { useState } from "react";
import { Button, Logo } from "../components/UI";
import { Icon } from "../components/Icon";
import { AuthBrandArt } from "../components/AuthBrandArt";
import { useRegisterMutation, useLoginMutation } from "../services/authApi";

interface RegisterViewProps {
  onAuthenticate: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onAuthenticate, onSwitchToLogin }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [backendErrors, setBackendErrors] = useState<{ username?: string[]; email?: string[]; non_field_errors?: string[] }>({});

  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBackendErrors({}); // Изчистваме предишни грешки

    try {
      // 1. Регистрираме потребителя в бекенда
      await register({ username, email, password }).unwrap();
      
      // 2. Логваме се автоматично с имейла и паролата
      const loginResponse = await login({ username: email, password }).unwrap();

      // 3. Записваме токените и данните
      localStorage.setItem("access_token", loginResponse.access);
      localStorage.setItem("refresh_token", loginResponse.refresh);
      localStorage.setItem("email", email);
      localStorage.setItem("username", username);

      // 4. Влизаме в приложението
      onAuthenticate();
    } catch (err: any) {
      console.error("Registration error full object:", err);
      
      // Взимаме точно обекта с грешките от err.data.errors
      if (err?.data?.errors) {
        setBackendErrors(err.data.errors);
      } else if (err?.data) {
        setBackendErrors(err.data);
      }
      
      setPassword("");
    }
  };

  const isLoading = isRegistering || isLoggingIn;

  return (
    <div className="auth-page">
      <AuthBrandArt />
      <main className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="mobile-auth-logo">
            <Logo />
          </div>
          <span className="eyebrow">START YOUR JOURNEY</span>
          <h1>Create your account</h1>
          <p className="auth-sub">Join thousands taking control of their finances.</p>

          {/* Обща грешка от бекенда, ако има такава */}
          {backendErrors.non_field_errors && (
            <div style={{ color: "red", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {backendErrors.non_field_errors[0]}
            </div>
          )}

          <div className="field">
            <label>Username (Full name / Nickname)</label>
            <input 
              required 
              placeholder="Alex Morgan" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
            />
            {/* Грешка конкретно за зает/грешен юзърнейм */}
            {backendErrors.username && (
              <span style={{ color: "red", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>
                {backendErrors.username[0]}
              </span>
            )}
          </div>

          <div className="field">
            <label>Email address</label>
            <input 
              type="email" 
              required 
              placeholder="alex@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
            {/* Грешка конкретно за съществуващ имейл */}
            {backendErrors.email && (
              <span style={{ color: "red", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>
                {backendErrors.email[0]}
              </span>
            )}
          </div>

          <div className="field">
            <div className="label-row">
              <label>Password</label>
            </div>
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                minLength={8} 
                placeholder="At least 8 characters" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '40px' }}
                autoComplete="new-password"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '14px', 
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: "none", 
                  border: "none", 
                  cursor: "pointer", 
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#667085',
                  zIndex: 2
                }}
              >
                <Icon name="eye" size={18} />
              </button>
            </div>
          </div>

          <label className="checkbox">
            <input type="checkbox" required />
            <span>
              I agree to the <b>Terms of Service</b> and <b>Privacy Policy</b>.
            </span>
          </label>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <button className="google-btn" type="button">
            <span className="google-g">G</span> Google
          </button>

          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" onClick={onSwitchToLogin}>
              Sign in
            </button>
          </p>
        </form>
      </main>
    </div>
  );
};