import React, { type FormEvent } from "react";
import { Button, Logo } from "../components/UI";
import { Icon } from "../components/Icon";
import { AuthBrandArt } from "../components/AuthBrandArt";

interface RegisterViewProps {
  onAuthenticate: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onAuthenticate, onSwitchToLogin }) => {
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
          <span className="eyebrow">START YOUR JOURNEY</span>
          <h1>Create your account</h1>
          <p className="auth-sub">Join thousands taking control of their finances.</p>

          <div className="field">
            <label>Full name</label>
            <input required placeholder="Alex Morgan" />
          </div>

          <div className="field">
            <label>Email address</label>
            <input type="email" required placeholder="alex@example.com" />
          </div>

          <div className="field">
            <div className="label-row">
              <label>Password</label>
            </div>
            <div className="input-icon">
              <input type="password" required minLength={8} placeholder="At least 8 characters" />
              <Icon name="eye" size={18} />
            </div>
          </div>

          <label className="checkbox">
            <input type="checkbox" required />
            <span>
              I agree to the <b>Terms of Service</b> and <b>Privacy Policy</b>.
            </span>
          </label>

          <Button type="submit">Create account</Button>

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