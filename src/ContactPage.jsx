import React from "react";
import "./contact.css";
import "./Home.css";
import { Link } from "react-router-dom";

export default function ContactPage() {
  return (
    <div className="contact-page">

      {/* 🔹 NAVBAR */}
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
          <Link to="/loginpage" className="btn-login-nav unified-auth-btn">
            Login / Signup
          </Link>
        </div>
      </nav>

      {/* 🔷 HERO + CONTACT INFO SIDE-BY-SIDE */}
      <section className="contact-section" style={{ flexDirection: "row", textAlign: "left", padding: "80px 50px" }}>
        {/* Left: Hero Text */}
        <div style={{ flex: 1, marginRight: "50px" }}>
          <h1 style={{ fontSize: "2.5rem", color: "#ffc857", marginBottom: "20px" }}>
            Get in Touch with Elite Nest
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.9)", lineHeight: "1.6" }}>
            Whether you have questions about our properties or need assistance with your account, we are here to help. 
            Contact us via phone, email, or visit our office. We’ll make sure your experience is smooth and seamless.
          </p>
        </div>

        {/* Right: Contact Info Boxes */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>
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
              Mon - Fri: 9AM - 6PM<br />
              Sat: 9AM - 1PM<br />
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
