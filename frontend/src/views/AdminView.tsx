import React from "react";
import { useGetAdminStatsQuery, useGetAdminUsersQuery } from "../services/authApi";
import { Button } from "../components/UI";

interface AdminViewProps {
  onBackToDashboard: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBackToDashboard }) => {
  const { data: stats, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: users, isLoading: usersLoading } = useGetAdminUsersQuery();

  if (statsLoading || usersLoading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading admin panel...</div>;
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <span style={{ color: "#4F46E5", fontWeight: 600, fontSize: "0.85rem" }}>SYSTEM CONTROL</span>
          <h1 style={{ margin: "4px 0 0 0", fontSize: "1.8rem" }}>Admin Dashboard</h1>
        </div>
        <Button type="button" onClick={onBackToDashboard} style={{ width: "auto", padding: "10px 20px" }}>
          Back to Dashboard
        </Button>
      </div>

      {/* KPI STATS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: "0", color: "#667085", fontSize: "0.875rem" }}>Total Users</p>
          <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem", color: "#1D2939" }}>{stats?.total_users}</h2>
        </div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: "0", color: "#667085", fontSize: "0.875rem" }}>Active Accounts</p>
          <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem", color: "#027A48" }}>{stats?.active_users}</h2>
        </div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: "0", color: "#667085", fontSize: "0.875rem" }}>Total Transactions</p>
          <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem", color: "#4F46E5" }}>{stats?.total_transactions}</h2>
        </div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: "0", color: "#667085", fontSize: "0.875rem" }}>Budgets & Goals</p>
          <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem", color: "#B54708" }}>{(stats?.total_budgets ?? 0) + (stats?.total_goals ?? 0)}</h2>
        </div>
      </div>

      {/* USERS TABLE */}
      <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #EAECF0" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Registered System Users</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #EAECF0", color: "#475467", fontSize: "0.75rem" }}>
                <th style={{ padding: "12px 20px" }}>USERNAME</th>
                <th style={{ padding: "12px 20px" }}>EMAIL ADDRESS</th>
                <th style={{ padding: "12px 20px" }}>DATE JOINED</th>
                <th style={{ padding: "12px 20px" }}>TRANSACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #EAECF0", fontSize: "0.875rem" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 500, color: "#1D2939" }}>{u.username}</td>
                  <td style={{ padding: "14px 20px", color: "#475467" }}>{u.email}</td>
                  <td style={{ padding: "14px 20px", color: "#475467" }}>{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#4F46E5" }}>{u.transactions_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};