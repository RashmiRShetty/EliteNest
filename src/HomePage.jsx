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
  CreditCard,
  MapPin,
  Clock,
  TrendingUp,
  Award,
  Zap,
  Lock,
  BarChart3,
  Mail
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
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  
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

  const handleViewDetailsClick = async (property) => {
    if (!property || !property.id) return;
    if (user) {
      navigate(`/properties/${property.id}`, { state: { property } });
    } else {
      navigate("/loginpage", { state: { from: `/properties/${property.id}`, property } });
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
            <Link to={user ? "/dashboard" : "/"} className="header-brand">
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
                <div className="user-profile" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
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
            justifyContent: 'flex-start',
            width: '100%',
            margin: 0,
            borderRadius: 0,
            backgroundImage: "linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            backgroundAttachment: 'fixed'
          }}>
            <div className="promo-content" style={{ maxWidth: '60%', position: 'relative', zIndex: 1, marginLeft: '48px' }}>
              <h1 className="promo-title" style={{ fontSize: '56px', marginBottom: '24px', textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
                Find Your Perfect Home
              </h1>
              <p className="promo-desc" style={{ fontSize: '18px', marginBottom: '40px', lineHeight: '1.6' }}>
                Discover verified listings, premium apartments, and exclusive villas at the best prices. Your dream home awaits.
              </p>
              
              <div style={{ marginTop: '24px' }}>
                <button 
                  onClick={handleGetStarted}
                  className="promo-btn" 
                  style={{ padding: '14px 48px', fontSize: '16px', fontWeight: 700 }}
                >
                  Get Started
                </button>
              </div>
            </div>
          </section>

          {/* Featured Properties */}
          <section style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="section-header">
              <h2 className="section-title">Featured Properties</h2>
              <Link to="/properties" className="view-all-link">View All Properties →</Link>
            </div>

          {loading ? (
            <div className="loading-container" style={{ height: '200px', background: 'transparent' }}>
              <div className="spinner"></div>
            </div>
          ) : (
            <div style={{ position: 'relative', padding: '0 48px 48px 48px' }}>
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
                  gap: '32px',
                  padding: '20px 0 40px 0',
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
                    onClick={() => handleViewDetailsClick(property)}
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
                          ₹{property.price?.toLocaleString?.("en-IN") ?? property.price}
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
          </section>

          {/* Why Choose Us Section */}
          <section className="why-choose-section">
            <h2 className="why-choose-title">Why Choose Elite Nest?</h2>
            
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">🏠</div>
                <h3>Verified Listings</h3>
                <p>Every property is thoroughly vetted to ensure quality and authenticity</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">⚡</div>
                <h3>Quick Process</h3>
                <p>Find and book your perfect property in just a few clicks</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🔒</div>
                <h3>Safe & Secure</h3>
                <p>Protected transactions with optional escrow and buyer protection</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">💬</div>
                <h3>Expert Support</h3>
                <p>Dedicated agents available 24/7 to assist you</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">📍</div>
                <h3>Prime Locations</h3>
                <p>Access to properties in the most sought-after neighborhoods</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">✨</div>
                <h3>Premium Quality</h3>
                <p>Curated selection of high-quality residential properties</p>
              </div>
            </div>

            <div className="quick-features" style={{ marginTop: '60px' }}>
              <div className="quick-feature">
                <div className="quick-feature-icon">🎯</div>
                <div className="quick-feature-text">
                  <h4>Smart Search</h4>
                  <p>Advanced filters and recommendations</p>
                </div>
              </div>
              <div className="quick-feature">
                <div className="quick-feature-icon">📸</div>
                <div className="quick-feature-text">
                  <h4>High Quality Photos</h4>
                  <p>Professional property imagery</p>
                </div>
              </div>
              <div className="quick-feature">
                <div className="quick-feature-icon">🚀</div>
                <div className="quick-feature-text">
                  <h4>Fast Listings</h4>
                  <p>New properties added daily</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Featured Properties */}
          <section style={{ padding: '48px', width: '100%', boxSizing: 'border-box' }}>
            <div className="cta-featured-grid">
              <div className="cta-card">
                <div className="cta-card-icon">🏘️</div>
                <h3>Want to Sell?</h3>
                <p>List your property and reach thousands of potential buyers. Get maximum exposure with our premium marketing tools.</p>
                <Link to="/loginpage" className="cta-card-btn">List Property</Link>
              </div>
              <div className="cta-card">
                <div className="cta-card-icon">🔔</div>
                <h3>Get Alerts</h3>
                <p>Never miss your dream property. Set up customized alerts and get notified instantly when new listings match your criteria.</p>
                <button className="cta-card-btn" onClick={handleGetStarted}>Create Alert</button>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="faq-section">
            <div className="faq-container">
              <h2 className="faq-title">Frequently Asked Questions</h2>
              
              {[
                {
                  question: 'How do I search for properties?',
                  answer: 'Use our advanced search feature to filter by location, price, property type, and amenities. You can also set up alerts to get notified about new listings matching your criteria.'
                },
                {
                  question: 'Is it safe to transact on Elite Nest?',
                  answer: 'Yes, we offer secure transactions with optional escrow services. All payments are protected and verified. Our platform uses advanced security measures to protect your data.'
                },
                {
                  question: 'How long does the buying/renting process take?',
                  answer: 'The timeline varies depending on your needs. Typically, from first viewing to agreement completion takes 2-4 weeks. Our agents can help expedite the process.'
                },
                {
                  question: 'What fees does Elite Nest charge?',
                  answer: 'For buyers and renters, Elite Nest is completely free. Property sellers can list their properties with competitive commission rates. Contact our sales team for detailed pricing.'
                },
                {
                  question: 'Can I list multiple properties?',
                  answer: 'Yes! Property managers and developers can list multiple properties. We offer bulk upload options and dedicated support for commercial accounts.'
                },
                {
                  question: 'How do I contact support?',
                  answer: 'You can reach our support team via chat, email, or phone. We\'re available 24/7 to help you with any questions or concerns.'
                }
              ].map((faq, index) => (
                <div key={index} className="faq-item">
                  <div 
                    className="faq-question"
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  >
                    <span>{faq.question}</span>
                    <span className={`faq-toggle ${expandedFAQ === index ? 'active' : ''}`}>▼</span>
                  </div>
                  <div className={`faq-answer ${expandedFAQ === index ? 'active' : ''}`}>
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </section>

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
                <Link to="/login" className="elite-cta">List Your Property <Icons.ArrowRight /></Link>
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
