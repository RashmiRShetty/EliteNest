import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import "./Aboutus.css";
import "./Dashboard.css";

const Icons = {
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Property: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Heart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Message: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
};

const AboutUsPage = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('elitenest:sidebarCollapsed');
      if (saved === '0') return false;
      if (saved === '1') return true;
      return false;
    } catch {
      return false;
    }
  });
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);
  const closeSidebarOnWeb = () => {
    setSidebarCollapsed(true);
    localStorage.setItem('elitenest:sidebarCollapsed', '1');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('elitenest:sidebarCollapsed', next ? '1' : '0');
      return next;
    });
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    navigate("/", { replace: true });
  };

  const greeting = user ? (user.user_metadata?.full_name || user.email?.split("@")[0] || "User") : "User";

  if (!user) {
    return (
      <div className="dashboard-container dark-theme">
        <main className="main-content" style={{ marginLeft: 0 }}>
          <header className="top-header">
            <div className="header-left">
              <Link to={user ? "/dashboard" : "/"} className="header-brand">
                <img
                  src="/elite-nest-logo.png"
                  alt="Elite Nest"
                  style={{ height: "56px", objectFit: "contain" }}
                />
                <span style={{ marginLeft: "8px", fontWeight: 800 }}>Elite Nest</span>
              </Link>
              <nav className="header-links">
                <Link to={user ? "/dashboard" : "/"} className="header-link">
                  {user ? "Dashboard" : "Home"}
                </Link>
                <Link to="/properties" className="header-link">Properties</Link>
                <Link to="/contact" className="header-link">Contact</Link>
                <Link to="/about" className="header-link">About Us</Link>
              </nav>
            </div>
            <div className="header-actions">
              <Link to="/loginpage" style={{ textDecoration: 'none' }}>
                <button className="promo-btn" style={{ padding: '8px 20px', fontSize: '14px' }}>
                  Sign In
                </button>
              </Link>
            </div>
          </header>
          <div className="dashboard-page-content">
      <section className="about-hero">
        <h1>About Elite Nest</h1>
        <p>Building Trust. Delivering Homes. Creating Lifestyle.</p>
      </section>

      <section className="about-intro">
        <p>
          Elite Nest is a modern real estate platform designed to make property
          renting simple, transparent, and stress-free. Whether you're searching
          for your first apartment, a premium luxury rental, or the perfect
          place to call home — Elite Nest connects people to trusted homeowners
          and verified listings across India.
        </p>
      </section>

      <section className="mv-section">
        <div className="mv-grid">
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

      <section className="values-section">
        <h2>Our Core Values</h2>
        <div className="values-grid">
          <div className="value-card">💙 Trust & Transparency</div>
          <div className="value-card">🏡 Quality Living</div>
          <div className="value-card">🤝 Customer First</div>
          <div className="value-card">💡 Innovation & Technology</div>
        </div>
      </section>

      <section className="about-cta">
        <h2>Ready to Find Your Next Home?</h2>
        <Link to="/properties">
          <button className="cta-btn">Explore Properties →</button>
        </Link>
      </section>

      <footer className="about-footer">
        © {new Date().getFullYear()} Elite Nest — Premium Living Made Simple.
      </footer>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container dark-theme">
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">Menu</Link>
          <button onClick={toggleSidebar} className="sidebar-toggle-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Home /></span>
            <span>Dashboard</span>
          </Link>
          <Link to="/properties" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Property /></span>
            <span>Properties</span>
          </Link>
          <Link to="/mylistings" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Search /></span>
            <span>My Listings</span>
          </Link>
          <Link to="/favorites" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Calendar /></span>
            <span>Appointment History</span>
          </Link>
          <Link to="/favorites" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Heart /></span>
            <span>Saved Properties</span>
          </Link>
          <Link to="/messages" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Message /></span>
            <span>Messages</span>
          </Link>
          <Link to="/profile" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.User /></span>
            <span>Profile</span>
          </Link>
          <Link to="/settings" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Settings /></span>
            <span>Settings</span>
          </Link>
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button onClick={() => { handleSignOut(); closeSidebarOnWeb(); }} className="nav-item" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger-color)' }}>
              <span className="nav-icon"><Icons.LogOut /></span>
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <header className="top-header">
          <div className="header-left">
            <button className="header-hamburger" onClick={toggleSidebar} aria-label="Toggle menu">
              <Icons.Menu />
            </button>
            <Link to="/" className="header-brand">
              <img
                src="/elite-nest-logo.png"
                alt="Elite Nest"
                style={{ height: "56px", objectFit: "contain" }}
              />
              <span style={{ marginLeft: "8px", fontWeight: 800 }}>Elite Nest</span>
            </Link>
            <nav className="header-links">
              <Link to="/dashboard" className="header-link">Dashboard</Link>
              <Link to="/properties" className="header-link">Properties</Link>
              <Link to="/contact" className="header-link">Contact</Link>
              <Link to="/about" className="header-link">About Us</Link>
            </nav>
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
              style={{ marginRight: '12px' }}
            >
              <Icons.Bell />
            </button>
            <div
              className="user-profile"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/profile')}
            >
              <div className="user-avatar">
                {greeting.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{greeting}</span>
                <span className="user-role">User</span>
              </div>
            </div>
            <button onClick={handleSignOut} className="icon-btn" title="Sign Out">
              <Icons.LogOut />
            </button>
          </div>
        </header>
        <div className="dashboard-page-content">
      <section className="about-hero">
        <h1>About Elite Nest</h1>
        <p>Building Trust. Delivering Homes. Creating Lifestyle.</p>
      </section>

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
        <div className="mv-grid">
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

      <footer className="about-footer">
        © {new Date().getFullYear()} Elite Nest — Premium Living Made Simple.
      </footer>
        </div>
      </main>
    </div>
  );
};

export default AboutUsPage;
