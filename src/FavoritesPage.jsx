import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "./supabase";
import { getArray } from "./utils/properties.js";
import "./App.css";
import "./Dashboard.css";

// Define Icons locally
const Icons = {
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Property: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Heart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Message: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  CheckCircle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  Clipboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect></svg>,
};

const ImageWithFallback = ({ src, alt, linkTo }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
      setImgSrc(src);
      setHasError(false);
  }, [src]);

  const handleError = () => {
      setHasError(true);
  };

  const Content = () => {
      if (hasError || !imgSrc) {
          return (
              <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#1f2937', // dark gray
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
              }}>
                  <Icons.Home />
              </div>
          );
      }
      return (
          <img
              src={imgSrc}
              alt={alt}
              className="pch-image"
              onError={handleError}
          />
      );
  };

  if (linkTo && !hasError && imgSrc) {
      return (
          <Link to={linkTo} style={{ display: 'block', width: '100%', height: '100%' }}>
              <Content />
          </Link>
      );
  }

  return <Content />;
};

export default function FavoritesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Check location state or query params for initial tab
    if (location.state?.activeTab) return location.state.activeTab;
    const params = new URLSearchParams(location.search);
    return params.get('tab') === 'saved' ? 'saved' : 'appointments';
  });

  // Sync tab with location state/params
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    } else {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab === 'saved' || tab === 'appointments') {
        setActiveTab(tab);
      }
    }
  }, [location]);
  const [appointments, setAppointments] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('elitenest:sidebarCollapsed');
      return saved === '0' ? false : true;
    } catch {
      return true;
    }
  });
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

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
    const loadData = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate("/loginpage");
          return;
        }

        setUser(currentUser);

        // Fetch Appointments
        let aptData = [];
        try {
          console.log("Fetching user appointments...");
          
          // Fetch only from bookings table
          const { data: bookingData, error: bookingError } = await supabase
            .from("bookings")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false });
            
          if (bookingError && bookingError.code !== '42P01') {
            console.error("Error fetching bookings:", bookingError.message);
          }
          
          // Combine raw data
          const combinedRaw = bookingData || [];

          if (combinedRaw.length > 0) {
            // Fetch related properties manually to avoid relationship errors
            const propertyIds = [...new Set(combinedRaw.map(item => item.property_id).filter(Boolean))];
            let propertiesMap = {};

            if (propertyIds.length > 0) {
              const { data: propsData, error: propsError } = await supabase
                .from("properties")
                .select("id, title, image_urls, photos, address, city, state")
                .in("id", propertyIds);
              
              if (!propsError && propsData) {
                propertiesMap = propsData.reduce((acc, prop) => {
                  acc[prop.id] = prop;
                  return acc;
                }, {});
              }
            }

            // Deduplicate by ID and attach property info
            aptData = combinedRaw.reduce((acc, current) => {
              if (!current || !current.id) return acc;
              const currentId = String(current.id);
              if (!acc.find(item => String(item.id) === currentId)) {
                // Attach property info manually
                acc.push({
                  ...current,
                  properties: propertiesMap[current.property_id] || null
                });
              }
              return acc;
            }, []);
          }
        } catch (e) {
          console.error("Error fetching appointments:", e);
        }
        setAppointments(aptData);

        // Fetch Saved Properties (Wishlist)
        try {
          const { data: wishlistRows, error: wishlistError } = await supabase
            .from('wishlist')
            .select('property_id')
            .eq('user_id', currentUser.id);

          if (!wishlistError && wishlistRows && wishlistRows.length > 0) {
            const propertyIds = [...new Set(wishlistRows.map(row => row.property_id).filter(Boolean))];

            if (propertyIds.length > 0) {
              const { data: propsData, error: propsError } = await supabase
                .from('properties')
                .select('*')
                .in('id', propertyIds);

              if (!propsError && propsData) {
                setSavedProperties(propsData);
              }
            } else {
              setSavedProperties([]);
            }
          } else {
            setSavedProperties([]);
          }
        } catch (e) {
          console.error("Error fetching wishlist:", e);
          setSavedProperties([]);
        }

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleCancelAppointment = async (appointmentId) => {
    const aptToCancel = appointments.find(a => a.id === appointmentId);
    
    const cancellationReason = window.prompt("Please provide a reason for cancellation:");
    if (cancellationReason === null) return; // User clicked Cancel on prompt
    
    if (!cancellationReason.trim()) {
      alert("A reason is required to cancel the appointment.");
      return;
    }

    try {
      const updateData = { 
        status: "cancelled",
        cancellation_reason: cancellationReason 
      };

      // Only use bookings table
      const { error: bookingError } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", appointmentId);

      if (bookingError) throw bookingError;

      setAppointments(prev =>
        prev.map(apt => apt.id === appointmentId ? { ...apt, status: "cancelled", cancellation_reason: cancellationReason } : apt)
      );
      
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(prev => ({ ...prev, status: "cancelled", cancellation_reason: cancellationReason }));
      }
      
      alert("Appointment cancelled successfully.");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment.");
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newDate = formData.get('date');
    const newTime = formData.get('time');

    try {
      // Only use bookings table
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ appointment_date: newDate, appointment_time: newTime, status: 'pending' })
        .eq("id", selectedAppointment.id);

      if (bookingError) throw bookingError;

      setAppointments(prev =>
        prev.map(apt => apt.id === selectedAppointment.id 
          ? { ...apt, appointment_date: newDate, appointment_time: newTime, status: 'pending' } 
          : apt
        )
      );
      
      setSelectedAppointment(null);
      alert("Appointment rescheduled successfully! Status reset to pending for confirmation.");
    } catch (error) {
      console.error("Error rescheduling:", error);
      alert("Failed to reschedule.");
    }
  };

  const addToCalendar = (apt) => {
    const title = `Viewing: ${apt.properties?.title || apt.property_title}`;
    const date = apt.appointment_date || new Date().toISOString().split('T')[0];
    const time = apt.appointment_time || "10:00";
    const start = new Date(`${date}T${time}`).toISOString().replace(/-|:|\.\d+/g, "");
    const end = new Date(new Date(`${date}T${time}`).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, "");
    
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent('Property viewing booked via Elite Nest')}&location=${encodeURIComponent(apt.properties?.city || '')}`;
    window.open(url, '_blank');
  };

  const handleRemoveSaved = async (propertyId) => {
    if (!window.confirm("Remove from saved properties?")) return;
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);
      
      if (!error) {
        setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
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

  // Stats Data
  const stats = [
    { 
        label: "Total Bookings", 
        value: appointments.length.toString(), 
        icon: Icons.Calendar 
    },
    { 
        label: "Saved Properties", 
        value: savedProperties.length.toString().padStart(2, '0'), 
        icon: Icons.Heart 
    },
    { 
        label: "Upcoming", 
        value: appointments.filter(apt => {
            const date = apt.appointment_date || new Date().toISOString().split('T')[0];
            const time = apt.appointment_time || "10:00";
            const aptDate = new Date(`${date}T${time}`);
            return aptDate >= new Date() && apt.status !== "cancelled" && apt.status !== "rejected";
        }).length.toString().padStart(2, '0'), 
        icon: Icons.Clock 
    },
    { 
        label: "Completed", 
        value: appointments.filter(apt => {
            const date = apt.appointment_date || new Date().toISOString().split('T')[0];
            const time = apt.appointment_time || "10:00";
            const aptDate = new Date(`${date}T${time}`);
            return aptDate < new Date() && apt.status !== "cancelled" && apt.status !== "rejected";
        }).length.toString().padStart(2, '0'), 
        icon: Icons.CheckCircle 
    },
  ];

  const filteredAppointments = appointments.filter(apt => {
    const searchLower = searchQuery.toLowerCase();
    // Handle property title from join (apt.properties.title) or flat (apt.property_title)
    const title = apt.properties?.title || apt.property_title || "Property Appointment";
    const location = apt.properties ? `${apt.properties.city || ''} ${apt.properties.address || ''}` : "";
    
    const matchesSearch = 
      title.toLowerCase().includes(searchLower) ||
      location.toLowerCase().includes(searchLower) ||
      apt.id.toString().includes(searchLower);

    if (!matchesSearch) return false;

    if (filter === "all") return true;
    
    const date = apt.appointment_date || new Date().toISOString().split('T')[0];
    const time = apt.appointment_time || "10:00";
    const aptDate = new Date(`${date}T${time}`);

    if (filter === "upcoming") {
        return aptDate >= new Date() && apt.status !== "cancelled" && apt.status !== "rejected";
    }
    if (filter === "completed") {
        return aptDate < new Date() && apt.status !== "cancelled" && apt.status !== "rejected";
    }
    if (filter === "cancelled") return apt.status === "cancelled";
    if (filter === "rejected") return apt.status === "rejected";
    
    return true;
  });

  const greeting = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  if (loading) {
    return (
      <div className="dashboard-container dark-theme">
        <div className="loading-container">
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading appointment history...</p>
        </div>
      </div>
    );
  }

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
          <Link to="/favorites?tab=appointments" className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => { setActiveTab('appointments'); closeSidebarOnWeb(); }}>
            <span className="nav-icon"><Icons.Calendar /></span>
            <span>Appointment History</span>
          </Link>
          <Link to="/favorites?tab=saved" className={`nav-item ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => { setActiveTab('saved'); closeSidebarOnWeb(); }}>
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
          </div>
        </header>

        <div className="dashboard-page-content">

          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                {activeTab === 'appointments' ? 'Appointment History' : 'Saved Properties'}
              </h1>
              <div className="tab-switcher" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
                <button 
                  onClick={() => setActiveTab('appointments')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'appointments' ? 'var(--secondary-color)' : 'transparent',
                    color: activeTab === 'appointments' ? '#000' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  Appointments
                </button>
                <button 
                  onClick={() => setActiveTab('saved')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'saved' ? 'var(--secondary-color)' : 'transparent',
                    color: activeTab === 'saved' ? '#000' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  Saved
                </button>
              </div>
            </div>
            
            {activeTab === 'appointments' && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Search properties..." 
                    className="properties-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                      <Icons.Search />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'upcoming', label: 'Upcoming' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'cancelled', label: 'Cancelled' },
                    { id: 'rejected', label: 'Rejected' }
                  ].map(opt => (
                    <button 
                        key={opt.id}
                        onClick={() => setFilter(opt.id)}
                        className={`type-seg ${filter === opt.id ? 'active' : ''}`}
                    >
                        {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">
                  <stat.icon />
                </div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            ))}
          </div>

          {activeTab === 'appointments' ? (
            /* Appointment Grid */
            appointments.length === 0 ? (
              <div style={{
                backgroundColor: "var(--surface-color)",
                padding: "60px",
                borderRadius: "12px",
                textAlign: "center",
                border: "1px solid var(--border-color)"
              }}>
                <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  You haven't booked any appointments yet.
                </p>
                <Link to="/properties">
                  <button style={{
                    padding: "12px 24px",
                    backgroundColor: "var(--secondary-color)",
                    color: "#000",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "bold"
                  }}>
                    Browse Properties
                  </button>
                </Link>
              </div>
            ) : filteredAppointments.length === 0 ? (
               <div style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-secondary)",
                gridColumn: "1 / -1",
                backgroundColor: "var(--surface-color)",
                borderRadius: "12px",
                border: "1px solid var(--border-color)"
              }}>
                 <p style={{ fontSize: "1.1rem", marginBottom: "16px" }}>No appointments match your filter.</p>
                 <button 
                   onClick={() => { setFilter('all'); setSearchQuery(''); }}
                   style={{
                     background: "transparent",
                     border: "1px solid var(--secondary-color)",
                     color: "var(--secondary-color)",
                     padding: "8px 24px",
                     borderRadius: "8px",
                     cursor: "pointer",
                     fontWeight: "600"
                   }}
                 >
                   Clear Filters
                 </button>
              </div>
            ) : (
              <div style={{ padding: "24px" }}>
                <div className="active-listings-grid">
                {filteredAppointments.map((apt) => {
                  const property = apt.properties || {};
                  const title = property.title || apt.property_title || "Property Appointment";
                  
                  let image = null;

                  const image_urls = getArray(property.image_urls);
                  const photos = getArray(property.photos);
                  image = image_urls[0] 
                    || photos[0] 
                    || apt.property_image 
                    || apt.property_img 
                    || apt.img 
                    || null;

                  const location = property.city || property.address || apt.property_location || "Location not specified";
                  const date = apt.appointment_date || new Date().toISOString().split('T')[0];
                  const time = apt.appointment_time || "10:00";
                  const aptDate = new Date(`${date}T${time}`);
                  const isPast = aptDate < new Date();
                   const status = apt.status || (isPast ? "completed" : "pending");
 
                   return (
                     <div key={apt.id} className="property-card-horizontal">
                       <div className="pch-image-container">
                         <ImageWithFallback 
                           src={image} 
                           alt={title} 
                           linkTo={property.id ? `/properties/${property.id}` : null} 
                         />
                       </div>
                       <div className="pch-content">
                         <div className="pch-header">
                           {(status === 'confirmed' || status === 'accepted') && (
                              <div className="pch-badge">
                                 <span className="pch-dot approved"></span> CONFIRMED
                              </div>
                           )}
                           {status === 'pending' && (
                              <div className="pch-badge">
                                 <span className="pch-dot pending"></span> PENDING
                              </div>
                           )}
                           {status === 'cancelled' && (
                              <div className="pch-badge">
                                 <span className="pch-dot rejected"></span> CANCELLED
                              </div>
                           )}
                           {status === 'rejected' && (
                              <div className="pch-badge">
                                 <span className="pch-dot rejected"></span> REJECTED
                              </div>
                           )}
                           {status === 'completed' && (
                              <div className="pch-badge">
                                 <span className="pch-dot" style={{ backgroundColor: '#9ca3af' }}></span> COMPLETED
                              </div>
                           )}
                         </div>
                         
                         <h3 className="pch-title" style={{ fontSize: '24px' }}>{title}</h3>
                         
                         <div className="pch-location" style={{ marginBottom: '16px' }}>
                           <Icons.MapPin />
                           {location}
                         </div>

                         {status === 'rejected' && apt.rejection_reason && (
                           <div style={{ 
                             marginBottom: '16px', 
                             padding: '12px', 
                             backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                             borderRadius: '8px', 
                             border: '1px solid var(--danger-color)',
                             color: 'var(--danger-color)',
                             fontSize: '0.9rem'
                           }}>
                             <strong>Rejection Reason:</strong> {apt.rejection_reason}
                           </div>
                         )}

                         {status === 'cancelled' && apt.cancellation_reason && (
                           <div style={{ 
                             marginBottom: '16px', 
                             padding: '12px', 
                             backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                             borderRadius: '8px', 
                             border: '1px solid rgba(255, 255, 255, 0.1)',
                             color: 'var(--text-secondary)',
                             fontSize: '0.9rem'
                           }}>
                             <strong>Cancellation Reason:</strong> {apt.cancellation_reason}
                           </div>
                         )}

                         <div style={{ 
                           display: 'flex', 
                           flexDirection: 'column', 
                           gap: '8px', 
                           marginBottom: '24px',
                           padding: '12px',
                           backgroundColor: 'rgba(255,255,255,0.03)',
                           borderRadius: '8px',
                           border: '1px solid rgba(255,255,255,0.1)'
                         }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                               <Icons.Calendar /> 
                               <span style={{ fontWeight: '600' }}>
                                  {aptDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                               </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                               <Icons.Clock />
                               <span>
                                  {aptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                               </span>
                            </div>
                         </div>
                         
                         <div className="pch-actions">
                           {property.id && (
                               <Link to={`/properties/${property.id}`} state={{ property }} className="btn-view">
                                  <Icons.Home /> VIEW PROPERTY
                               </Link>
                           )}

                           <button 
                               className="btn-view"
                               style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                               onClick={() => setSelectedAppointment(apt)}
                           >
                              <Icons.Clipboard /> DETAILS
                           </button>
                           
                           {status !== 'cancelled' && status !== 'rejected' && !isPast && (
                               <button 
                                   className="btn-icon delete"
                                   onClick={() => handleCancelAppointment(apt.id)}
                                   title="Cancel Appointment"
                               >
                                  <Icons.X />
                               </button>
                           )}
                         </div>
                       </div>
                    </div>
                  );
                })}
               </div>
              </div>
             )
           ) : (
             /* Saved Properties Grid */
             savedProperties.length === 0 ? (
               <div style={{
                 backgroundColor: "var(--surface-color)",
                 padding: "60px",
                 borderRadius: "12px",
                 textAlign: "center",
                 border: "1px solid var(--border-color)"
               }}>
                 <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                   Your wishlist is empty.
                 </p>
                 <Link to="/properties">
                   <button style={{
                     padding: "12px 24px",
                     backgroundColor: "var(--secondary-color)",
                     color: "#000",
                     border: "none",
                     borderRadius: "8px",
                     cursor: "pointer",
                     fontSize: "1rem",
                     fontWeight: "bold"
                   }}>
                     Discover Properties
                   </button>
                 </Link>
               </div>
            ) : (
              <div style={{ padding: "24px" }}>
                <div className="active-listings-grid">
                 {savedProperties.map((property) => {
                  const title = property.title || "Property";
                   const image_urls = getArray(property.image_urls);
                   const photos = getArray(property.photos);
                   const image = image_urls[0] || photos[0] || null;
                   const location = property.city || property.address || "Location not specified";
 
                   return (
                    <div key={property.id} className="property-card-horizontal">
                       <div className="pch-image-container">
                         <ImageWithFallback 
                           src={image} 
                           alt={title} 
                           linkTo={`/properties/${property.id}`} 
                           state={{ property }}
                         />
                       </div>
                       <div className="pch-content">
                         <div className="pch-header">
                            <div className="pch-badge" style={{ backgroundColor: property.type === 'sale' ? '#10b981' : '#3b82f6', color: '#fff' }}>
                               {property.type === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                            </div>
                         </div>
                         
                         <h3 className="pch-title" style={{ fontSize: '24px' }}>{title}</h3>
                         
                         <div className="pch-location" style={{ marginBottom: '16px' }}>
                           <Icons.MapPin />
                           {location}
                         </div>
 
                         <div className="property-meta" style={{ display: 'flex', gap: '20px', marginBottom: '24px', color: 'var(--text-secondary)' }}>
                           <div className="meta-item">🛏 {property.bedrooms || '-'} Beds</div>
                           <div className="meta-item">🛁 {property.bathrooms || '-'} Baths</div>
                           <div className="meta-item">📐 {property.area || '-'} sqft</div>
                         </div>
 
                         <div className="pch-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                           <span className="pch-price" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--secondary-color)' }}>
                             ₹{property.price?.toLocaleString()}
                             {property.type !== 'sale' && <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/month</span>}
                           </span>
                         </div>
                         
                         <div className="pch-actions" style={{ marginTop: '20px' }}>
                           <Link to={`/properties/${property.id}`} state={{ property }} className="btn-view">
                              <Icons.Home /> VIEW DETAILS
                           </Link>
                           
                           <button 
                               className="btn-icon delete"
                               onClick={() => handleRemoveSaved(property.id)}
                               title="Remove from Saved"
                           >
                              <Icons.X />
                           </button>
                         </div>
                       </div>
                    </div>
                  );
                })}
               </div>
              </div>
             )
           )}
        </div>

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'var(--surface-color)',
              width: '100%',
              maxWidth: '600px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Appointment Details</h2>
                <button 
                  onClick={() => setSelectedAppointment(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <Icons.X />
                </button>
              </div>

              <div style={{ padding: '24px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                    {(() => {
                      const prop = selectedAppointment.properties || {};
                      const imageUrls = getArray(prop.image_urls);
                      const photos = getArray(prop.photos);
                      const modalImage =
                        imageUrls[0] ||
                        photos[0] ||
                        selectedAppointment.property_image ||
                        selectedAppointment.property_img ||
                        selectedAppointment.img ||
                        null;
                      return (
                        <ImageWithFallback 
                          src={modalImage}
                          alt="Property" 
                        />
                      );
                    })()}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{selectedAppointment.properties?.title || selectedAppointment.property_title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <Icons.MapPin />
                      {selectedAppointment.properties?.city || selectedAppointment.properties?.address || 'Location details available in listing'}
                    </div>
                  </div>
                </div>

                {selectedAppointment.proposed_dates && selectedAppointment.proposed_dates.length > 1 && selectedAppointment.status === 'pending' && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Your Proposed Dates</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedAppointment.proposed_dates.map((pd, idx) => (
                        <div key={idx} style={{ 
                          padding: '12px', 
                          backgroundColor: 'rgba(255,255,255,0.03)', 
                          borderRadius: '8px', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <Icons.Calendar />
                          <span>{new Date(pd.date).toLocaleDateString()} at {pd.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'accepted' ? 'rgba(5, 150, 105, 0.1)' : (selectedAppointment.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)'), 
                    borderRadius: '12px', 
                    border: selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'accepted' ? '1px solid #059669' : (selectedAppointment.status === 'rejected' ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)') 
                  }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>
                      {selectedAppointment.status === 'pending' ? 'PREFERRED DATE' : 
                       (selectedAppointment.status === 'rejected' ? 'APPOINTMENT DATE' : 'CONFIRMED DATE')}
                    </div>
                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icons.Calendar />
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'accepted' ? 'rgba(5, 150, 105, 0.1)' : (selectedAppointment.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)'), 
                    borderRadius: '12px', 
                    border: selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'accepted' ? '1px solid #059669' : (selectedAppointment.status === 'rejected' ? '1px solid var(--danger-color)' : '1px solid rgba(255,255,255,0.1)') 
                  }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>
                      {selectedAppointment.status === 'pending' ? 'PREFERRED TIME' : 
                       (selectedAppointment.status === 'rejected' ? 'APPOINTMENT TIME' : 'CONFIRMED TIME')}
                    </div>
                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icons.Clock />
                      {selectedAppointment.appointment_time}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Contact Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Name:</span> {selectedAppointment.user_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Email:</span> {selectedAppointment.user_email || user?.email || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Phone:</span> {selectedAppointment.user_phone || user?.user_metadata?.phone || 'N/A'}
                    </div>
                  </div>
                </div>

                {selectedAppointment.message && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Your Message</h4>
                    <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      "{selectedAppointment.message}"
                    </div>
                  </div>
                )}

                {selectedAppointment.status === 'rejected' && selectedAppointment.rejection_reason && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--danger-color)' }}>Rejection Reason</h4>
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      borderRadius: '12px', 
                      border: '1px solid var(--danger-color)',
                      color: 'var(--danger-color)', 
                      fontSize: '0.9rem' 
                    }}>
                      {selectedAppointment.rejection_reason}
                    </div>
                  </div>
                )}

                {selectedAppointment.status === 'cancelled' && selectedAppointment.cancellation_reason && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Cancellation Reason</h4>
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary)', 
                      fontSize: '0.9rem' 
                    }}>
                      {selectedAppointment.cancellation_reason}
                    </div>
                  </div>
                )}

                {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'rejected' && (
                  <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Reschedule Appointment</h4>
                    <form onSubmit={handleReschedule} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <input 
                        type="date" 
                        name="date" 
                        required 
                        defaultValue={selectedAppointment.appointment_date}
                        className="properties-search" 
                        style={{ flex: 1, minWidth: '150px' }}
                      />
                      <input 
                        type="time" 
                        name="time" 
                        required 
                        defaultValue={selectedAppointment.appointment_time}
                        className="properties-search" 
                        style={{ flex: 1, minWidth: '150px' }}
                      />
                      <button 
                        type="submit"
                        className="btn-view"
                        style={{ backgroundColor: 'var(--secondary-color)', color: '#000', border: 'none' }}
                      >
                        RESCHEDULE
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <button 
                  onClick={() => addToCalendar(selectedAppointment)}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--secondary-color)', 
                    background: 'transparent', 
                    color: 'var(--secondary-color)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Icons.Calendar /> ADD TO CALENDAR
                </button>
                
                {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'rejected' && (
                  <button 
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      background: 'var(--danger-color)', 
                      color: '#fff',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    CANCEL APPOINTMENT
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
