// src/ResetPassword.jsx
import React, { useState } from "react";
import { supabase } from "./supabase";
import { useNavigate, Link } from "react-router-dom";

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
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <div className="navbar-brand">
            <Link to="/"><h1 className="brand-name">Elite Nest</h1></Link>
          </div>
          <div className="navbar-links">
            <Link to="/" className="nav-link">Home</Link>
            <a href="#properties" className="nav-link">Properties</a>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/about" className="nav-link">About Us</Link>
          </div>
        </div>
        <div className="nav-right">
          <Link to="/loginpage" className="btn-login-nav">Login / SignUp</Link>
        </div>
      </nav>

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
