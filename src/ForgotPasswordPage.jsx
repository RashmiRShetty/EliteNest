// src/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase.js";
import { styles } from "./AuthStyles.js";
import Alert from "./components/Alert.jsx";

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
