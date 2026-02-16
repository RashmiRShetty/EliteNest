import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "./supabase";
import Footer from "./components/Footer";
import "./App.css";
import "./Dashboard.css";

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

export default function NotificationsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('elitenest:sidebarCollapsed');
      return saved === '0' ? false : true;
    } catch {
      return true;
    }
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let subscription;

    const loadNotifications = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate("/loginpage");
          return;
        }

        setUser(currentUser);

        // Fetch notifications from notifications table
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.warn("Notifications table may not exist or error fetching:", error);
          if (notifications.length === 0) {
             setNotifications([]); 
          }
        } else {
          setNotifications(data || []);
          // Calculate unread count initially
          const unread = (data || []).filter(n => !n.read).length;
          setUnreadCount(unread);
        }

        // Set up real-time subscription
        subscription = supabase
          .channel('public:notifications')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'notifications', 
            filter: `user_id=eq.${currentUser.id}` 
          }, (payload) => {
            console.log("Real-time notification update:", payload);
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => {
                const updated = [payload.new, ...prev];
                setUnreadCount(updated.filter(n => !n.read).length);
                return updated;
              });
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => {
                const updated = prev.map(n => n.id === payload.new.id ? payload.new : n);
                setUnreadCount(updated.filter(n => !n.read).length);
                return updated;
              });
            }
          })
          .subscribe();

      } catch (error) {
        console.error("Error loading notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [navigate]);

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
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (!error) navigate("/", { replace: true });
    else setLoading(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev => {
        const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
        setUnreadCount(updated.filter(n => !n.read).length);
        return updated;
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user) return;
      
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Extract property ID from notification if available
    if (notification.property_id) {
      // If the notification is about a property being accepted/approved
      if (
        notification.type === 'property_accepted' || 
        notification.title?.includes('Accepted') || 
        notification.title?.includes('Approved')
      ) {
        navigate('/mylistings', { state: { reviewPropertyId: notification.property_id } });
      } else {
        // For other property notifications
        navigate('/mylistings');
      }
    } else {
      // Fallback for notifications without property_id (extract from message)
      // Message format: Your property "Title" has been accepted...
      const match = notification.message?.match(/Your property "([^"]+)"/);
      if (match && match[1]) {
        const propertyTitle = match[1];
        if (
          notification.type === 'property_accepted' || 
          notification.title?.includes('Accepted') || 
          notification.title?.includes('Approved')
        ) {
           navigate('/mylistings', { state: { reviewPropertyTitle: propertyTitle } });
        } else {
           navigate('/mylistings');
        }
      } else {
         // Generic fallback
         navigate('/mylistings');
      }
    }
  };

  const greeting = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container dark-theme">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">Elite Nest</Link>
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
          <Link to="/favorites?tab=appointments" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Calendar /></span>
            <span>Appointment History</span>
          </Link>
          <Link to="/favorites?tab=saved" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Heart /></span>
            <span>Saved Properties</span>
          </Link>
          <Link to="/notifications" className="nav-item active" onClick={closeSidebarOnWeb}>
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
            <Link to="/" className="header-brand">Elite Nest</Link>
            <nav className="header-links">
              <Link to="/dashboard" className="header-link">Home</Link>
              <Link to="/properties" className="header-link">Properties</Link>
              <Link to="/contact" className="header-link">Contact</Link>
              <Link to="/about" className="header-link">About Us</Link>
            </nav>
          </div>       
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button 
                className="icon-btn" 
                aria-label="Notifications"
                // No navigation needed as we are already on notifications page
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
            
            <div className="user-profile">
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

        {/* Notifications Content */}
        <div className="dashboard-page-content">
          <div className="section-header">
            <h2 className="section-title">Notifications</h2>
            {notifications.some(n => !n.read) && (
              <button 
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary-color)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                background: 'var(--surface-color)', 
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)'
              }}>
                <Icons.Bell />
                <p style={{ marginTop: '12px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: notification.read ? 'var(--surface-color)' : 'rgba(217, 119, 6, 0.1)',
                    border: '1px solid var(--border-color)',
                    borderLeft: notification.read ? '1px solid var(--border-color)' : '4px solid var(--secondary-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  className="notification-item"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      margin: 0 
                    }}>
                      {notification.title}
                    </h3>
                    <span style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)' 
                    }}>
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '14px', 
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {notification.message}
                  </p>
                  {!notification.read && (
                    <span style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--secondary-color)'
                    }}></span>
                  )}
                </div>
              ))
            )}
          </div>
          
          <Footer />
        </div>
      </main>
    </div>
  );
}
