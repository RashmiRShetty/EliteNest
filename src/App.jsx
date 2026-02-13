import React, { useState, useEffect } from "react";
import "./App.css";
import "./contact.css";
import { Link, Routes, Route, useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabase";

// AUTH PAGES (Placeholders for external files)
import LoginPage from "./LoginPage.jsx";
import RegistrationPage from "./RegistrationPage.jsx";
import ForgotPasswordPage from "./ForgotPasswordPage.jsx";
import ResetPassword from "./ResetPasswordPage.jsx";
import AdminLanding from "./Admin/Adminlanding.jsx";
import AdminDashboard from "./Admin/Admindashboard"; // or "./pages/AdminDashboard"

// DASHBOARDS
import Dashboard from "./Dashboard";
import ProtectedRoute from "./ProtectedRoute.jsx"; // Placeholder


// ABOUT PAGE
import AboutUsPage from "./AboutUsPage.jsx"; // Placeholder

// PROPERTIES PAGE
import PropertiesPage from "./PropertiesPage.jsx";
import PropertyDetailsPage from "./PropertyDetailsPage.jsx";
import SellerPage from "./Seller.jsx"; // Placeholder
import PropertyFormPage from "./PropertyForm.jsx"; // New Import

// USER PAGES
import ProfilePage from "./ProfilePage.jsx";
import MyListingsPage from "./MyListingsPage.jsx";
import FavoritesPage from "./FavoritesPage.jsx";
import MessagesPage from "./MessagesPage.jsx";
import NotificationsPage from "./NotificationsPage.jsx";
import DetailedContactPage from "./DetailedContactPage.jsx";

// ------------------ GLOBAL HASH SCROLL ------------------
function ScrollToHash() {
  const { hash, pathname } = useLocation();
  React.useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash, pathname]);
  return null;
}

// Import property fetching utility
import { fetchProperties } from "./utils/properties";

// ------------------ HOME PAGE ------------------
import HomePage from "./HomePage.jsx";

// Note: PropertyDetailsPage is now in its own file (PropertyDetailsPage.jsx)



// ------------------ DASHBOARD ------------------
// Dashboard is now imported from external file


// ------------------ PASSWORD RECOVERY LISTENER ------------------
function PasswordRecoveryListener() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") navigate("/reset-password");
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]); 
  return null;
}

// ------------------ APP (MAIN COMPONENT) ------------------
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check auth state on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading Application...</div>;
  
  return (
    <>
      <ScrollToHash />
      <PasswordRecoveryListener />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* AUTH */}
        <Route path="/loginpage" element={<LoginPage />} />
        <Route path="/loginpage/admin" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* PUBLIC (Rendered with the conditional AppNavbar) */}
        <Route path="/seller" element={<SellerPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetailsPage /></ProtectedRoute>} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/contact" element={<DetailedContactPage />} />
        <Route path="/propertyform" element={<PropertyFormPage />} />
        // Inside App.jsx

        {/* PROTECTED */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/mylistings" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} /> 
        <Route path="/admin" element={<AdminLanding />} />
      </Routes>
      
    </>
  );
}

export default App;
