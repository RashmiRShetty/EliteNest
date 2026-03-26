import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabase.js";
import { styles } from "./AuthStyles.js";
import Alert from "./components/Alert.jsx";
import GoogleIcon from "./components/GoogleIcon.jsx";
import "./Dashboard.css"; // Import Dashboard styles for new header

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        setError(loginError.message || "Login failed. Please check credentials.");
      } else if (data?.session && data.user) {
        setSuccess("Login successful! Redirecting...");
        // Ensure session is stored before navigating
        // Wait a moment for session to be persisted to localStorage
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify session is stored
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // If user came from a property (e.g. /properties/5), take them back there.
          // Otherwise, default to /properties
          const from = location.state?.from || "/properties";
          navigate(from, { replace: true });
        } else {
          setError("Session not established. Please try again.");
        }
      }
    } catch (err) {
      setError("Unexpected error. Check Supabase configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/dashboard",
        },
      });

      if (error) setError(error.message || "Google login failed.");
    } catch (err) {
      setError("Google sign-in failed. Check Supabase settings.");
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
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <button className="promo-btn" style={{ padding: '8px 20px', fontSize: '14px' }}>
              Sign Up
            </button>
          </Link>
        </div>
      </header>

      {/* 🔷 LOGIN PAGE CONTENT */}

      <div style={styles.container}>
        <div style={styles.overlay}></div>
        <div style={styles.box}>
          
          <h2 style={styles.title}>
            Login to Elite Nest
          </h2>

          <Alert type="error" message={error} />
          <Alert type="success" message={success} />

          {/* GOOGLE LOGIN */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: "100%",
              height: "45px",
              borderRadius: "4px",
              border: "1px solid #dadce0",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            <GoogleIcon size={20} />
            Sign in with Google
          </button>

          <div style={styles.orDivider}>
            <span style={styles.orSpan}>OR</span>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                fontSize: "14px",
                marginBottom: "15px",
              }}
            >
              <label style={{ display: "flex", gap: "6px" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>

              <Link to="/forgot-password" style={{ marginLeft: "auto", color: "#60a5fa" }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Signing In..." : "Login with Password"}
            </button>

            <p style={styles.p}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "#60a5fa" }}>
                Register here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
