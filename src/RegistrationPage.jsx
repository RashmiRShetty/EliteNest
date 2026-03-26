// src/RegistrationPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase.js";
import { styles } from "./AuthStyles.js";
import Alert from "./components/Alert.jsx";
import PasswordStrengthBar from "./components/PasswordStrengthBar.jsx";
import "./Dashboard.css";

// --------------------------------------------
// STEP COMPONENTS (memoized to prevent remount)
// --------------------------------------------
const Step1 = React.memo(function Step1({ formData, handleChange, nextStep }) {
  return (
    <>
      <input
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        placeholder="First Name"
        required
        style={styles.input}
      />
      <input
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        placeholder="Last Name"
        required
        style={styles.input}
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email Address"
        type="email"
        required
        style={styles.input}
      />

      <button
        type="button"
        onClick={nextStep}
        disabled={!formData.email}
        style={{
          ...styles.button,
          opacity: formData.email ? 1 : 0.5,
          cursor: formData.email ? "pointer" : "not-allowed",
        }}
      >
        Next →
      </button>
    </>
  );
});

const Step2 = React.memo(function Step2({ formData, handleChange, nextStep, prevStep }) {
  return (
    <>
      <input
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Phone Number"
        required
        style={styles.input}
      />

      <input
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Address (optional)"
        style={styles.input}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" onClick={prevStep} style={styles.button}>
          ← Back
        </button>
        <button type="button" onClick={nextStep} style={styles.button}>
          Next →
        </button>
      </div>
    </>
  );
});

const Step3 = React.memo(function Step3({
  formData,
  handleChange,
  prevStep,
  loading,
}) {
  return (
    <>
      <input
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
        type="password"
        required
        style={styles.input}
      />

      <PasswordStrengthBar password={formData.password} />

      <input
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Confirm Password"
        type="password"
        required
        style={styles.input}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" onClick={prevStep} style={styles.button}>
          ← Back
        </button>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Signing Up..." : "Submit"}
        </button>
      </div>
    </>
  );
});

// --------------------------------------------
// MAIN COMPONENT
// --------------------------------------------
export default function RegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    fullName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const verifiedRef = useRef(false);

  // SMART STATE UPDATE
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const nextStep = () => setCurrentStep((s) => s + 1);
  const prevStep = () => setCurrentStep((s) => s - 1);

  // --------------------------------------------
  // EMAIL VERIFICATION POLLING WITHOUT RE-RENDER
  // --------------------------------------------
  useEffect(() => {
    const checkEmailVerified = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email_confirmed_at && !verifiedRef.current) {
        verifiedRef.current = true;
        setEmailVerified(true);
        setSuccess("Email verified successfully!");
      }
    };

    const interval = setInterval(checkEmailVerified, 5000);
    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------
  // FORM SUBMIT
  // --------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 3) return;

    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: `${window.location.origin}/email-verification` },
      });

      if (authError) throw authError;

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Unable to get user ID from Supabase.");

      const { error: insertError } = await supabase
        .from("registration")
        .insert({
          auth_id: userId,
          full_name: formData.fullName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phone,
          address: formData.address,
          role: "user",
        });

      if (insertError) throw insertError;

      setSuccess("Registration successful! Please verify your email.");
      setCurrentStep(1);

      setFormData({
        fullName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      if (
        err?.code === "23505" ||
        (typeof err?.message === "string" &&
          err.message.includes("registration_email_key"))
      ) {
        setError("This email is already registered. Please login through the login page.");
      } else {
        setError(err.message || "Unexpected error.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------
  // MAIN UI
  // --------------------------------------------
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

      {/* FORM WRAPPER */}
      <div style={styles.container}>
        <div style={styles.overlay}></div>

        <div style={styles.box}>
          <h2 style={styles.title}>Register for Elite Nest</h2>

          <Alert type="error" message={error} />
          <Alert type="success" message={success} />

          <form onSubmit={handleSubmit} style={styles.form}>
            {currentStep === 1 && (
              <Step1
                formData={formData}
                handleChange={handleChange}
                nextStep={nextStep}
              />
            )}

            {currentStep === 2 && (
              <Step2
                formData={formData}
                handleChange={handleChange}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )}

            {currentStep === 3 && (
              <Step3
                formData={formData}
                handleChange={handleChange}
                prevStep={prevStep}
                loading={loading}
              />
            )}

            {emailVerified && (
              <p style={{ color: "#4ade80", fontWeight: "bold" }}>
                Email Verified ✔
              </p>
            )}

            <p style={styles.p}>
              Already have an account?{" "}
              <Link to="/loginpage" style={{ color: "#60a5fa" }}>
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
