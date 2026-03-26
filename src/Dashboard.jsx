// Dashboard.jsx - Premium Design Matching Landing Page
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { fetchProperties } from "./utils/properties";
import Footer from "./components/Footer";
import "./App.css";
import "./Dashboard.css";

const mockData = {
  savedProperties: 7,
  messages: 3,
  notifications: 1,
  rentDue: "Not Due (Next: 2025-12-01)",
  rentAmount: "₹18,000",
};

// Icons components for cleaner code
const Icons = {
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Property: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>,
  Clipboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Heart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Message: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  ArrowRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('elitenest:sidebarCollapsed');
      return saved === '0' ? false : true; // default hidden unless explicitly '0'
    } catch {
      return true;
    }
  });
  const [properties, setProperties] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wishlist, setWishlist] = useState([]);
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
    if (!user) return;
    
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (!error) {
        setUnreadCount(count || 0);
      }
    };
    
    fetchUnreadCount();
    
    // Subscribe to new notifications
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('elitenest:sidebarCollapsed');
      if (savedCollapsed === '0') setSidebarCollapsed(false);
    } catch {}
  }, []);

  useEffect(() => {
    // Fetch properties and wishlist from database
    const loadData = async () => {
      const data = await fetchProperties();
      setProperties(data);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: wishlistData } = await supabase
          .from('wishlist')
          .select('property_id')
          .eq('user_id', currentUser.id);
        
        if (wishlistData) {
          setWishlist(wishlistData.map(item => item.property_id));
        }
      }
    };
    loadData();
  }, [user]);

  const toggleWishlist = async (e, propertyId) => {
    e.stopPropagation();
    if (!user) {
      navigate('/loginpage', { state: { from: '/dashboard' } });
      return;
    }

    const isSaved = wishlist.includes(propertyId);
    
    try {
      if (isSaved) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);
        
        setWishlist(prev => prev.filter(id => id !== propertyId));
      } else {
        await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            property_id: propertyId
          });
        
        setWishlist(prev => [...prev, propertyId]);
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  const handleShareProperty = (e, property) => {
    e.stopPropagation();
    if (!property || !property.id) return;
    const url = `${window.location.origin}/properties/${property.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: property.title || "EliteNest Property",
          text: property.location || "",
          url
        })
        .catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (!error) navigate("/", { replace: true });
    else setLoading(false);
  };

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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
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

  return (
    <div className="dashboard-container dark-theme">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">Menu</Link>
          <button onClick={toggleSidebar} className="sidebar-toggle-btn">
            <Icons.Menu />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active" onClick={closeSidebarOnWeb}>
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
          <Link to="/favorites?tab=appointments" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Calendar /></span>
            <span>Appointment History</span>
          </Link>
          <Link to="/favorites?tab=saved" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Heart /></span>
            <span>Saved Properties</span>
          </Link>
          <Link to="/notifications" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Bell /></span>
            <span>Notifications</span>
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

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Top Header */}
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
          <div style={{ position: 'relative', marginRight: '12px' }}>
            <button 
              className="icon-btn" 
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
            >
              <Icons.Bell />
            </button>
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: "0px",
                right: "0px",
                width: "8px",
                height: "8px",
                backgroundColor: "var(--danger-color)",
                borderRadius: "50%"
              }}></span>
            )}
          </div>

          <button
            className="icon-btn"
            onClick={handleSignOut}
            aria-label="Logout"
            style={{ marginRight: '12px' }}
          >
            <Icons.LogOut />
          </button>
          
          <div className="user-profile" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
            <div className="user-avatar">
              {greeting.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{greeting}</span>
              <span className="user-role">User</span>
            </div>
          </div>
        </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-page-content">
          {/* Sell Property Banner */}
          <div className="promo-banner">
            <div className="promo-content">
              <h2 className="promo-title">Sell Your Estate with<br />Elite Nest</h2>
              <p className="promo-desc">Join our exclusive network and reach verified premium buyers.<br />Expert valuation and white-glove service included.</p>
              <Link to="/seller" className="promo-btn">
                Listing Inquiry <Icons.ArrowRight />
              </Link>
            </div>
            <div className="promo-image">
              {/** Gallery of promo images to display instead of plain text */}
              {[
                'https://images.unsplash.com/photo-1600596542815-2a4d04774c13?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1560184897-e9b6f9a1b6c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1572120360610-d971b9bcb9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
              ].map((src, i) => (
                <div key={i} className={`promo-thumb promo-thumb-${i}`}>
                  <img src={src} alt={`Promo ${i + 1}`} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'; }} />
                </div>
              ))}
            </div>
          </div>

          {/* Properties Section */}
          <div className="section-header">
            <h2 className="section-title">Recent Properties</h2>
            <Link to="/properties" className="view-all-link">
              View All <Icons.ArrowRight />
            </Link>
          </div>
          
          <div className="property-grid">
            {properties.length > 0 ? properties.slice(0, 5).map((property) => (
              <div key={property.id} className="property-card">
                <div 
                  className="property-image-container" 
                  onClick={() => property?.id && navigate(`/properties/${property.id}`, { state: { property } })} 
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <span
                    className={`property-badge ${
                      property.type === 'sale'
                        ? 'sale'
                        : property.type === 'pg'
                        ? 'pg'
                        : 'rent'
                    }`}
                  >
                    {property.type === 'sale'
                      ? 'Sell'
                      : property.type === 'lease'
                      ? 'Lease'
                      : property.type === 'pg'
                      ? 'PG/Lease'
                      : 'Rent'}
                  </span>
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      display: 'flex',
                      gap: '8px',
                      zIndex: 10
                    }}
                  >
                    <button 
                      className={`wishlist-btn ${wishlist.includes(property.id) ? 'active' : ''}`}
                      onClick={(e) => toggleWishlist(e, property.id)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '18px',
                          lineHeight: 1,
                          color: wishlist.includes(property.id) ? '#ef4444' : '#000000'
                        }}
                      >
                        ♥
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleShareProperty(e, property)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '18px',
                          lineHeight: 1,
                          color: '#000000'
                        }}
                      >
                        ⇪
                      </span>
                    </button>
                  </div>
                  <img 
                    src={property.img} 
                    alt={property.title} 
                    className="property-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                </div>
                <div className="property-content">
                  <h3 className="property-title">{property.title}</h3>
                  <p className="property-location">📍 {property.location}</p>
                  <div className="property-meta">
                    <div className="meta-item">🛏 {property.bedrooms || '-'}</div>
                    <div className="meta-item">🛁 {property.bathrooms || '-'}</div>
                    <div className="meta-item">📐 {property.area || '-'}</div>
                  </div>
                  <div className="property-footer">
                    <span className="property-price">
                      ₹{typeof property.price === 'number' ? property.price.toLocaleString() : property.price}
                    </span>
                    <Link 
                      to={`/properties/${property.id}`} 
                      state={{ property }} 
                      className="property-link"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--text-secondary)' }}>No properties available</p>
            )}
          </div>
          {/* Split About Elite Section */}
          <section className="about-elite-split">
            <div className="about-elite-left">
              <div className="section-label">About Us</div>
              <h1 className="about-title">Experience the <br/><span className="text-highlight">Elite Difference</span></h1>
              <p className="about-description">
                Elite Nest offers a premium property marketplace with verified listings, transparent transactions, and personalised support. We simplify property discovery for renters, buyers, and sellers by combining cutting-edge technology with expert human guidance.
              </p>
              
              <div className="about-stats">
                <div className="stat-item">
                  <span className="stat-value">5k+</span>
                  <span className="stat-label">Premium Listings</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">2k+</span>
                  <span className="stat-label">Happy Families</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">98%</span>
                  <span className="stat-label">Satisfaction Rate</span>
                </div>
              </div>

              <div className="elite-cta-row">
                <Link to="/seller" className="elite-cta">List Your Property <Icons.ArrowRight /></Link>
                <Link to="/contact" className="elite-contact">Contact Sales</Link>
              </div>
            </div>

            <div className="about-elite-right">
              <div className="elite-features-grid-split">
                <div className="feature-card-split">
                  <div className="feature-icon-wrapper">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z"/></svg>
                  </div>
                  <div className="feature-content">
                    <h3>Verified Listings</h3>
                    <p>Rigorous checks to ensure every listing is authentic and fraud-free.</p>
                  </div>
                </div>

                <div className="feature-card-split">
                  <div className="feature-icon-wrapper">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M16 3h-8l-1 4h10l-1-4z"/></svg>
                  </div>
                  <div className="feature-content">
                    <h3>Pro Photography</h3>
                    <p>High-quality visuals and staging guidance to showcase your property.</p>
                  </div>
                </div>

                <div className="feature-card-split">
                  <div className="feature-icon-wrapper">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6"/><rect x="7" y="3" width="10" height="7" rx="2"/></svg>
                  </div>
                  <div className="feature-content">
                    <h3>Secure Payments</h3>
                    <p>Safe, transparent transactions with optional escrow support.</p>
                  </div>
                </div>

                <div className="feature-card-split">
                  <div className="feature-icon-wrapper">
                    <Icons.User />
                  </div>
                  <div className="feature-content">
                    <h3>Dedicated Support</h3>
                    <p>Personal account managers to guide you through every step.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <Footer />
        </div>
      </main>
    </div>
  );
}
