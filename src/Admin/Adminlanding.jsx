import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLanding() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Elite Nest Admin</h1>
        <p style={styles.subtitle}>
          Welcome to the Elite Nest administration panel.  
          Please choose where you want to go.
        </p>

        <div style={styles.buttonGroup}>
          <button style={styles.primaryBtn} onClick={() => navigate("/admin/dashboard")}>
            📊 Go to Dashboard
          </button>
          <button style={styles.secondaryBtn} onClick={() => navigate("/")}>
            🌐 Back to Website
          </button>
        </div>

        <p style={styles.footer}>Authorized personnel only</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "50px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    maxWidth: "420px",
    width: "100%",
  },
  title: {
    fontSize: "36px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #ff6b35, #f7931e, #ffc857)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#555",
    marginBottom: "30px",
    fontSize: "15px",
    lineHeight: "1.6",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  primaryBtn: {
    padding: "14px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#ff6b35",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
  },
  secondaryBtn: {
    padding: "14px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "2px solid #ff6b35",
    backgroundColor: "white",
    color: "#ff6b35",
    cursor: "pointer",
    fontWeight: "600",
  },
  footer: {
    marginTop: "25px",
    fontSize: "12px",
    color: "#888",
  },
};