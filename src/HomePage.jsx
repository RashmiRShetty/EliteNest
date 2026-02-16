import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { fetchProperties } from './utils/properties';
import { 
  Menu, 
  Home, 
  Square, 
  Search, 
  Calendar, 
  Heart, 
  MessageCircle, 
  User, 
  Settings, 
  LogOut, 
  Bell,
  LogIn,
  ArrowRight,
  ShieldCheck,
  Camera,
  CreditCard
} from 'lucide-react';
import Footer from './components/Footer';
import './Dashboard.css';

// Reusing Icons logic for consistency
const Icons = {
  Menu: () => <Menu size={24} />,
  Home: () => <Home size={20} />,
  Property: () => <Square size={20} />,
  Search: () => <Search size={20} />,
  Calendar: () => <Calendar size={20} />,
  Heart: () => <Heart size={20} />,
  Message: () => <MessageCircle size={20} />,
  User: () => <User size={20} />,
  Settings: () => <Settings size={20} />,
  LogOut: () => <LogOut size={20} />,
  Bell: () => <Bell size={20} />,
  LogIn: () => <LogIn size={20} />,
  ArrowRight: () => <ArrowRight size={20} />
};

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 360; // card width + gap
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // Home is for guests only

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

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Fetch unread notifications
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
  }, [user]);

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      const data = await fetchProperties();
      setProperties(data);
      setLoading(false);
    };
    loadProperties();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const handleViewDetailsClick = async (propertyId) => {
    if (user) {
      navigate(`/properties/${propertyId}`);
    } else {
      // Allow viewing but maybe redirect to login if they try to book
      // For now, let's redirect to login for consistency with App.jsx logic
      navigate("/loginpage", { state: { from: `/properties/${propertyId}` } });
    }
  };

  const handleGetStarted = () => {
    navigate('/loginpage', { replace: false });
  };

  const greeting = user ? (user.user_metadata?.full_name || user.email.split("@")[0]) : "Guest";

  return (
    <div className="dashboard-container dark-theme">
      {/* Main Content - Full Width */}
      <main className="main-content" style={{ marginLeft: 0 }}>
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <Link to="/" className="header-brand">Elite Nest</Link>
            <nav className="header-links">
              <Link to="/" className="header-link">Home</Link>
              <Link to="/properties" className="header-link">Properties</Link>
              <Link to="/contact" className="header-link">Contact</Link>
              <Link to="/about" className="header-link">About Us</Link>
              {user && <Link to="/dashboard" className="header-link">Dashboard</Link>}
            </nav>
          </div>       
          <div className="header-actions">
            {user ? (
              <>
                <div style={{ position: 'relative' }}>
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
                <div className="user-profile" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
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
              </>
            ) : (
              <Link to="/loginpage" style={{ textDecoration: 'none' }}>
                <button className="promo-btn" style={{ padding: '8px 20px', fontSize: '14px' }}>
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </header>

        <div className="dashboard-page-content">
          {/* Hero Section */}
          <section className="promo-banner" style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            minHeight: '400px', 
            padding: '48px', 
            marginBottom: '48px',
            backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div className="promo-content" style={{ maxWidth: '50%', position: 'relative', zIndex: 1 }}>
              <h1 className="promo-title" style={{ fontSize: '48px', marginBottom: '24px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                Find Your Perfect Home<br/>
              </h1>
              <p className="promo-desc" style={{ fontSize: '18px', marginBottom: '32px' }}>
                Discover verified listings, premium apartments, and exclusive villas at the best prices. Your dream home awaits.
              </p>
              
              <div style={{ marginTop: '8px' }}>
                <button 
                  onClick={handleGetStarted}
                  className="promo-btn" 
                  style={{ padding: '12px 24px', boxShadow: 'none' }}
                >
                  Get Started
                </button>
              </div>
            </div>
          </section>

          {/* Featured Properties */}
          <div className="section-header">
            <h2 className="section-title">Featured Properties</h2>
            <Link to="/properties" className="view-all-link">View All Properties →</Link>
          </div>

          {loading ? (
            <div className="loading-container" style={{ height: '200px', background: 'transparent' }}>
              <div className="spinner"></div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => scroll('left')}
                style={{
                  position: 'absolute',
                  left: '-10px',
                  top: '45%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  background: 'rgba(30, 30, 30, 0.8)',
                  color: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
              >
                &lt;
              </button>
              
              <div 
                ref={scrollRef}
                className="property-scroll-container" 
                style={{
                  display: 'flex',
                  overflowX: 'auto',
                  gap: '24px',
                  padding: '10px 10px 30px 10px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}
              >
                {/* Hide scrollbar Webkit */}
                <style>
                  {`
                    .property-scroll-container::-webkit-scrollbar {
                      display: none;
                    }
                  `}
                </style>
                {properties.map((property) => (
                  <div 
                    key={property.id} 
                    className="property-card" 
                    onClick={() => handleViewDetailsClick(property.id)}
                    style={{
                      minWidth: '340px',
                      maxWidth: '340px',
                      flex: '0 0 auto'
                    }}
                  >
                    <div className="property-image-container">
                      <img src={property.img} alt={property.title} className="property-image" />
                      <div className="property-badge sale">
                        {property.type === 'rent' ? 'For Rent' : 'For Sale'}
                      </div>
                    </div>
                    <div className="property-content">
                      <div className="property-location">
                        <Icons.Home /> {property.location}
                      </div>
                      <h3 className="property-title">{property.title}</h3>
                      <div className="property-meta">
                        <div className="meta-item">{property.bedrooms} Beds</div>
                        <div className="meta-dot"></div>
                        <div className="meta-item">{property.bathrooms || 2} Baths</div>
                        <div className="meta-dot"></div>
                        <div className="meta-item">{property.sqft || 2000} sqft</div>
                      </div>
                      <div className="property-footer">
                        <div className="property-price">
                          {property.price}
                          {property.type === 'rent' && <span style={{fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400}}>/mo</span>}
                        </div>
                        <button className="property-link">View</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => scroll('right')}
                style={{
                  position: 'absolute',
                  right: '-10px',
                  top: '45%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  background: 'rgba(30, 30, 30, 0.8)',
                  color: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
              >
                &gt;
              </button>
            </div>
          )}

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
                    <ShieldCheck size={24} />
                  </div>
                  <div className="feature-content">
                    <h3>Verified Listings</h3>
                    <p>Rigorous checks to ensure every listing is authentic and fraud-free.</p>
                  </div>
                </div>

                <div className="feature-card-split">
                  <div className="feature-icon-wrapper">
                    <Camera size={24} />
                  </div>
                  <div className="feature-content">
                    <h3>Pro Photography</h3>
                    <p>High-quality visuals and staging guidance to showcase your property.</p>
                  </div>
                </div>

                <div className="feature-card-split">
                  <div className="feature-icon-wrapper">
                    <CreditCard size={24} />
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
};

export default HomePage;
