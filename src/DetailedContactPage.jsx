import React from "react";
import { Link } from "react-router-dom";
// NOTE: You would need to ensure you have contact.css and Home.css available
// import "./contact.css"; 
// import "./Home.css"; 

export default function DetailedContactPage() {
  return (
    <div className="contact-page">

      {/* 🔹 NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <div className="navbar-brand">
            <Link to="/" style={{ textDecoration: 'none' }}>
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
          <Link to="/loginpage" className="btn-login-nav">Login</Link>
          <Link to="/register" className="btn-register">Sign Up</Link>
        </div>
      </nav>

      {/* 🔷 HERO HEADER SECTION */}
      <section className="contact-hero">
        <h1>Contact Elite Nest</h1>
        <p>We're here to assist you — reach out anytime</p>
      </section>

      {/* 🔷 CONTACT INFO SECTION */}
      <section className="contact-section">
        <h2>Get in Touch</h2>

        <div className="contact-container">
          <div className="contact-info-box">
            <h3>📍 Address</h3>
            <p>
              Elite Nest Headquarters<br />
              123 Property Street<br />
              Mumbai, India - 400001
            </p>
          </div>

          <div className="contact-info-box">
            <h3>📞 Phone</h3>
            <p>
              +91-1234567890<br />
              +91-9876543210<br />
              Mon - Fri: 9AM - 6PM
            </p>
          </div>

          <div className="contact-info-box">
            <h3>📧 Email</h3>
            <p>
              support@elitenest.com<br />
              info@elitenest.com<br />
              sales@elitenest.com
            </p>
          </div>

          <div className="contact-info-box">
            <h3>⏰ Hours</h3>
            <p>
              Monday - Friday: 9:00 AM - 6:00 PM<br />
              Saturday: 9:00 AM - 1:00 PM<br />
              Sunday: Closed
            </p>
          </div>
        </div>
      </section>

      {/* 🔷 FOOTER */}
      <footer className="contact-footer">
        © {new Date().getFullYear()} Elite Nest • All Rights Reserved
      </footer>
    </div>
  );
}