// ProtectedRoute.jsx
import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "./supabase";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    // Check authentication - try multiple methods to ensure we get the session
    const checkAuth = async (isRetry = false) => {
      if (!mounted) return;
      
      try {
        // Method 1: Check session from storage (fastest, reads from localStorage)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          setUser(session.user);
          setLoading(false);
          return;
        }

        if (sessionError && !isRetry) {
          console.warn("ProtectedRoute: Session error, will retry", sessionError);
        }

        // Method 2: Check user (validates with server)
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (currentUser && mounted) {
          setUser(currentUser);
          setLoading(false);
          return;
        }

        // If no session found and we haven't retried, try again after a short delay
        if (!isRetry && retryCount < maxRetries && mounted) {
          retryCount++;
          setTimeout(() => {
            if (mounted) checkAuth(true);
          }, 200);
          return;
        }

        // If we get here after retries, no valid session found
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("ProtectedRoute: Auth check error", error);
        if (mounted && retryCount < maxRetries && !isRetry) {
          retryCount++;
          setTimeout(() => {
            if (mounted) checkAuth(true);
          }, 200);
        } else if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Check immediately
    checkAuth();

    // Also listen for auth state changes (this fires on login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    // Redirect to login with the current location as state so we can redirect back after login
    return <Navigate to="/loginpage" state={{ from: location.pathname }} replace />;
  }

  return children;
}
