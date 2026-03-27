import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase.js";
import { styles } from "./AuthStyles.js";
import Alert from "./components/Alert.jsx";

export default function EmailVerificationPage() {
  const [message, setMessage] = useState(
    "Verifying your email. This may take a moment..."
  );
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let listener = null;
    
    try {
      const authStateChange = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            setMessage("Email verified successfully! Redirecting to login...");
            // Sign out so user logs in with password after verification
            await supabase.auth.signOut({ scope: 'local' });
            setTimeout(() => navigate("/login"), 1500);
          }
        }
      );
      listener = authStateChange.data;
    } catch (err) {
      console.error("Error setting up auth state listener:", err);
      setError("Could not set up email verification. Please try again.");
    }

    // Fallback: if user already signed in when arriving here (from magic link)
    supabase.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        if (data?.user) {
          setMessage("Email verified successfully! Redirecting to login...");
          await supabase.auth.signOut({ scope: 'local' });
          setTimeout(() => navigate("/login"), 1500);
        }
      })
      .catch((err) => {
        console.error("Error getting user:", err);
        setError("Could not verify email. Please try the link again.");
      });

    return () => {
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <div style={styles.box}>
        <h2 style={styles.title}>Email Verification</h2>
        <Alert type="error" message={error} />
        <Alert type="success" message={!error ? message : ""} />
      </div>
    </div>
  );
}


