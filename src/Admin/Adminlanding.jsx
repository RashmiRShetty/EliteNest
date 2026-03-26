import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";

export default function AdminLanding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        setError(loginError.message || "Login failed. Please check credentials.");
      } else if (data?.session && data.user) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        setError("Unable to establish session. Please try again.");
      }
    } catch (err) {
      setError("Unexpected error during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.badge}>Admin Panel</div>
        <h1 style={styles.title}>Elite Nest</h1>
        <p style={styles.subtitle}>Secure access to the administration dashboard.</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Admin Email</label>
            <input
              type="email"
              name="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? "Signing In..." : "Login as Admin"}
          </button>
        </form>

        <button style={styles.secondaryBtn} onClick={() => navigate("/")}>
          🌐 Back to Website
        </button>

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
    background: "linear-gradient(145deg, #020617, #020617)",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    padding: "40px 32px 32px",
    borderRadius: "16px",
    textAlign: "left",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    maxWidth: "460px",
    width: "100%",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    color: "#fed7aa",
    marginBottom: "10px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #f97316, #fde68a)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#e5e7eb",
    marginBottom: "20px",
    fontSize: "15px",
    lineHeight: "1.6",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "16px",
    marginTop: "12px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    color: "#cbd5f5",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(148, 163, 184, 0.7)",
    fontSize: "14px",
    backgroundColor: "#020617",
    color: "#f9fafb",
    outline: "none",
  },
  primaryBtn: {
    padding: "14px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "none",
    backgroundImage: "linear-gradient(135deg, #f97316, #facc15)",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "4px",
  },
  secondaryBtn: {
    padding: "14px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.6)",
    backgroundColor: "transparent",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: "600",
    width: "100%",
  },
  footer: {
    marginTop: "25px",
    fontSize: "12px",
    color: "#9ca3af",
  },
  errorBox: {
    backgroundColor: "rgba(248, 113, 113, 0.15)",
    color: "#fecaca",
    border: "1px solid rgba(248, 113, 113, 0.5)",
    padding: "8px 10px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "10px",
  },
};
