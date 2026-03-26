// src/ResetPassword.jsx
import React, { useState } from "react";
import { supabase } from "./supabase";
import { useNavigate, Link } from "react-router-dom";
import "./Dashboard.css"; // Import Dashboard styles for new header

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updatePassword = async () => {
    setError("");
    setMessage("");

    if (!password || !confirm) {
      setError("Please enter both fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Check session (Supabase logs in user temporarily)
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setError("Reset link expired or invalid. Request a new one.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully! Redirecting...");
    setTimeout(() => navigate("/loginpage"), 1800);

    setLoading(false);
  };

  return (
    <div>
      {/* 🔹 NEW DASHBOARD HEADER */}
      <header className="top-header" style={{ position: 'absolute', width: '100%', background: '#000000', zIndex: 10 }}>
        <div className="header-left">
          <Link to="/" className="header-brand">
            <img
              src="/elite-nest-logo.png"
              alt="Elite Nest"
              style={{ height: "56px", objectFit: "contain" }}
            />
            <span style={{ marginLeft: "8px", fontWeight: 800 }}>Elite Nest</span>
          </Link>
          <nav className="header-links">
            <Link to="/dashboard" className="header-link">Dashboard</Link>
            <Link to="/properties" className="header-link">Properties</Link>
            <Link to="/contact" className="header-link">Contact</Link>
            <Link to="/about" className="header-link">About Us</Link>
          </nav>
        </div>       
        <div className="header-actions">
          <Link to="/loginpage" style={{ textDecoration: 'none' }}>
            <button className="promo-btn" style={{ padding: '8px 20px', fontSize: '14px' }}>
              Login
            </button>
          </Link>
        </div>
      </header>

      {/* RESET PASSWORD FORM */}
      <div style={styles.page}>
        <div style={styles.box}>
          <h2 style={{ color: "white", marginBottom: "15px" }}>
            Reset Your Password
          </h2>

          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}

          <input
            type="password"
            placeholder="New Password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            style={styles.input}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <button onClick={updatePassword} style={styles.button} disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>

          <button
            onClick={() => navigate("/loginpage")}
            style={styles.secondaryButton}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline styles for clean UI
const styles = {
  page: {
    minHeight: "100vh",
    background:
      "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c') center/cover no-repeat",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  box: {
    width: "100%",
    maxWidth: "400px",
    background: "rgba(0,0,0,0.6)",
    padding: "30px",
    borderRadius: "12px",
    backdropFilter: "blur(6px)",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "14px",
    margin: "10px 0",
    borderRadius: "8px",
    border: "1px solid #ffffff4a",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    fontSize: "16px",
    outline: "none",
  },
  button: {
    width: "100%",
    marginTop: "10px",
    padding: "14px",
    background: "#007bff",
    border: "none",
    borderRadius: "8px",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
    color: "white",
  },
  secondaryButton: {
    width: "100%",
    marginTop: "15px",
    padding: "12px",
    background: "rgba(255,255,255,0.2)",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    cursor: "pointer",
    color: "white",
  },
  error: {
    color: "#ff6b6b",
    background: "rgba(255,0,0,0.1)",
    padding: "10px",
    borderRadius: "8px",
  },
  success: {
    color: "#4ade80",
    background: "rgba(0,255,0,0.1)",
    padding: "10px",
    borderRadius: "8px",
  },
};
