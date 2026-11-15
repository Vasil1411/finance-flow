import React, { useState } from "react";
import { Button, Logo } from "../components/UI";
import { Icon } from "../components/Icon";
import { AuthBrandArt } from "../components/AuthBrandArt";
import { TermsModal } from "../components/TermsModal";
import { PrivacyModal } from "../components/PrivacyModal";
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
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | null>(null);
  const [backendErrors, setBackendErrors] = useState<{ username?: string[]; email?: string[]; non_field_errors?: string[] }>({});

  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBackendErrors({});

    try {
      await register({ username, email, password }).unwrap();
      const loginResponse = await login({ username: email, password }).unwrap();

      localStorage.setItem("access_token", loginResponse.access);
      localStorage.setItem("refresh_token", loginResponse.refresh);
      localStorage.setItem("email", email);
      localStorage.setItem("username", username);

      if ((loginResponse as any).is_staff !== undefined) {
        localStorage.setItem("is_staff", (loginResponse as any).is_staff ? "true" : "false");
      }

      onAuthenticate();
    } catch (err: any) {
      console.error("Registration error full object:", err);

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
            <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", paddingRight: "40px" }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#667085",
                  zIndex: 2,
                }}
              >
                <Icon name="eye" size={18} />
              </button>
            </div>
          </div>

          <label className="checkbox">
            <input type="checkbox" required />
            <span>
              I agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveModal("terms");
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#4F46E5",
                  fontWeight: 800,
                  cursor: "pointer",
                  textDecoration: "underline",
                  font: "inherit",
                }}
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveModal("privacy");
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#4F46E5",
                  fontWeight: 800,
                  cursor: "pointer",
                  textDecoration: "underline",
                  font: "inherit",
                 
                }}
              >
                Privacy Policy
              </button>
              .
            </span>
          </label>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>

          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" onClick={onSwitchToLogin}>
              Sign in
            </button>
          </p>
        </form>
      </main>

      {/* Модали за Terms of Service и Privacy Policy */}
      {activeModal === "terms" && <TermsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "privacy" && <PrivacyModal onClose={() => setActiveModal(null)} />}
    </div>
  );
};