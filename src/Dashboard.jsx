// Dashboard.jsx - Premium Design Matching Landing Page
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { fetchProperties } from "./utils/properties";
import "./App.css";

const mockData = {
  savedProperties: 7,
  messages: 3,
  notifications: 1,
  rentDue: "Not Due (Next: 2025-12-01)",
  rentAmount: "₹18,000",
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    // Fetch properties from database
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
  const provider = user.app_metadata.provider || "Email/Password";

  const handleSellPropertyClick = () => {
    // Navigate to sell property page or show form
    navigate("/sell-property");
    // Or you can use: window.location.href = "/sell-property";
  };

  return (
    <div className="dashboard-container">
      {/* Navbar matching landing page */}
      <nav className="navbar">
        <div className="nav-left">
          <div className="navbar-brand">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h1 className="brand-name">Elite Nest</h1>
            </Link>
          </div>
          <div className="navbar-links">
            <Link to="/dashboard" className="nav-link">Home</Link>
            <Link to="/properties" className="nav-link">Properties</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/about" className="nav-link">About Us</Link>
          </div>
        </div>

        <div className="nav-right">
          <button onClick={handleSignOut} className="btn-login-nav">
            Sign Out
          </button>
        </div>
      </nav>

      {/* Left Hover Sidebar */}
      <div 
        className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="sidebar-toggle">
          <span className="sidebar-icon">☰</span>
        </div>
        <div className="sidebar-content">
          <h3 className="sidebar-title">Menu</h3>
          <ul className="sidebar-menu">
            <li>
              <Link to="/dashboard" className="sidebar-link">
                <span className="sidebar-link-icon">🏠</span>
                <span className="sidebar-link-text">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/profile" className="sidebar-link">
                <span className="sidebar-link-icon">👤</span>
                <span className="sidebar-link-text">My Profile</span>
              </Link>
            </li>
            <li>
              <Link to="/mylistings" className="sidebar-link">
                <span className="sidebar-link-icon">📋</span>
                <span className="sidebar-link-text">My Listings</span>
              </Link>
            </li>
            <li>
              <Link to="/favorites" className="sidebar-link">
                <span className="sidebar-link-icon">💖</span>
                <span className="sidebar-link-text">Saved Properties</span>
              </Link>
            </li>
            <li>
              <Link to="/messages" className="sidebar-link">
                <span className="sidebar-link-icon">💬</span>
                <span className="sidebar-link-text">Messages</span>
              </Link>
            </li>
            <li>
              <Link to="/notifications" className="sidebar-link">
                <span className="sidebar-link-icon">🔔</span>
                <span className="sidebar-link-text">Notifications</span>
              </Link>
            </li>
            <li>
              <Link to="/sell-property" className="sidebar-link">
                <span className="sidebar-link-icon">➕</span>
                <span className="sidebar-link-text">Sell Property</span>
              </Link>
            </li>
            <li>
              <button onClick={handleSignOut} className="sidebar-link sidebar-signout">
                <span className="sidebar-link-icon">🚪</span>
                <span className="sidebar-link-text">Sign Out</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className={`dashboard-content ${sidebarOpen ? 'content-shifted' : ''}`}>
        {/* Dashboard Stats */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Rent Due</h3>
            <p className="stat-value">{mockData.rentDue}</p>
            <p className="stat-amount">{mockData.rentAmount}</p>
          </div>
          <div className="stat-card">
            <h3>Saved Properties</h3>
            <p className="stat-value">{mockData.savedProperties}</p>
          </div>
          <div className="stat-card">
            <h3>Messages</h3>
            <p className="stat-value">{mockData.messages}</p>
          </div>
          <div className="stat-card">
            <h3>Notifications</h3>
            <p className="stat-value">{mockData.notifications}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-btn" onClick={() => navigate('/properties')}>
            <span className="action-icon">🔍</span>
            Browse Properties
          </button>
          <button className="action-btn" onClick={() => alert('Pay Rent feature coming soon!')}>
            <span className="action-icon">💳</span>
            Pay Rent
          </button>
          <button className="action-btn" onClick={() => alert('Maintenance request feature coming soon!')}>
            <span className="action-icon">🔧</span>
            Request Maintenance
          </button>
          <button className="action-btn" onClick={() => alert('Digital agreement feature coming soon!')}>
            <span className="action-icon">📄</span>
            View Agreement
          </button>
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
                  src={property.img || property.image || "https://via.placeholder.com/400"} 
                  alt={property.title}
                  className="dashboard-property-image"
                />
              </div>
              <div className="dashboard-property-content">
                <h3 className="dashboard-property-title">{property.title}</h3>
                <p className="dashboard-property-details">
                  {property.bedrooms} • {property.location}
                </p>
                <p className="dashboard-property-price">₹{typeof property.price === 'number' ? property.price.toLocaleString() : property.price}{property.type === 'sale' ? '' : '/month'}</p>
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