// src/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase.js";
import { styles } from "./AuthStyles.js";
import Alert from "./components/Alert.jsx";
import "./Dashboard.css"; // Import Dashboard styles for new header

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message || "Failed to send reset email. Please try again.");
      } else {
        setSuccess(
          "If an account with that email exists, a password reset link has been sent."
        );
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("An unexpected error occurred. Please check your Supabase configuration.");
    } finally {
      setLoading(false);
    }
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

      {/* FORM CONTAINER */}
      <div style={styles.container}>
        <div style={styles.overlay}></div>
        <div style={styles.box}>
          <h2 style={styles.title}>Forgot Password</h2>
          <Alert type="error" message={error} />
          <Alert type="success" message={success} />
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <p style={styles.p}>
              Remembered your password?{" "}
              <Link to="/loginpage" style={{ color: "#60a5fa" }}>
                Back to login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
