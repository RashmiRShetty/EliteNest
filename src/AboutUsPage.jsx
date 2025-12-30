import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import "./aboutus.css";

// Reuse the SAME Navbar logic/style as App.jsx
function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const goToProperties = () => navigate("/properties");

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="navbar-brand">
          <Link to="/" style={{ textDecoration: "none" }}>
            <h1 className="brand-name">Elite Nest</h1>
          </Link>
        </div>
        <div className="navbar-links">
          <Link to={user ? "/dashboard" : "/"} className="nav-link">Home</Link>
          <span className="nav-link" onClick={goToProperties} style={{ cursor: "pointer" }}>Properties</span>
          <Link to="/contact" className="nav-link">Contact</Link>
          <Link to="/about" className="nav-link">About Us</Link>
        </div>
      </div>
      <div className="nav-right">
        {user ? (
          <button onClick={handleSignOut} className="btn-login-nav">
            Sign Out
          </button>
        ) : (
          <Link to="/loginpage" className="btn-login-nav unified-auth-btn">Login / Signup</Link>
        )}
      </div>
    </nav>
  );
}

const AboutUsPage = () => {
  return (
    <div className="about-container">

      {/* GLOBAL NAVBAR (Same as App.jsx) */}
      <Navbar />

      {/* HERO */}
      <section className="about-hero">
        <h1>About Elite Nest</h1>
        <p>Building Trust. Delivering Homes. Creating Lifestyle.</p>
      </section>

      {/* INTRO */}
      <section className="about-intro">
        <p>
          Elite Nest is a modern real estate platform designed to make property
          renting simple, transparent, and stress-free. Whether you're searching
          for your first apartment, a premium luxury rental, or the perfect
          place to call home — Elite Nest connects people to trusted homeowners
          and verified listings across India.
        </p>
      </section>

      {/* MISSION & VISION */}
      <section className="mv-section">
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div className="mv-box">
            <h2>🎯 Our Mission</h2>
            <p>
              To revolutionize the rental experience by offering safe, verified,
              and premium housing solutions with complete transparency and
              efficiency.
            </p>
          </div>

          <div className="mv-box">
            <h2>🚀 Our Vision</h2>
            <p>
              To become India's most trusted rental housing brand by blending
              smart technology, personalized support, and premium living solutions.
            </p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="values-section">
        <h2>Our Core Values</h2>
        <div className="values-grid">
          <div className="value-card">💙 Trust & Transparency</div>
          <div className="value-card">🏡 Quality Living</div>
          <div className="value-card">🤝 Customer First</div>
          <div className="value-card">💡 Innovation & Technology</div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <h2>Ready to Find Your Next Home?</h2>
        <Link to="/properties">
          <button className="cta-btn">Explore Properties →</button>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="about-footer">
        © {new Date().getFullYear()} Elite Nest — Premium Living Made Simple.
      </footer>
    </div>
  );
};

export default AboutUsPage;
