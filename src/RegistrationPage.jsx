// src/RegistrationPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase.js";
import { styles } from "./AuthStyles.js";
import Alert from "./components/Alert.jsx";
import PasswordStrengthBar from "./components/PasswordStrengthBar.jsx";
import "./Dashboard.css";

// --------------------------------------------
// VALIDATION UTILITIES
// --------------------------------------------
const validatePhoneNumber = (phone) => {
  // Indian phone number format: 10 digits, optionally with +91 prefix
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ""));
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const getPasswordValidationErrors = (password) => {
  const errors = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/\d/.test(password)) errors.push("One number");
  if (!/[@$!%*?&]/.test(password)) errors.push("One special character (@$!%*?&)");
  return errors;
};

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

const Step2 = React.memo(function Step2({
  formData,
  handleChange,
  nextStep,
  prevStep,
  phoneError,
}) {
  const isPhoneValid = formData.phone === "" || validatePhoneNumber(formData.phone);

  return (
    <>
      <div>
        <input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone Number (10 digits or +91XXXXXXXXXX)"
          required
          style={{
            ...styles.input,
            borderColor: phoneError ? "#ef4444" : "#ccc",
            borderWidth: phoneError ? "2px" : "1px",
          }}
        />
        {phoneError && (
          <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
            ❌ {phoneError}
          </p>
        )}
        {formData.phone && isPhoneValid && (
          <p style={{ color: "#10b981", fontSize: "12px", marginTop: "4px" }}>
            ✅ Phone number is valid
          </p>
        )}
      </div>

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
        <button
          type="button"
          onClick={nextStep}
          disabled={!isPhoneValid || !formData.phone}
          style={{
            ...styles.button,
            opacity: isPhoneValid && formData.phone ? 1 : 0.5,
            cursor: isPhoneValid && formData.phone ? "pointer" : "not-allowed",
          }}
        >
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
  passwordErrors,
  passwordMatchError,
}) {
  const isPasswordValid = validatePassword(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;
  const isFormValid = isPasswordValid && passwordsMatch && formData.password;

  return (
    <>
      <div>
        <input
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          type="password"
          required
          style={{
            ...styles.input,
            borderColor: formData.password && !isPasswordValid ? "#ef4444" : "#ccc",
            borderWidth: formData.password && !isPasswordValid ? "2px" : "1px",
          }}
        />

        {formData.password && !isPasswordValid && (
          <div style={{ marginTop: "8px", padding: "8px", backgroundColor: "#fee2e2", borderRadius: "4px", borderLeft: "4px solid #ef4444" }}>
            <p style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: "bold", color: "#dc2626" }}>
              Password must contain:
            </p>
            <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "12px" }}>
              {passwordErrors.map((error, idx) => (
                <li key={idx} style={{ color: "#dc2626", marginBottom: "2px" }}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {formData.password && isPasswordValid && (
          <p style={{ color: "#10b981", fontSize: "12px", marginTop: "4px", fontWeight: "bold" }}>
            ✅ Password is strong
          </p>
        )}
      </div>

      <PasswordStrengthBar password={formData.password} />

      <div>
        <input
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          type="password"
          required
          style={{
            ...styles.input,
            borderColor: passwordMatchError ? "#ef4444" : "#ccc",
            borderWidth: passwordMatchError ? "2px" : "1px",
          }}
        />
        {passwordMatchError && (
          <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
            ❌ {passwordMatchError}
          </p>
        )}
        {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
          <p style={{ color: "#10b981", fontSize: "12px", marginTop: "4px" }}>
            ✅ Passwords match
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" onClick={prevStep} style={styles.button}>
          ← Back
        </button>

        <button
          type="submit"
          disabled={loading || !isFormValid}
          style={{
            ...styles.button,
            opacity: isFormValid && !loading ? 1 : 0.5,
            cursor: isFormValid && !loading ? "pointer" : "not-allowed",
          }}
        >
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

  // Validation state
  const phoneError = formData.phone && !validatePhoneNumber(formData.phone)
    ? "Phone number must be 10 digits (6-9 start) or +91XXXXXXXXXX format"
    : "";

  const passwordErrors = getPasswordValidationErrors(formData.password);

  const passwordMatchError = formData.confirmPassword && formData.password !== formData.confirmPassword
    ? "Passwords do not match"
    : "";

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

    // Final validation checks
    if (!validatePhoneNumber(formData.phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!validatePassword(formData.password)) {
      setError("Please ensure your password meets all requirements.");
      return;
    }

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
                phoneError={phoneError}
              />
            )}

            {currentStep === 3 && (
              <Step3
                formData={formData}
                handleChange={handleChange}
                prevStep={prevStep}
                loading={loading}
                passwordErrors={passwordErrors}
                passwordMatchError={passwordMatchError}
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