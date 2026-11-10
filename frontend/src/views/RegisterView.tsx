import React, { useState } from "react";
import { Button, Logo } from "../components/UI";
import { Icon } from "../components/Icon";
import { AuthBrandArt } from "../components/AuthBrandArt";
import { useRegisterMutation } from "../services/authApi";

interface RegisterViewProps {
  onAuthenticate: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onAuthenticate, onSwitchToLogin }) => {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  
  const [register, { isLoading, error }] = useRegisterMutation();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      
      await register({ username, password }).unwrap();

     
      alert("Registration successful! Please sign in.");
      onSwitchToLogin();
    } catch (err) {
      console.error("Registration error:", err);
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
          <span className="eyebrow">START YOUR JOURNEY</span>
          <h1>Create your account</h1>
          <p className="auth-sub">Join thousands taking control of their finances.</p>

          {/* Error message for failed registration */}
          {error && (
            <div style={{ color: "red", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Registration failed. Username might already be taken.
            </div>
          )}

          <div className="field">
            <label>Username (Full name / Nickname)</label>
            <input 
              required 
              placeholder="Alex Morgan" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

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

          <div className="field">
            <div className="label-row">
              <label>Password</label>
            </div>
            <div className="input-icon">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                minLength={8} 
                placeholder="At least 8 characters" 
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