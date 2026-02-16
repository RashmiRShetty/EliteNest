import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProperties } from "./utils/properties";
import { supabase } from "./supabase";
import Footer from "./components/Footer";
import "./App.css";
import "./Dashboard.css";
import "./PropertiesPage.css";
import { MapPin, Filter, Search } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ------------------ PROPERTIES PAGE ------------------
function PropertiesPage() {
  // 1. Initialize useNavigate
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('elitenest:sidebarCollapsed');
      return saved === '0' ? false : true;
    } catch {
      return true;
    }
  });
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    type: '',
    ownerType: '',
    bachelorFriendly: '',
    furnished: '',
    balcony: '',
    parking: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [mapInstance, setMapInstance] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wishlist, setWishlist] = useState([]);

  const closeSidebarOnWeb = () => {
    if (window.innerWidth > 768) {
      setSidebarCollapsed(true);
      localStorage.setItem('elitenest:sidebarCollapsed', '1');
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('elitenest:sidebarCollapsed', next ? '1' : '0');
      return next;
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  // Fetch properties and wishlist from database
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchProperties();
      setProperties(data);
      setFilteredProperties(data);
      
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
      setLoading(false);
    };
    loadData();
  }, [user]);

  const toggleWishlist = async (e, propertyId) => {
    e.stopPropagation();
    if (!user) {
      navigate('/loginpage', { state: { from: '/properties' } });
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

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
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
    let filtered = properties.filter(property => {
      // search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = property.title?.toLowerCase().includes(q);
        const inLocation = property.location?.toLowerCase().includes(q);
        if (!inTitle && !inLocation) return false;
      }
      // top-type filter (Sell/Rent/Lease)
      if (typeFilter) {
        if (typeFilter === 'lease') {
          // treat 'lease' as either 'pg' or explicit 'lease'
          if (!(property.type === 'pg' || property.type === 'lease')) return false;
        } else if (property.type !== typeFilter) return false;
      }
      if (filters.location && !property.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.minPrice && property.price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && property.price > parseInt(filters.maxPrice)) return false;
      if (filters.bedrooms && property.bedrooms !== filters.bedrooms) return false;
      if (filters.type && property.type !== filters.type) return false;
      if (filters.ownerType && property.ownerType !== filters.ownerType) return false;
      if (filters.bachelorFriendly && property.bachelorFriendly !== filters.bachelorFriendly) return false;
      if (filters.furnished && property.furnished !== filters.furnished) return false;
      if (filters.balcony && property.balcony !== (filters.balcony === 'true')) return false;
      if (filters.parking && property.parking !== (filters.parking === 'true')) return false;
      return true;
    });
    setFilteredProperties(filtered);
  }, [filters]);

  useEffect(() => {
    // re-run filtering when search or typeFilter change
    // we reuse the existing filters state by triggering a set (no-op) to invoke effect
    // simpler: call the same logic by updating filteredProperties here
    let filtered = properties.filter(property => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = property.title?.toLowerCase().includes(q);
        const inLocation = property.location?.toLowerCase().includes(q);
        if (!inTitle && !inLocation) return false;
      }
      if (typeFilter) {
        if (typeFilter === 'lease') {
          if (!(property.type === 'pg' || property.type === 'lease')) return false;
        } else if (property.type !== typeFilter) return false;
      }
      if (filters.location && !property.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.minPrice && property.price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && property.price > parseInt(filters.maxPrice)) return false;
      if (filters.bedrooms && property.bedrooms !== filters.bedrooms) return false;
      if (filters.type && property.type !== filters.type) return false;
      if (filters.ownerType && property.ownerType !== filters.ownerType) return false;
      if (filters.bachelorFriendly && property.bachelorFriendly !== filters.bachelorFriendly) return false;
      if (filters.furnished && property.furnished !== filters.furnished) return false;
      if (filters.balcony && property.balcony !== (filters.balcony === 'true')) return false;
      if (filters.parking && property.parking !== (filters.parking === 'true')) return false;
      return true;
    });
    setFilteredProperties(filtered);
  }, [searchQuery, typeFilter, filters, properties]);

  // Ensure map resizes when shown
  useEffect(() => {
    if (viewMode === 'map' && mapInstance) {
      setTimeout(() => {
        try { mapInstance.invalidateSize(); } catch (e) { /* ignore */ }
      }, 200);
    }
  }, [viewMode, mapInstance]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 2. Define the click handler - no auth check needed since page is protected
  const handleViewDetailsClick = (propertyId) => {
    // Since PropertiesPage is wrapped in ProtectedRoute, user is already authenticated
    // Just navigate directly to the property details page
    navigate(`/properties/${propertyId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        Loading properties...
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="empty-container">
        <h2>No properties found</h2>
        <p>There are no properties available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container dark-theme">
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">Elite Nest</Link>
          <button onClick={toggleSidebar} className="sidebar-toggle-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Home /></span>
            <span>Dashboard</span>
          </Link>
          <Link to="/properties" className="nav-item active" onClick={closeSidebarOnWeb}>
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
    <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
      <header className="top-header">
        <div className="header-left">
          <button className="header-hamburger" onClick={toggleSidebar} aria-label="Toggle menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <Link to="/" className="header-brand">Elite Nest</Link>
          <nav className="header-links">
            <Link to="/" className="header-link">Home</Link>
            <Link to="/properties" className="header-link">Properties</Link>
            <Link to="/contact" className="header-link">Contact</Link>
            <Link to="/about" className="header-link">About Us</Link>
          </nav>
        </div>
        <div className="header-actions">
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
        </div>
      </header>
      <div className="dashboard-page-content">
      {/* Top toolbar: type filters, search, view and filters toggle */}
      <div className="properties-toolbar">
        <div className="properties-type-filters">
          <button className={`type-seg ${typeFilter === 'sale' ? 'active' : ''}`} onClick={() => setTypeFilter(prev => prev === 'sale' ? '' : 'sale')}>Sell</button>
          <button className={`type-seg ${typeFilter === 'lease' ? 'active' : ''}`} onClick={() => setTypeFilter(prev => prev === 'lease' ? '' : 'lease')}>Lease</button>
          <button className={`type-seg ${typeFilter === 'rent' ? 'active' : ''}`} onClick={() => setTypeFilter(prev => prev === 'rent' ? '' : 'rent')}>Rent</button>
        </div>
        <div className="properties-search-container">
          <input
            aria-label="Search properties"
            placeholder="Search by title or location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="properties-search"
          />
        </div>
        <div className="properties-view-toggles">
          <button onClick={() => setViewMode(prev => prev === 'grid' ? 'map' : 'grid')} className="icon-btn">{viewMode === 'grid' ? 'Map View' : 'Grid View'}</button>
          <button onClick={() => setShowFilters(s => !s)} className="icon-btn">Filters</button>
        </div>
      </div>
      {/* Filter Sidebar + Main (flex container) */}
      <div className="properties-main-container">
      <div className={`filter-sidebar ${showFilters ? 'open' : ''}`}>
        <h3>Filters</h3>
        <div className="filter-group">
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={filters.location}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <div className="price-range-inputs">
            <input
              type="number"
              name="minPrice"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={handleFilterChange}
              className="filter-input"
            />
            <input
              type="number"
              name="maxPrice"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
          <select name="bedrooms" value={filters.bedrooms} onChange={handleFilterChange} className="filter-select">
            <option value="">All BHK</option>
            <option value="1 BHK">1 BHK</option>
            <option value="2 BHK">2 BHK</option>
            <option value="3 BHK">3 BHK</option>
            <option value="4 BHK">4 BHK</option>
            <option value="Shared">Shared</option>
          </select>
          <select name="type" value={filters.type} onChange={handleFilterChange} className="filter-select">
            <option value="">All Types</option>
            <option value="rent">Rent</option>
            <option value="sale">Sale</option>
            <option value="pg">PG/Co-living</option>
          </select>
          <select name="ownerType" value={filters.ownerType} onChange={handleFilterChange} className="filter-select">
            <option value="">All Owners</option>
            <option value="owner">Owner</option>
            <option value="builder">Builder</option>
          </select>
          <select name="bachelorFriendly" value={filters.bachelorFriendly} onChange={handleFilterChange} className="filter-select">
            <option value="">All Categories</option>
            <option value="family">Family</option>
            <option value="boys">Boys</option>
            <option value="girls">Girls</option>
            <option value="shared">Shared</option>
          </select>
          <select name="furnished" value={filters.furnished} onChange={handleFilterChange} className="filter-select">
            <option value="">All Furnishing</option>
            <option value="fully">Fully Furnished</option>
            <option value="semi">Semi Furnished</option>
            <option value="non">Non Furnished</option>
          </select>
          <select name="balcony" value={filters.balcony} onChange={handleFilterChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--background-color)', color: 'var(--text-primary)' }}>
            <option value="">Balcony</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          <select name="parking" value={filters.parking} onChange={handleFilterChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--background-color)', color: 'var(--text-primary)' }}>
            <option value="">Parking</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {viewMode === 'grid' ? (
          <section className="property-grid">
            {filteredProperties.map((property) => (
              <div key={property.id} className="property-card">
                <div className="property-image-container" onClick={() => handleViewDetailsClick(property.id)} style={{ cursor: 'pointer' }}>
                  <span className={`property-badge ${property.type === 'sale' ? 'sale' : property.type === 'pg' ? 'pg' : 'rent'}`}>{property.type === 'sale' ? 'Sell' : property.type === 'pg' ? 'PG/Lease' : 'Rent'}</span>
                  <button 
                    className={`wishlist-btn ${wishlist.includes(property.id) ? 'active' : ''}`}
                    onClick={(e) => toggleWishlist(e, property.id)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icons.Heart 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        fill: wishlist.includes(property.id) ? '#ef4444' : 'none',
                        color: wishlist.includes(property.id) ? '#ef4444' : '#333'
                      }} 
                    />
                  </button>
                  <img
                    src={property.img || property.photos?.[0] || 'https://via.placeholder.com/400'}
                    alt={property.title}
                    className="property-image"
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400'; }}
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
                      ₹{property.price.toLocaleString()}{property.type === 'sale' ? '' : '/month'}
                    </span>
                    <button 
                      onClick={() => handleViewDetailsClick(property.id)}
                      className="property-link"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer
              center={filteredProperties.length ? [filteredProperties[0].lat || 20.5937, filteredProperties[0].lng || 78.9629] : [20.5937, 78.9629]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              whenCreated={(map) => setMapInstance(map)}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredProperties.map((property) => (
                (typeof property.lat === 'number' && typeof property.lng === 'number') ? (
                <Marker key={property.id} position={[property.lat, property.lng]}>
                  <Popup>
                    <div>
                      <h3>{property.title}</h3>
                      <p>₹{property.price.toLocaleString()}{property.type === 'sale' ? '' : '/month'}</p>
                      <p>{property.location}</p>
                      <button 
                        onClick={() => handleViewDetailsClick(property.id)}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "var(--secondary-color)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer"
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
                ) : null
              ))}
            </MapContainer>
            </div>
        )}
      </div>
      </div>
      </div>
      <Footer />
    </div>
    </div>
  );
}
export default PropertiesPage;
