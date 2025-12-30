import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import "./App.css";

export default function NotificationsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate("/loginpage");
          return;
        }

        setUser(currentUser);

        // Fetch notifications from notifications table
        // Note: You may need to create a 'notifications' table
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.warn("Notifications table may not exist:", error);
          // Create sample notifications for demo
          setNotifications([
            {
              id: 1,
              type: "info",
              title: "Welcome to Elite Nest!",
              message: "Thank you for joining. Start browsing properties to find your perfect home.",
              created_at: new Date().toISOString(),
              read: false
            }
          ]);
        } else {
          setNotifications(data || []);
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [navigate]);

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div style={{ padding: "100px", textAlign: "center" }}>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span style={{
                padding: "6px 12px",
                backgroundColor: "#dc2626",
                color: "#fff",
                borderRadius: "20px",
                fontSize: "0.9rem",
                fontWeight: "600"
              }}>
                {unreadCount} unread
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{
              backgroundColor: "#fff",
              padding: "60px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <p style={{ fontSize: "1.2rem", color: "#6b7280" }}>
                No notifications yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "15px" }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  style={{
                    backgroundColor: notification.read ? "#fff" : "#eff6ff",
                    padding: "20px",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    borderLeft: notification.read ? "4px solid #9ca3af" : "4px solid #1e40af",
                    cursor: notification.read ? "default" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", color: notification.read ? "#6b7280" : "#111827" }}>
                      {notification.title || notification.type}
                    </h3>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      {!notification.read && (
                        <span style={{
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#1e40af",
                          borderRadius: "50%"
                        }} />
                      )}
                      <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p style={{ color: notification.read ? "#6b7280" : "#374151", margin: 0 }}>
                    {notification.message || notification.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

