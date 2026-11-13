import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Ако ползваш react-router
import { Button } from "../components/UI";
import { useConfirmPasswordResetMutation } from "../services/authApi";

export const ResetPasswordConfirmView: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [confirmReset, { isLoading }] = useConfirmPasswordResetMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!uid || !token) {
      setErrorMsg("Invalid or missing reset token.");
      return;
    }

    try {
      await confirmReset({ uid, token, new_password: newPassword }).unwrap();
      setSuccess(true);
      setTimeout(() => {
        navigate("/login"); // Пращаме го към входа след успешна смяна
      }, 3000);
    } catch (err) {
      console.error("Confirm reset error:", err);
      setErrorMsg("The reset link is invalid or has expired.");
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <span className="eyebrow">NEW PASSWORD</span>
          <h1>Set a new password</h1>
          <p className="auth-sub">Please enter your new secure password below.</p>

          {errorMsg && (
            <div style={{ color: "#B42318", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {errorMsg}
            </div>
          )}

          {success ? (
            <div style={{ padding: '16px', background: '#ECFDF3', color: '#027A48', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
              Password has been reset successfully! Redirecting to login...
            </div>
          ) : (
            <>
              <div className="field">
                <label>New Password</label>
                <input 
                  type="password" 
                  required 
                  minLength={8}
                  placeholder="At least 8 characters" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Reset password"}
              </Button>
            </>
          )}
        </form>
      </main>
    </div>
  );
};