import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MapPin, 
  BedDouble, 
  Bath, 
  Square, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  User,
  Menu,
  Home,
  LogOut,
  Bell,
  Search,
  Settings,
  MessageCircle,
  ClipboardList,
  Plus,
  X,
  CarFront,
  DoorOpen,
  Sofa,
  Clock
} from 'lucide-react';
import { fetchPropertyById } from './utils/properties';
import { supabase } from './supabase';
import Footer from './components/Footer';
import './Dashboard.css'; // Use Dashboard CSS for layout structure
import './PropertyDetailsPage.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Reusing Icons logic from Dashboard but using Lucide icons directly for consistency
const Icons = {
  Menu: () => <Menu size={24} />,
  Home: () => <Home size={20} />,
  Property: () => <Square size={20} />, // Using Square as placeholder for Property icon
  Clipboard: () => <ClipboardList size={20} />,
  Calendar: () => <CalendarIcon size={20} />,
  Heart: () => <Heart size={20} />,
  Message: () => <MessageCircle size={20} />,
  User: () => <User size={20} />,
  Settings: () => <Settings size={20} />,
  LogOut: () => <LogOut size={20} />,
  Bell: () => <Bell size={20} />,
  Search: () => <Search size={20} />,
  Clock: (props) => <Clock size={20} {...props} />
};

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateProperty = location.state && location.state.property ? location.state.property : null;
  const [user, setUser] = useState(null);
  const [property, setProperty] = useState(stateProperty);
  const [loading, setLoading] = useState(!stateProperty);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('elitenest:sidebarCollapsed');
      return saved === '0' ? false : true;
    } catch {
      return true;
    }
  });
  
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    slots: [], // Array of { date, time } objects
    message: ''
  });

  const [selectedDateForTime, setSelectedDateForTime] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Helper to get date constraints based on package and posting date
  const getDateConstraints = () => {
    if (!property) return { min: '', max: '', days: 15, isFlexible: false, daysLeft: 0, isNearExpiry: false };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate day calculation
    const postingDate = new Date(property.createdAt || today);
    postingDate.setHours(0, 0, 0, 0);
    const minDate = today.toISOString().split('T')[0];
    
    // validityDays: Silver=15, Gold=30, Platinum=45
    let days = 15; // Default Silver
    const pkg = (property.packageName || 'Silver').toLowerCase();
    if (pkg === 'gold') days = 30;
    else if (pkg === 'platinum') days = 45;
    
    // Max date is calculated from posting date
    const maxDateObj = new Date(postingDate);
    maxDateObj.setDate(postingDate.getDate() + days);
    
    // Calculate days left
    const diffTime = maxDateObj.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let isFlexible = false;
    let isNearExpiry = false;

    // If the package validity period has already passed, allow selection within the next 60 days
    if (maxDateObj < today) {
      maxDateObj.setTime(today.getTime());
      maxDateObj.setDate(today.getDate() + 60);
      isFlexible = true;
      isNearExpiry = true; // Also relax date requirements if already passed
    } else if (daysLeft <= 3) {
      isNearExpiry = true;
    }
    
    const maxDate = maxDateObj.toISOString().split('T')[0];
    
    return { min: minDate, max: maxDate, days, isFlexible, daysLeft, isNearExpiry };
  };

  const constraints = getDateConstraints();
  const minSelectableDate = constraints.min;
  const maxSelectableDate = constraints.max;

  const handleDateChange = (date) => {
    // Just set the date being picked, wait for time
    setSelectedDateForTime(date);
  };

  const handleTimeSlotSelect = (time) => {
    if (!selectedDateForTime) return;

    const dateStr = selectedDateForTime.toISOString().split('T')[0];
    const newSlots = [...bookingForm.slots];

    if (newSlots.length < 4) {
      newSlots.push({ date: dateStr, time: time });
      setBookingForm({ ...bookingForm, slots: newSlots });
      // Reset after selection to allow picking another slot
      setSelectedDateForTime(null);
    } else {
      alert("You can select exactly 4 appointment slots.");
    }
  };

  const removeSlot = (index) => {
    const newSlots = bookingForm.slots.filter((_, i) => i !== index);
    setBookingForm({ ...bookingForm, slots: newSlots });
  };

  const updateDateOption = (index, field, value) => {
    const newDates = [...bookingForm.dates];
    newDates[index][field] = value;
    setBookingForm({ ...bookingForm, dates: newDates });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Pre-fill booking form with user details
        setBookingForm(prev => ({
          ...prev,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          email: user.email || ''
        }));
      }
    });
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
    const loadProperty = async () => {
      try {
        // If property was passed via navigation state, use it and skip fetch
        if (stateProperty) {
          setProperty(stateProperty);
          setLoading(false);
          return;
        }

        setLoading(true);
        const data = await fetchPropertyById(id);
        if (data) {
          setProperty(data);
          
          // Check if property is in wishlist
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { data: favorite } = await supabase
              .from('wishlist')
              .select('*')
              .eq('user_id', currentUser.id)
              .eq('property_id', id)
              .single();
            
            if (favorite) setIsFavorite(true);
          }
        } else {
          setError("Property not found");
        }
      } catch (err) {
        console.error("Error loading property:", err);
        if (!stateProperty) {
          setError("Failed to load property details");
        }
      } finally {
        if (!stateProperty) {
          setLoading(false);
        }
      }
    };

    loadProperty();
  }, [id, stateProperty]);

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/loginpage', { state: { from: `/properties/${id}` } });
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // Remove from wishlist
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', id);
        
        if (!error) setIsFavorite(false);
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            property_id: id
          });
        
        if (!error) setIsFavorite(true);
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
    } finally {
      setFavoriteLoading(false);
    }
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

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    navigate("/", { replace: true });
  };

  const createBooking = async (bookingData) => {
    const { error: bookingError } = await supabase
      .from("bookings")
      .insert(bookingData);
    if (bookingError) throw bookingError;
    alert("Viewing request sent successfully! We will contact you shortly.");
    setBookingForm({ name: '', email: '', phone: '', slots: [], message: '' });
  };

  const handleBookViewing = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/loginpage', { state: { from: `/properties/${id}` } });
      return;
    }

    // Validation: Don't allow person to book appointment who posted it
    if (property.user_id === user.id || property.created_by === user.id) {
      alert("You cannot book a viewing for your own property.");
      return;
    }

    try {
      if (!constraints.isNearExpiry) {
        if (bookingForm.slots.length < 4) {
          alert("Please select exactly 4 preferred appointment slots.");
          return;
        }
      } else {
        if (bookingForm.slots.length < 1) {
          alert("Please select at least 1 preferred date from the calendar.");
          return;
        }
      }

      const formattedDates = bookingForm.slots.map(s => ({ date: s.date, time: s.time }));

      const userName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        bookingForm.name;

      const userEmail = user.email || bookingForm.email;

      const bookingData = {
        user_id: user.id,
        property_id: id,
        property_title: property.title,
        property_location: property.location || property.address || "",
        property_image: property.img || (property.image_urls && property.image_urls[0]) || "",
        user_name: userName,
        user_email: userEmail,
        mobile_number: bookingForm.phone,
        proposed_dates: formattedDates,
        message: bookingForm.message,
        appointment_date: bookingForm.slots[0].date,
        appointment_time: bookingForm.slots[0].time,
        status: 'pending'
      };

      await createBooking(bookingData);
    } catch (error) {
      console.error("Final booking viewing error:", error);
      alert(`Failed to send viewing request: ${error.message || "Please try again"}`);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title || 'Property Details',
        text: `Check out this property: ${property?.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="pd-loading-container">
        <div className="pd-spinner"></div>
        <p>Loading luxury residence...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="pd-error-container">
        <h2>Property Not Found</h2>
        <p>The residence you are looking for is no longer available or has been removed.</p>
        <button onClick={() => navigate('/properties')} className="pd-back-button">
          <ArrowLeft size={20} />
          Back to Collection
        </button>
      </div>
    );
  }

  // Ensure images array exists and has content
  const images = property.photos && property.photos.length > 0 
    ? property.photos 
    : [property.img]; // Fallback to single image

  const maxThumbnailCount = 7;
  const extraThumbnailCount = Math.max(0, images.length - maxThumbnailCount);

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const greeting = user ? (user.user_metadata?.full_name || user.email.split("@")[0]) : "Guest";

  const listingLabel =
    property.type === "sale"
      ? "For Sale"
      : property.type === "rent"
      ? "For Rent"
      : property.type
      ? property.type.charAt(0).toUpperCase() + property.type.slice(1)
      : null;

  const featureItems = [
    "Status: Approved",
    listingLabel && `Listing Type: ${listingLabel}`,
    property.area && `Area: ${property.area} sq ft`,
    property.bedrooms && `Bedrooms: ${property.bedrooms}`,
    property.bathrooms && `Bathrooms: ${property.bathrooms}`,
    property.deposit ? `Deposit: ₹${property.deposit}` : null,
    property.minDuration && `Minimum Duration: ${property.minDuration} months`,
    typeof property.parking === "string" && `Parking: ${property.parking}`,
    typeof property.balcony === "string" && `Balcony: ${property.balcony}`,
    property.furnished && property.furnished !== "Unfurnished" ? `${property.furnished} Furnished` : null,
    ...(property.amenities || []),
  ].filter(Boolean);

  const getAmenityIcon = (amenity) => {
    const label = String(amenity).toLowerCase();

    if (label.includes("bedroom")) {
      return <BedDouble size={28} className="pd-amenity-icon" />;
    }
    if (label.includes("bathroom") || label.includes("bath")) {
      return <Bath size={28} className="pd-amenity-icon" />;
    }
    if (label.includes("area") || label.includes("sq ft") || label.includes("sqft")) {
      return <Square size={28} className="pd-amenity-icon" />;
    }
    if (label.includes("parking")) {
      return <CarFront size={28} className="pd-amenity-icon" />;
    }
    if (label.includes("balcony")) {
      return <DoorOpen size={28} className="pd-amenity-icon" />;
    }
    if (label.includes("furnished")) {
      return <Sofa size={28} className="pd-amenity-icon" />;
    }
    if (label.includes("status")) {
      return <CheckCircle2 size={28} className="pd-amenity-icon" />;
    }
    if (label.includes("listing type") || label.includes("type:")) {
      return <ClipboardList size={28} className="pd-amenity-icon" />;
    }

    return <CheckCircle2 size={28} className="pd-amenity-icon" />;
  };

  const formattedPrice =
    typeof property.price === "number"
      ? property.price.toLocaleString("en-IN")
      : property.price;

  return (
    <div className="dashboard-container dark-theme">
      {isFullscreen && (
        <div className="pd-fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
          <button
            type="button"
            className="pd-fullscreen-close"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
          >
            <X size={24} />
          </button>
          <div
            className="pd-fullscreen-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[activeImageIndex]}
              alt={property.title}
              className="pd-fullscreen-image"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="pd-fullscreen-nav prev"
                  onClick={prevImage}
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  className="pd-fullscreen-nav next"
                  onClick={nextImage}
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">Menu</Link>
          <button onClick={toggleSidebar} className="sidebar-toggle-btn">
            <Icons.Menu />
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
          {user && (
            <>
              <Link to="/mylistings" className="nav-item" onClick={closeSidebarOnWeb}>
                <span className="nav-icon"><Icons.Clipboard /></span>
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
            </>
          )}
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

        {/* Property Content */}
        <div className="pd-content-wrapper">
          {/* Hero Section with Gallery */}
          <section className="pd-gallery-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <button onClick={() => navigate(-1)} className="pd-nav-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}>
                <ArrowLeft size={24} />
                <span>Back</span>
              </button>
              <button 
                className={`pd-action-button ${showMap ? 'active' : ''}`}
                onClick={() => setShowMap(!showMap)}
                style={{ width: 'auto', padding: '0 16px', borderRadius: '8px', gap: '8px', height: '40px', fontSize: '1rem' }}
              >
                <MapPin size={20} />
                {showMap ? 'Hide Map' : 'Map View'}
              </button>
            </div>

            <div className="pd-title-section fade-up">
              <div className="pd-title-section-left">
                <div className="pd-location-badge">
                  <MapPin size={16} />
                  {property.location}
                </div>
                <h1 className="pd-title">{property.title}</h1>
              </div>
              <div className="pd-price">
                ₹{formattedPrice}
                {property.type === 'rent' && <span className="pd-period">/month</span>}
              </div>
            </div>

            <div className="pd-gallery-split-container" style={{ display: 'flex', gap: '16px', minHeight: '45vh', transition: 'all 0.3s ease', alignItems: 'stretch' }}>
              <div className="pd-main-image-column" style={{ flex: '0 0 70%', display: 'flex', flexDirection: 'column' }}>
                <div className="pd-main-image-wrapper">
                <img 
                  src={images[activeImageIndex]} 
                  alt={property.title} 
                  className="pd-main-image"
                  onClick={() => setIsFullscreen(true)}
                />
                
                {images.length > 1 && !showMap && (
                  <>
                    <button className="pd-gallery-nav prev" onClick={prevImage}>
                      <ChevronLeft size={24} />
                    </button>
                    <button className="pd-gallery-nav next" onClick={nextImage}>
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                  <div className="pd-image-overlay">
                    <div className="pd-actions-overlay" style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '12px' }}>
                      <button 
                        className={`pd-action-button ${isFavorite ? 'active' : ''}`}
                        onClick={toggleFavorite}
                        disabled={favoriteLoading}
                        style={{width: '48px', height: '48px', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', opacity: favoriteLoading ? 0.7 : 1}}
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Heart size={24} fill={isFavorite ? "#ef4444" : "none"} color={isFavorite ? "#ef4444" : "#333"} />
                      </button>
                      <button 
                        className="pd-action-button" 
                        onClick={handleShare} 
                        style={{width: '48px', height: '48px', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'}}
                        title="Share Property"
                      >
                        <Share2 size={24} color="#333" />
                      </button>
                    </div>
                    <div className="pd-status-badge">
                      {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                    </div>
                  </div>
                </div>

                {images.length > 1 && !showMap && (
                  <div className="pd-thumbnails-scroll">
                    <div className="pd-thumbnails">
                      {images.slice(0, maxThumbnailCount).map((img, index) => (
                        <button
                          key={index}
                          className={`pd-thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                          onClick={() => setActiveImageIndex(index)}
                        >
                          <img src={img} alt={`View ${index + 1}`} />
                        </button>
                      ))}
                      {extraThumbnailCount > 0 && (
                        <button
                          type="button"
                          className="pd-thumbnail pd-thumbnail-more"
                          onClick={() => setIsFullscreen(true)}
                        >
                          +{extraThumbnailCount} more
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pd-booking-column" style={{ flex: '0 0 26%', display: 'flex' }}>
                {showMap ? (
                  <div className="pd-map-wrapper" style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--pd-border)', position: 'relative', zIndex: 1 }}>
                    <MapContainer 
                      center={[property.lat || 20.5937, property.lng || 78.9629]} 
                      zoom={13} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={[property.lat || 20.5937, property.lng || 78.9629]}>
                        <Popup>
                          <div style={{ color: '#000' }}>
                            <strong>{property.title}</strong><br/>
                            {property.location}
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                ) : (
                  <div className="pd-booking-card fade-up" style={{ animationDelay: '0.2s', width: '100%' }}>
                    <h3 className="pd-booking-title">Book a Visit</h3>
                    <p className="pd-booking-subtitle">Request a visit for this property.</p>
                    
                    <form onSubmit={handleBookViewing} className="pd-booking-form">
                      <div className="pd-input-group">
                        <div className="pd-input-icon"><Phone size={18} /></div>
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={bookingForm.phone}
                          onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                          required
                          className="pd-input"
                        />
                      </div>

                      <div className="pd-dates-section" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '0.95rem', color: 'var(--pd-text-primary)', fontWeight: '600', letterSpacing: '0.3px' }}>
                            {constraints.isNearExpiry ? 'Preferred Dates' : '4 Preferred Dates'}
                          </span>
                          {constraints.isNearExpiry && (
                            <span style={{ 
                              fontSize: '0.7rem', 
                              padding: '2px 8px', 
                              background: 'rgba(239, 68, 68, 0.1)', 
                              color: '#ef4444', 
                              borderRadius: '12px',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                            }}>
                              Expiry Soon: Flexibility Enabled
                            </span>
                          )}
                          <span style={{ 
                            fontSize: '0.8rem', 
                            color: (constraints.isNearExpiry ? bookingForm.slots.length >= 1 : bookingForm.slots.length === 4) ? 'var(--pd-accent-gold-bright)' : 'var(--pd-danger)', 
                            fontWeight: '700',
                            background: (constraints.isNearExpiry ? bookingForm.slots.length >= 1 : bookingForm.slots.length === 4) ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            transition: 'all 0.3s',
                            marginLeft: 'auto'
                          }}>
                            {bookingForm.slots.length}{!constraints.isNearExpiry && '/4'} Selected
                          </span>
                        </div>
                        <div className="pd-calendar-trigger-row">
                          <button
                            type="button"
                            className="pd-calendar-open-button"
                            onClick={() => setIsCalendarOpen(true)}
                          >
                            <CalendarIcon size={16} />
                            Add Appointment Slot
                          </button>
                          <span className="pd-calendar-hint">
                            Select up to 4 preferred date & time slots
                          </span>
                        </div>

                        <div className="pd-calendar-availability">
                          <CalendarIcon size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                          Appointments available between <strong>{new Date(minSelectableDate).toLocaleDateString()}</strong> and <strong>{new Date(maxSelectableDate).toLocaleDateString()}</strong>
                        </div>

                        {bookingForm.slots.length > 0 && (
                          <div className="pd-selected-dates-preview">
                            <div style={{ 
                              textAlign: 'center',
                              fontSize: '0.85rem', 
                              color: 'var(--pd-text-secondary)', 
                              marginBottom: '20px', 
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>
                              Selected Appointment Options:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {bookingForm.slots.map((slot, i) => (
                                <div key={i} className="pd-selected-date-badge" style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <CalendarIcon size={16} color="var(--pd-accent-gold)" />
                                      <span style={{ fontWeight: '600' }}>
                                        {new Date(slot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                    <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }}></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Icons.Clock size={16} color="var(--pd-accent-gold)" />
                                      <span style={{ fontWeight: '600' }}>{slot.time}</span>
                                    </div>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => removeSlot(i)}
                                    className="pd-remove-date"
                                    style={{ marginLeft: '12px' }}
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <textarea
                        placeholder="I am interested in this property..."
                        value={bookingForm.message}
                        onChange={(e) => setBookingForm({...bookingForm, message: e.target.value})}
                        className="pd-textarea"
                        rows="4"
                      ></textarea>

                      <button type="submit" className="pd-submit-button">
                        Book a Visit
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

          </section>

          <div className="pd-content-grid">
            {/* Left Column: Property Details */}
            <div className="pd-details-column">

              <div className="pd-metrics-grid fade-up" style={{animationDelay: '0.1s'}}>
                <div className="pd-metric-card">
                  <BedDouble size={28} />
                  <div className="pd-metric-info">
                    <span className="label">Bedrooms</span>
                    <span className="value">{property.bedrooms}</span>
                  </div>
                </div>
                <div className="pd-metric-card">
                  <Bath size={28} />
                  <div className="pd-metric-info">
                    <span className="label">Bathrooms</span>
                    <span className="value">{property.bathrooms || 2}</span>
                  </div>
                </div>
                <div className="pd-metric-card">
                  <Square size={28} />
                  <div className="pd-metric-info">
                    <span className="label">Area</span>
                    <span className="value">
                      {property.area ? `${property.area} sq ft` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pd-section pd-description-column fade-up" style={{animationDelay: '0.2s'}}>
                <h2 className="pd-section-title">Description</h2>
                <p className="pd-description">
                  {property.description}
                </p>
              </div>

              <div className="pd-section pd-amenities-column fade-up" style={{animationDelay: '0.3s'}}>
                <h2 className="pd-section-title">Features & Amenities</h2>
                <div className="pd-amenities-grid">
                  {featureItems.map((amenity, index) => (
                    <div key={index} className="pd-amenity-item">
                      {getAmenityIcon(amenity)}
                      <span>{amenity}</span>
                    </div>
                  ))}
                  
                  {featureItems.length === 0 && (
                    <p className="pd-no-data-text">Contact agent for full amenity list.</p>
                  )}
                </div>
              </div>

              {/* Nearby Places - Only show if data exists */}
              {property.nearbyPlaces && (
                <div className="pd-section fade-up" style={{animationDelay: '0.4s'}}>
                  <h2 className="pd-section-title">Nearby Places</h2>
                  <div className="pd-nearby-content">
                    <p>{property.nearbyPlaces}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isCalendarOpen && (
          <div
            className="pd-calendar-modal-backdrop"
            onClick={() => {
              setIsCalendarOpen(false);
              setSelectedDateForTime(null);
            }}
          >
            <div
              className="pd-calendar-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '450px' }}
            >
              <div className="pd-calendar-modal-header">
                <div>
                  <h3 style={{ margin: 0 }}>Add Appointment Slot</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--pd-text-secondary)' }}>
                    Option {bookingForm.slots.length + 1} of 4
                  </p>
                </div>
                <button
                  type="button"
                  className="pd-calendar-close-button"
                  onClick={() => {
                    setIsCalendarOpen(false);
                    setSelectedDateForTime(null);
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="pd-calendar-container" style={{ padding: '20px' }}>
                {!selectedDateForTime ? (
                  <>
                    <div style={{ marginBottom: '15px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--pd-accent-gold)' }}>
                      Step 1: Select a Date
                    </div>
                    <Calendar
                      onChange={handleDateChange}
                      minDate={new Date(minSelectableDate)}
                      maxDate={new Date(maxSelectableDate)}
                      className="pd-custom-calendar"
                      tileClassName={({ date, view }) => {
                        if (view === 'month') {
                          const dateStr = date.toISOString().split('T')[0];
                          if (bookingForm.slots.some(s => s.date === dateStr)) {
                            return 'selected-date-tile';
                          }
                        }
                        return null;
                      }}
                    />
                  </>
                ) : (
                  <div className="pd-time-picker-step fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <button 
                        onClick={() => setSelectedDateForTime(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--pd-accent-gold)', cursor: 'pointer', padding: 0 }}
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--pd-accent-gold)' }}>
                          Step 2: Select Time for {selectedDateForTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '10px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      padding: '4px'
                    }}>
                      {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => handleTimeSlotSelect(time)}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '8px',
                            border: '1px solid var(--pd-border)',
                            background: 'rgba(255,255,255,0.03)',
                            color: 'var(--pd-text-primary)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = 'var(--pd-accent-gold)';
                            e.target.style.background = 'rgba(217, 119, 6, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = 'var(--pd-border)';
                            e.target.style.background = 'rgba(255,255,255,0.03)';
                          }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pd-calendar-modal-footer">
                <div style={{ fontSize: '0.85rem', color: 'var(--pd-text-secondary)' }}>
                  {bookingForm.slots.length} of 4 slots added
                </div>
                <button
                  type="button"
                  className="pd-submit-button"
                  style={{ width: 'auto', padding: '10px 24px' }}
                  onClick={() => setIsCalendarOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
};

export default PropertyDetailsPage;
