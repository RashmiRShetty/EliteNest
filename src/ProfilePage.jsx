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

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('elitenest:sidebarCollapsed');
      return saved === '0' ? false : true;
    } catch {
      return true;
    }
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let subscription;

    const loadUserProfile = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate("/loginpage");
          return;
        }

        setUser(currentUser);
        setProfileData({
          fullName: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "",
          email: currentUser.email || "",
          phone: currentUser.user_metadata?.phone || "",
          address: currentUser.user_metadata?.address || "",
        });

        // Try to fetch from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profile) {
          setProfileData({
            fullName: profile.full_name || profileData.fullName,
            email: profile.email || profileData.email,
            phone: profile.phone_number || profileData.phone,
            address: profile.address || profileData.address,
          });
        }

        // Fetch unread count
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('read', false);
        
        setUnreadCount(count || 0);

        // Subscribe to notifications
        subscription = supabase
          .channel('public:notifications')
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: `user_id=eq.${currentUser.id}` 
          }, () => {
            setUnreadCount(prev => prev + 1);
          })
          .subscribe();

      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.fullName,
          phone: profileData.phone,
          address: profileData.address,
        }
      });

      if (updateError) throw updateError;

      // Try to update/insert in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: profileData.email,
          full_name: profileData.fullName,
          phone_number: profileData.phone,
          address: profileData.address,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn("Could not update profiles table:", profileError);
      }

      alert("Profile updated successfully!");
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const greeting = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  if (loading) {
    return (
      <div className="loading-container dark-theme">
        <div className="spinner"></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading profile...</p>
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
          <Link to="/notifications" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Bell /></span>
            <span>Notifications</span>
          </Link>
          <Link to="/profile" className="nav-item active" onClick={closeSidebarOnWeb}>
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

        {/* Profile Content */}
        <div className="dashboard-page-content">
          <div className="section-header">
            <h2 className="section-title">My Profile</h2>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '14px' }}
              >
                Edit Profile
              </button>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    setEditMode(false);
                    window.location.reload();
                  }}
                  className="btn-secondary"
                  style={{ padding: '8px 20px', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary"
                  style={{ 
                    padding: '8px 20px', 
                    fontSize: '14px',
                    backgroundColor: saving ? 'var(--text-secondary)' : 'var(--secondary-color)'
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          <div style={{ 
            maxWidth: "100%", 
            background: 'var(--surface-color)',
            padding: '30px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            marginTop: '20px'
          }}>
            <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
              <div className="profile-field">
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--text-primary)" }}>
                  Full Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: 'var(--black-bg)',
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      fontSize: "1rem"
                    }}
                  />
                ) : (
                  <div style={{ 
                    padding: "12px", 
                    backgroundColor: "var(--black-bg)", 
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--text-primary)"
                  }}>
                    {profileData.fullName || "Not set"}
                  </div>
                )}
              </div>

              <div className="profile-field">
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--text-primary)" }}>
                  Email Address
                </label>
                <div style={{ 
                  padding: "12px", 
                  backgroundColor: "rgba(255,255,255,0.05)", 
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "var(--text-secondary)",
                  cursor: 'not-allowed'
                }}>
                  {profileData.email}
                </div>
                <small style={{ color: "var(--text-secondary)", marginTop: '4px', display: 'block' }}>Email cannot be changed</small>
              </div>

              <div className="profile-field">
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--text-primary)" }}>
                  Phone Number
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: 'var(--black-bg)',
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      fontSize: "1rem"
                    }}
                  />
                ) : (
                  <div style={{ 
                    padding: "12px", 
                    backgroundColor: "var(--black-bg)", 
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--text-primary)"
                  }}>
                    {profileData.phone || "Not set"}
                  </div>
                )}
              </div>

              <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--text-primary)" }}>
                  Primary Address
                </label>
                {editMode ? (
                  <textarea
                    name="address"
                    value={profileData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    rows="3"
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: 'var(--black-bg)',
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      fontSize: "1rem",
                      resize: "vertical"
                    }}
                  />
                ) : (
                  <div style={{ 
                    padding: "12px", 
                    backgroundColor: "var(--black-bg)", 
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    minHeight: '80px'
                  }}>
                    {profileData.address || "Not set"}
                  </div>
                )}
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}


