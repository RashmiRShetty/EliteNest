import React from "react";
import "./seller.css";
import "./Home.css"; // Overall styles/navbar
import { Link, useNavigate } from "react-router-dom";

const Seller = () => {
  const navigate = useNavigate();

  // Sign out logic
  const handleSignOut = () => {
    console.log("User signed out.");
    alert("You have been signed out.");
    // Optional: Redirect using react-router history if needed
  };

  // Navigation handlers
  const handleSellProperty = () => {
    navigate("/propertyform", { state: { propertyType: "Sell" } });
  };

  const handleRentProperty = () => {
    navigate("/propertyform", { state: { propertyType: "Rent" } });
  };

  const handleLeaseProperty = () => {
    navigate("/propertyform", { state: { propertyType: "Lease" } });
  };

  return (
    <div className="seller-landing-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <div className="navbar-brand">
            <Link to="/" style={{ textDecoration: "none" }}>
              <h1 className="brand-name">Elite Nest</h1>
            </Link>
          </div>
          <div className="navbar-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/properties" className="nav-link">Properties</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/about" className="nav-link">About Us</Link>
          </div>
        </div>
        <div className="nav-right">
          <button className="signout-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* LANDING CONTENT */}
      <div className="overlay"></div>
      <h1 className="landing-title">Become a Property Seller with Us 🏠</h1>
      <p className="landing-subtitle">
        List your property for <span>Sell</span>, <span>Rent</span>, or <span>Lease</span> and connect with genuine buyers & tenants instantly.
      </p>

      <div className="cta-buttons">
        <button className="cta-btn" onClick={handleSellProperty}>Sell Property</button>
        <button className="cta-btn" onClick={handleRentProperty}>Rent Property</button>
        <button className="cta-btn" onClick={handleLeaseProperty}>Lease Property</button>
      </div>

      <p className="landing-footer">
        100% Free Listing • Verified Leads • No Middlemen
      </p>
    </div>
  );
};

export default Seller;
