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
// Dashboard is now defined within this file, but we keep the Route definition.
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

// ------------------ NAVBAR ------------------
function Navbar({ isAuthenticated, onMenuToggle, handleSignOut }) {
  const navigate = useNavigate();
  const goToProperties = () => navigate("/properties");

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="navbar-brand">
          <Link to="/" style={{ textDecoration: "none" }}>
            <h1 className="brand-name">Elite Nest</h1>
          </Link>
        </div>
        <div className="navbar-links">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="nav-link">Home</Link>
          <span className="nav-link" onClick={goToProperties} style={{ cursor: "pointer" }}>Properties</span>
          <Link to="/contact" className="nav-link">Contact</Link>
          <Link to="/about" className="nav-link">About Us</Link>
        </div>
      </div>
      
      <div className="nav-right">
        {isAuthenticated ? (
          <>
            {/* Hamburger Button (Menu Toggle) */}
            <button 
              className="menu-toggle-btn"
              onClick={onMenuToggle}
              style={{ 
                fontSize: '24px', 
                color: 'white', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                marginRight: '15px' 
              }}
            >
              ☰
            </button>
            <button onClick={handleSignOut} className="btn-login-nav">
              Sign Out
            </button>
          </>
        ) : (
          <Link to="/loginpage" className="btn-login-nav unified-auth-btn">
            Login / Signup
          </Link>
        )}
      </div>
    </nav>
  );
}

// ------------------ HOME PAGE ------------------
function HomePage() {
  const [startIndex, setStartIndex] = useState(0);
  const cardsPerPage = 3;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch properties from database
    const loadProperties = async () => {
      setLoading(true);
      const data = await fetchProperties();
      setProperties(data);
      setLoading(false);
    };
    loadProperties();
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const next = () => setStartIndex((prev) => (prev + cardsPerPage >= properties.length ? 0 : prev + cardsPerPage));
  const prev = () => setStartIndex((prev) => Math.max(0, prev - cardsPerPage));
  const visibleProperties = properties.slice(startIndex, startIndex + cardsPerPage);

  const handleViewDetailsClick = async (propertyId) => {
    // Check user state first (fast path)
    if (user) {
      navigate(`/properties/${propertyId}`);
      return;
    }

    // If user state is not set, check session directly (fallback)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser); // Update state for future clicks
        navigate(`/properties/${propertyId}`);
      } else {
        navigate("/loginpage", { state: { from: `/properties/${propertyId}` } });
      }
    } catch (error) {
      // If there's an error checking auth, redirect to login
      navigate("/loginpage", { state: { from: `/properties/${propertyId}` } });
    }
  };
  
  // Dummy Navbar for consistency on Home page (as it's outside <Routes>)
  function DummyNavbar() {
    const navigate = useNavigate();
    const goToProperties = () => navigate("/properties");
    return (
      <nav className="navbar">
        <div className="nav-left">
          <div className="navbar-brand">
            <Link to="/" style={{ textDecoration: "none" }}>
              <h1 className="brand-name">Elite Nest</h1>
            </Link>
          </div>
          <div className="navbar-links">
            <Link to="/" className="nav-link">Home</Link>
            <span className="nav-link" onClick={goToProperties} style={{ cursor: "pointer" }}>Properties</span>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/about" className="nav-link">About Us</Link>
          </div>
        </div>
        <div className="nav-right">
          <Link to="/loginpage" className="btn-login-nav unified-auth-btn">Login / Signup</Link>
        </div>
      </nav>
    );
  }

  return (
    <div className="home-container">
      <DummyNavbar />

      {/* HERO SECTION */}
      <section className="hero">
        <div className="overlay"></div>
        <div className="hero-content">
          <h1>Find Your Perfect Home</h1>
          <p>Rent beautiful houses, apartments and rooms at the best prices.</p>
          <div className="search-box">
            <input type="text" placeholder="Location" />
            <select>
              <option>Property Type</option>
              <option>Apartment</option>
              <option>Villa</option>
              <option>Independent House</option>
              <option>PG / Rooms</option>
            </select>
            <select>
              <option>Price Range</option>
              <option>₹5,000 - ₹10,000</option>
              <option>₹10,000 - ₹20,000</option>
              <option>₹20,000 - ₹30,000</option>
              <option>Above ₹50,000</option>
            </select>
            <button>Search</button>
          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES SLIDER */}
      <section className="featured-section" id="properties">
        <h2 style={{ color: "black" }}>Featured Properties</h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "white" }}>
            Loading properties...
          </div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "white" }}>
            No properties available at the moment.
          </div>
        ) : (
          <div className="property-grid-container" style={{ position: "relative" }}>
            <button 
              onClick={prev} 
              disabled={startIndex === 0 || properties.length === 0}
              style={{ position: "absolute", left: "0", top: "50%", transform: "translate(-50%, -50%)", background: startIndex === 0 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: startIndex === 0 ? "default" : "pointer", zIndex: 2 }}>
              &#10094;
            </button>
            <div className="property-grid" style={{ display: "flex", gap: "15px", overflow: "hidden" }}>
              {visibleProperties.map((p) => (
              <div key={p.id} className="property-card" style={{ flex: "0 0 calc(33.333% - 10px)" }}>
                <img src={p.img} alt={p.title} style={{ cursor: "pointer" }} onClick={() => handleViewDetailsClick(p.id)} />
                <h3>{p.title}</h3>
                <p>{p.price} • {p.location}</p>
                
                <button 
                  onClick={() => handleViewDetailsClick(p.id)}
                  style={{ marginTop: "10px", padding: "8px 12px", backgroundColor: "#1e40af", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = "#2563eb"}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = "#1e40af"}>
                  View Details
                </button>
              </div>
              ))}
            </div>
            <button onClick={next} disabled={properties.length === 0 || startIndex + cardsPerPage >= properties.length} style={{ position: "absolute", right: "0", top: "50%", transform: "translate(50%, -50%)", background: (properties.length === 0 || startIndex + cardsPerPage >= properties.length) ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: (properties.length === 0 || startIndex + cardsPerPage >= properties.length) ? "default" : "pointer", zIndex: 2 }}>&#10095;</button>
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <Link to="/properties">
            <button style={{ backgroundColor: "#1e40af", color: "#fff", border: "none", borderRadius: "5px", padding: "10px 18px", cursor: "pointer" }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#2563eb"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "#1e40af"}>
              View More
            </button>
          </Link>
        </div>
      </section>

      {/* ABOUT US & CONTACT US SECTION */}
      <section className="info-cards-section" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "30px", padding: "50px 20px", backgroundColor: "#f9fafb" }}>
        
        {/* ABOUT US CARD */}
        <div className="card" style={{ flex: "1 1 300px", maxWidth: "400px", padding: "30px", borderRadius: "12px", backgroundColor: "#ffffff", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", textAlign: "center" }}>
          <h2>🏠 About Elite Nest</h2>
          <p style={{ margin: "20px 0" }}>
            Elite Nest is committed to helping you find your dream home. We provide verified listings, quality support, and a seamless renting experience.
          </p>
          <Link to="/about">
            <button style={{ padding: "10px 20px", borderRadius: "5px", backgroundColor: "#1e40af", color: "#fff", border: "none", cursor: "pointer" }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#2563eb"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "#1e40af"}>
              Learn More
            </button>
          </Link>
        </div>

        {/* CONTACT US CARD */}
        <div className="card" style={{ flex: "1 1 300px", maxWidth: "400px", padding: "30px", borderRadius: "12px", backgroundColor: "#ffffff", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", textAlign: "center" }}>
          <h2>📞 Contact Us</h2>
          <p style={{ margin: "20px 0" }}>
            Have questions or need assistance? Our team is here to help. Reach out via phone or email.
          </p>
          <Link to="/contact">
            <button style={{ padding: "10px 20px", borderRadius: "5px", backgroundColor: "#1e40af", color: "#fff", border: "none", cursor: "pointer" }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#2563eb"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "#1e40af"}>
              Get in Touch
            </button>
          </Link>
        </div>

      </section>
    </div>
  );
}

// Note: PropertyDetailsPage is now in its own file (PropertyDetailsPage.jsx)

// ------------------ CONTACT PAGE ------------------
function DetailedContactPage() {
  return (
    <div className="contact-page">
      <section className="contact-hero">
        <h1>Contact Elite Nest</h1>
        <p>We're here to assist you — reach out anytime</p>
      </section>
      <section className="contact-section">
        <h2>Get in Touch</h2>
        <div className="contact-container">
          <div className="contact-info-box"><h3>📍 Address</h3><p>Elite Nest Headquarters<br />123 Property Street<br />Mumbai, India - 400001</p></div>
          <div className="contact-info-box"><h3>📞 Phone</h3><p>+91-1234567890<br />+91-9876543210<br />Mon - Fri: 9AM - 6PM</p></div>
          <div className="contact-info-box"><h3>📧 Email</h3><p>support@elitenest.com<br />info@elitenest.com<br />sales@elitenest.com</p></div>
          <div className="contact-info-box"><h3>⏰ Hours</h3><p>Mon - Fri: 9AM - 6PM<br />Sat: 9AM - 1PM<br />Sunday: Closed</p></div>
        </div>
      </section>
      <footer className="contact-footer">© {new Date().getFullYear()} Elite Nest • All Rights Reserved</footer>
    </div>
  );
}

// ------------------ DASHBOARD ------------------
function Dashboard({ menuOpen, setMenuOpen }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Fetch properties for dashboard
    const loadProperties = async () => {
      const data = await fetchProperties();
      setProperties(data);
    };
    loadProperties();
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (!error) navigate("/", { replace: true });
    else setLoading(false);
  };
  

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    // This part should theoretically be handled by ProtectedRoute wrapper
    return (
      <div className="dashboard-access-denied">
        <h2>Access Denied</h2>
        <p>Please log in to view your dashboard.</p>
        <Link to="/loginpage">
          <button className="btn-primary">Go to Login</button>
        </Link>
      </div>
    );
  }

  const greeting = user.user_metadata?.full_name || user.email.split("@")[0];

  return (
    <div className="dashboard-container">
      {/* Dashboard Content */}
      <div className="dashboard-content"> 
        {/* Welcome Header */}
        <div className="dashboard-header">
          <div className="dashboard-welcome">
            <h1 className="dashboard-greeting">Welcome back, {greeting}! 👋</h1>
          </div>
        </div>

        {/* Sell Property Banner */}
        <Link to="/seller" style={{ textDecoration: "none" }}>
          <div className="sell-property-banner">
            <div className="sell-property-content">
              <div className="sell-property-icon">🏠</div>
              <div className="sell-property-text">
                <h2 className="sell-property-title">
                  Do you want to sell properties?
                </h2>
                <p className="sell-property-subtitle">
                  List your property and reach thousands of potential buyers
                </p>
              </div>
              <div className="sell-property-arrow">→</div>
            </div>
          </div>
        </Link>

        {/* All Properties Section */}
        <h2 className="dashboard-section-title">All Properties</h2>
        
        <div className="dashboard-properties-grid">
          {properties.length > 0 ? properties.map((property) => (
            <div key={property.id} className="dashboard-property-card">
              <div className="dashboard-property-image-container">
                <img 
                  src={property.img} 
                  alt={property.title}
                  className="dashboard-property-image"
                />
              </div>
              <div className="dashboard-property-content">
                <h3 className="dashboard-property-title">{property.title}</h3>
                <p className="dashboard-property-details">
                  {property.bedrooms} • {property.location}
                </p>
                <p className="dashboard-property-price">{property.price}</p>
                <p className="dashboard-property-contact">📞 {property.contact}</p>
                <Link to={`/properties/${property.id}`} className="dashboard-property-button">
                  View Details
                </Link>
              </div>
            </div>
          )) : (
            <p style={{ textAlign: 'center', padding: '20px' }}>No properties available</p>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Check auth state on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setMenuOpen(false); // Close menu on auth state change
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
    setMenuOpen(false);
  };

  const toggleMenu = () => setMenuOpen(prev => !prev);
  
  if (loading) return <div>Loading Application...</div>;
  
  // Conditionally render Navbar based on user state
  const AppNavbar = (
      <Navbar 
          isAuthenticated={!!user} 
          onMenuToggle={toggleMenu} 
          handleSignOut={handleSignOut} 
      />
  );

  return (
    <>
      <ScrollToHash />
      <PasswordRecoveryListener />
      
      {/* Render Navbar outside of Routes to appear on all pages (except HomePage which has its own) */}
      {user || (window.location.pathname !== '/' && window.location.pathname !== '/loginpage') ? AppNavbar : null}

      {/* RIGHT SIDE MENU - Global Menu */}
      {user && menuOpen && (
        <div 
          className="dashboard-right-menu"
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            height: "100vh",
            width: "280px",
            backgroundColor: "#1e293b",
            zIndex: 1000,
            boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
            overflowY: "auto"
          }}
        >
          <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 className="sidebar-title" style={{ margin: 0, color: "#fff" }}>Menu</h3>
            <button
              onClick={toggleMenu}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "24px",
                cursor: "pointer",
                padding: "5px"
              }}
            >
              ×
            </button>
          </div>
          <ul className="sidebar-menu">
            <li>
              <button onClick={() => { navigate("/dashboard"); setMenuOpen(false); }} className="sidebar-link">
                <span className="sidebar-link-icon">🏠</span> Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => { navigate("/profile"); setMenuOpen(false); }} className="sidebar-link">
                <span className="sidebar-link-icon">👤</span> My Profile
              </button>
            </li>
            <li>
              <button onClick={() => { navigate("/mylistings"); setMenuOpen(false); }} className="sidebar-link">
                <span className="sidebar-link-icon">📋</span> My Listings
              </button>
            </li>
            <li>
              <button onClick={() => { navigate("/favorites"); setMenuOpen(false); }} className="sidebar-link">
                <span className="sidebar-link-icon">📅</span> Appointment History
              </button>
            </li>
            <li>
              <button onClick={() => { navigate("/messages"); setMenuOpen(false); }} className="sidebar-link">
                <span className="sidebar-link-icon">💬</span> Messages
              </button>
            </li>
            <li>
              <button onClick={() => { navigate("/notifications"); setMenuOpen(false); }} className="sidebar-link">
                <span className="sidebar-link-icon">🔔</span> Notifications
              </button>
            </li>
            <li>
              <button onClick={() => { navigate("/seller"); setMenuOpen(false); }} className="sidebar-link">
                <span className="sidebar-link-icon">➕</span> Sell Property
              </button>
            </li>
            <li>
              <button onClick={handleSignOut} className="sidebar-link sidebar-signout">
                <span className="sidebar-link-icon">🚪</span> Sign Out
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {user && menuOpen && (
        <div
          onClick={toggleMenu}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999
          }}
        />
      )}

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
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard menuOpen={menuOpen} setMenuOpen={setMenuOpen} /></ProtectedRoute>} />
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