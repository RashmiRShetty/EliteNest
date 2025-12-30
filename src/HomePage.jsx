import React from "react";
import { Link } from "react-router-dom";
import "./App.css";

export default function HomePage() {
  return (
    <div className="home-container">

      {/* 🔹 NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <div className="navbar-brand">
            <Link to="/"> 
              <h1 className="brand-name">Elite Nest</h1>
            </Link>
          </div>
          <div className="navbar-links">
            <Link to="/" className="nav-link">Home</Link>
            {/* Uses <a> for in-page scroll to #properties */}
            <a href="#properties" className="nav-link">Properties</a> 
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/about" className="nav-link">About Us</Link> 
          </div>
        </div>

        <div className="nav-right">
          <Link to="/loginpage" className="btn-login-nav">Login / SignUp</Link>
        </div>
      </nav>

      {/* 🔹 HERO SECTION */}
      <section className="hero">
        <div className="overlay"></div>
        <div className="hero-content">
          <h1>Find Your Perfect Home</h1>
          <p>Rent beautiful houses, apartments and rooms at the best prices.</p>

          {/* 🔹 SEARCH BAR */}
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

      {/* 🔹 FEATURED PROPERTIES */}
      <section className="featured-section" id="properties">
        <h2>Featured Properties</h2>

        <div className="property-grid">

          {/* CARD 1 */}
          <div className="property-card">
            <img
              src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
              alt="Property"
            />
            <h3>Modern Apartment</h3>
            <p>2 BHK • ₹18,000/month • Mumbai</p>
            <p className="contact-info">📞 +91-9876543210</p>
            <Link to="/properties/1" className="btn-view-details"><button>View Details</button></Link>
          </div>

          {/* CARD 2 */}
          <div className="property-card">
            <img
              src="https://images.unsplash.com/photo-1572120360610-d971b9d7767c"
              alt="Property"
            />
            <h3>Luxury Villa</h3>
            <p>4 BHK • ₹45,000/month • Bangalore</p>
            <p className="contact-info">📞 +91-9876543211</p>
            <Link to="/properties/2" className="btn-view-details"><button>View Details</button></Link>
          </div>

          {/* CARD 3 */}
          <div className="property-card">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
              alt="Property"
            />
            <h3>Independent House</h3>
            <p>3 BHK • ₹28,000/month • Hyderabad</p>
            <p className="contact-info">📞 +91-9876543212</p>
            <Link to="/properties/3" className="btn-view-details"><button>View Details</button></Link>
          </div>

        </div>
      </section>

      {/* 🔹 CONTACT SECTION (Kept for visual design) */}
      <section className="contact-section" id="contact-old">
        <h2>Get in Touch (Old Section)</h2>
        <div className="contact-container">
          {/* ... Contact Info Boxes ... */}
        </div>
      </section>
    </div>
  );
}