import React from "react";
import { supabase } from "../admin-supabase.js";
import emailjs from "@emailjs/browser";
export { default as PropertiesTab } from "./AdminProperties";
export { default as AppointmentsTab } from "./AdminAppointments";

export function RemindersTab({ properties, appointments, loading, emailConfig }) {
  const [reminderType, setReminderType] = React.useState("listings"); // "listings" or "appointments"
  const [sending, setSending] = React.useState({});

  const sendEmailReminder = async (type, data) => {
    const id = data.id;
    setSending(prev => ({ ...prev, [id]: true }));

    try {
      const { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } = emailConfig;
      
      if (!SERVICE_ID || SERVICE_ID === "service_xxxxxxx") {
        alert("Email configuration is not set up correctly.");
        return;
      }

      let templateParams = {};
      let userId = data.user_id || data.created_by;
      const userEmail = type === 'listing' ? data.contact_email : data.user_email;

      // If no userId, try to find user by email
      if (!userId && userEmail) {
        try {
          const { data: userData } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", userEmail)
            .single();
          
          if (userData) userId = userData.id;
        } catch (err) {
          console.warn("Could not find user by email for in-app notification:", err);
        }
      }

      if (type === 'listing') {
        templateParams = {
          to_name: data.contact_name || "Seller",
          to_email: data.contact_email,
          property_title: data.title,
          status: "Listing Expiry Warning",
          message: `Your listing for "${data.title}" is nearing its expiration date. Please log in to your dashboard to renew or repost it to keep it active.`,
          date_label: "Expiry Date",
          time_label: "Action Required",
          details_header: "Listing Details",
          view_link: window.location.origin + "/mylistings",
          logo_url: "https://raw.githubusercontent.com/RashmiShetty07/EliteNest/main/src/assets/logo.png"
        };

        // Create in-app notification for listing expiry
        if (userId) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "listing_expiry",
            title: "Listing Expiring Soon",
            message: `Your listing "${data.title}" will expire in ${getExpiryRemainingDays(data)} days.`,
            property_id: data.id,
            read: false,
            created_at: new Date().toISOString()
          });
        }
      } else {
        templateParams = {
          to_name: data.user_name || "Customer",
          to_email: data.user_email,
          property_title: data.property_title,
          status: "Appointment Tomorrow",
          message: `This is a reminder for your scheduled viewing of "${data.property_title}" tomorrow at ${data.appointment_time}. We look forward to seeing you!`,
          date_label: "Viewing Date",
          time_label: "Viewing Time",
          details_header: "Appointment Details",
          view_link: window.location.origin + "/favorites?tab=appointments",
          logo_url: "https://raw.githubusercontent.com/RashmiShetty07/EliteNest/main/src/assets/logo.png"
        };

        // Create in-app notification for appointment
        if (userId) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "appointment_reminder",
            title: "Appointment Tomorrow",
            message: `Reminder: You have a property viewing for "${data.property_title}" scheduled for tomorrow at ${data.appointment_time}.`,
            property_id: data.property_id,
            read: false,
            created_at: new Date().toISOString()
          });
        }
      }

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
      
      // Update sending state to 'sent'
      setSending(prev => ({ ...prev, [id]: 'sent' }));
      
      // Show success alert
      alert(`✅ Reminder sent to ${userEmail} and added to their notifications!`);
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("❌ Failed to send reminder: " + (error.text || error.message));
      setSending(prev => ({ ...prev, [id]: false }));
    }
  };

  const getExpiryRemainingDays = (property) => {
    if (property.status !== "approved") return null;
    const createdAt = new Date(property.created_at);
    const now = new Date();
    const pkg = (property.package_name || "Silver").toLowerCase();
    let validityDays = 15;
    if (pkg === "gold") validityDays = 30;
    else if (pkg === "platinum") validityDays = 45;
    const expiryDate = new Date(createdAt);
    expiryDate.setDate(createdAt.getDate() + validityDays);
    
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nearExpiryProperties = properties.filter(p => {
    const days = getExpiryRemainingDays(p);
    return days !== null && days <= 5 && days > 0;
  }).sort((a, b) => getExpiryRemainingDays(a) - getExpiryRemainingDays(b));

  const upcomingAppointments = (appointments || []).filter(app => {
    if (!app.appointment_date) return false;
    const appDate = new Date(app.appointment_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    appDate.setHours(0, 0, 0, 0);
    
    const diffTime = appDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1; // Exactly 1 day left
  });

  return (
    <div style={{ padding: "20px", color: "#e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h2 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "12px" }}>
          🔔 {reminderType === "listings" ? "Listing Expiry" : "Appointment"} Reminders
        </h2>
        
        <div style={{ 
          display: 'flex', 
          background: 'rgba(255,255,255,0.05)', 
          padding: '4px', 
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button 
            onClick={() => setReminderType("listings")}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: reminderType === "listings" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
              color: "#fff",
              fontWeight: "600",
              transition: "all 0.3s"
            }}
          >
            Listings ({nearExpiryProperties.length})
          </button>
          <button 
            onClick={() => setReminderType("appointments")}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: reminderType === "appointments" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "transparent",
              color: "#fff",
              fontWeight: "600",
              transition: "all 0.3s"
            }}
          >
            Appointments ({upcomingAppointments.length})
          </button>
        </div>
      </div>

      {reminderType === "listings" ? (
        <>
          <p style={{ color: "#94a3b8", marginBottom: "32px", fontSize: "1.05rem" }}>
            The following listings are nearing their expiration date (5 days or less remaining).
          </p>

          {nearExpiryProperties.length === 0 ? (
            <div style={{
              background: "rgba(16, 185, 129, 0.05)",
              border: "2px dashed rgba(16, 185, 129, 0.2)",
              borderRadius: "20px",
              padding: "80px 40px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "4rem", marginBottom: "20px" }}>✅</div>
              <h3 style={{ color: "#fff", fontSize: "1.5rem", marginBottom: "8px" }}>No listings nearing expiry</h3>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
              {nearExpiryProperties.map((p) => {
                const daysLeft = getExpiryRemainingDays(p);
                const imageUrl = p.image_urls?.[0] || p.photos?.[0] || "https://via.placeholder.com/300x200?text=No+Image";
                return (
                  <div key={p.id} style={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    borderRadius: "20px",
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                  }}>
                    <div style={{ position: "relative", height: "180px" }}>
                      <img src={imageUrl} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{
                        position: "absolute", top: 12, right: 12,
                        background: daysLeft <= 1 ? "#ef4444" : "#f59e0b",
                        color: "#fff", padding: "6px 14px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: "800"
                      }}>
                        {daysLeft} Day{daysLeft !== 1 ? 's' : ''} Left
                      </div>
                    </div>
                    <div style={{ padding: "20px" }}>
                      <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>{p.title}</h3>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "12px" }}>
                        <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Seller: {p.contact_name}</div>
                        <div style={{ fontSize: "0.85rem", color: "#667eea" }}>{p.contact_email}</div>
                      </div>
                      <button
                        onClick={() => sendEmailReminder('listing', p)}
                        disabled={sending[p.id] === true || sending[p.id] === 'sent'}
                        style={{
                          width: "100%",
                          marginTop: "16px",
                          padding: "10px",
                          background: sending[p.id] === 'sent' 
                            ? "rgba(16, 185, 129, 0.2)" 
                            : "linear-gradient(135deg, #f59e0b, #d97706)",
                          color: sending[p.id] === 'sent' ? "#10b981" : "#fff",
                          border: sending[p.id] === 'sent' ? "1px solid #10b981" : "none",
                          borderRadius: "10px",
                          fontWeight: "700",
                          cursor: (sending[p.id] === true || sending[p.id] === 'sent') ? "not-allowed" : "pointer",
                          opacity: sending[p.id] === true ? 0.7 : 1,
                          transition: "all 0.3s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px"
                        }}
                      >
                        {sending[p.id] === true ? "Sending..." : 
                         sending[p.id] === 'sent' ? "✅ Reminder Sent" : "📨 Send Expiry Reminder"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <p style={{ color: "#94a3b8", marginBottom: "32px", fontSize: "1.05rem" }}>
            The following appointments are scheduled for <strong>tomorrow</strong>.
          </p>

          {upcomingAppointments.length === 0 ? (
            <div style={{
              background: "rgba(59, 130, 246, 0.05)",
              border: "2px dashed rgba(59, 130, 246, 0.2)",
              borderRadius: "20px",
              padding: "80px 40px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "4rem", marginBottom: "20px" }}>📅</div>
              <h3 style={{ color: "#fff", fontSize: "1.5rem", marginBottom: "8px" }}>No appointments for tomorrow</h3>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
              {upcomingAppointments.map((app) => (
                <div key={app.id} style={{
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                      <div style={{ color: "#3b82f6", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>Tomorrow</div>
                      <h3 style={{ fontSize: "1.2rem", margin: 0 }}>{app.property_title}</h3>
                    </div>
                    <div style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", padding: "8px 12px", borderRadius: "12px", fontWeight: "700" }}>
                      🕒 {app.appointment_time}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>👤</div>
                      <div>
                        <div style={{ fontWeight: "600" }}>{app.user_name}</div>
                        <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{app.user_email}</div>
                      </div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "12px", fontSize: "0.9rem" }}>
                      📞 {app.mobile_number}
                    </div>
                    <button
                      onClick={() => sendEmailReminder('appointment', app)}
                      disabled={sending[app.id] === true || sending[app.id] === 'sent'}
                      style={{
                        width: "100%",
                        marginTop: "8px",
                        padding: "10px",
                        background: sending[app.id] === 'sent'
                          ? "rgba(16, 185, 129, 0.2)"
                          : "linear-gradient(135deg, #3b82f6, #2563eb)",
                        color: sending[app.id] === 'sent' ? "#10b981" : "#fff",
                        border: sending[app.id] === 'sent' ? "1px solid #10b981" : "none",
                        borderRadius: "10px",
                        fontWeight: "700",
                        cursor: (sending[app.id] === true || sending[app.id] === 'sent') ? "not-allowed" : "pointer",
                        opacity: sending[app.id] === true ? 0.7 : 1,
                        transition: "all 0.3s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}
                    >
                      {sending[app.id] === true ? "Sending..." : 
                       sending[app.id] === 'sent' ? "✅ Reminder Sent" : "📨 Send Visit Reminder"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function PaymentsTab({ payments, loading }) {
  const totalEarnings = payments.reduce((acc, p) => acc + p.amount, 0);
  const silverCount = payments.filter(p => p.package_name === 'Silver').length;
  const goldCount = payments.filter(p => p.package_name === 'Gold').length;
  const platinumCount = payments.filter(p => p.package_name === 'Platinum').length;

  return (
    <div style={{ padding: "20px", color: "#e5e7eb" }}>
      <h2 style={{ marginBottom: "24px", fontSize: "1.8rem", fontWeight: "700" }}>💰 Payment Details</h2>
      
      {/* Earnings Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "0.9rem", color: "#a0aec0", marginBottom: "8px", textTransform: "uppercase" }}>Total Earnings</div>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#10b981" }}>₹{totalEarnings.toLocaleString()}</div>
        </div>
        <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "0.9rem", color: "#a0aec0", marginBottom: "8px", textTransform: "uppercase" }}>Total Transactions</div>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#3b82f6" }}>{payments.length}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <div style={{ background: "rgba(148, 163, 184, 0.1)", border: "1px solid rgba(148, 163, 184, 0.3)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Silver Packages</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{silverCount}</div>
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "#94a3b8" }}>₹{(silverCount * 299).toLocaleString()}</div>
        </div>
        <div style={{ background: "rgba(250, 204, 21, 0.1)", border: "1px solid rgba(250, 204, 21, 0.3)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#facc15" }}>Gold Packages</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{goldCount}</div>
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "#facc15" }}>₹{(goldCount * 499).toLocaleString()}</div>
        </div>
        <div style={{ background: "rgba(236, 72, 153, 0.1)", border: "1px solid rgba(236, 72, 153, 0.3)", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#ec4899" }}>Platinum Packages</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{platinumCount}</div>
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "#ec4899" }}>₹{(platinumCount * 999).toLocaleString()}</div>
        </div>
      </div>

      <h3 style={{ marginBottom: "16px", fontSize: "1.4rem", fontWeight: "600" }}>Recent Transactions</h3>
      <div style={{ overflowX: "auto", background: "rgba(15, 23, 42, 0.9)", borderRadius: "16px", border: "1px solid rgba(148, 163, 184, 0.3)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.3)", textAlign: "left" }}>
              <th style={{ padding: "16px" }}>Date</th>
              <th style={{ padding: "16px" }}>Customer</th>
              <th style={{ padding: "16px" }}>Property</th>
              <th style={{ padding: "16px" }}>Package</th>
              <th style={{ padding: "16px" }}>Amount</th>
              <th style={{ padding: "16px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>No transactions found.</td>
              </tr>
            ) : (
              payments.map((p, idx) => (
                <tr key={p.id || idx} style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.1)", transition: "background 0.2s" }}>
                  <td style={{ padding: "16px" }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td style={{ padding: "16px" }}>
                    <div>{p.contact_name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{p.contact_email}</div>
                  </td>
                  <td style={{ padding: "16px" }}>{p.title}</td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ 
                      padding: "4px 10px", 
                      borderRadius: "99px", 
                      fontSize: "0.75rem", 
                      fontWeight: "700",
                      background: p.package_name === 'Silver' ? "rgba(148, 163, 184, 0.2)" : p.package_name === 'Gold' ? "rgba(250, 204, 21, 0.2)" : "rgba(236, 72, 153, 0.2)",
                      color: p.package_name === 'Silver' ? "#94a3b8" : p.package_name === 'Gold' ? "#facc15" : "#ec4899"
                    }}>
                      {p.package_name}
                    </span>
                  </td>
                  <td style={{ padding: "16px", fontWeight: "600" }}>₹{p.amount.toLocaleString()}</td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ color: "#10b981", fontSize: "0.85rem", fontWeight: "600" }}>● {p.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function UsersTab({ users, fetchUsers, loading }) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const getDisplayName = (user) => {
    const fromFields =
      user.name ||
      user.full_name ||
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.username;
    if (fromFields && String(fromFields).trim().length > 0) return fromFields;
    if (user.email) return String(user.email).split("@")[0];
    return "Unknown User";
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  const getDisplayId = (user, fallbackIndex) => {
    const raw = user.user_id || user.id || user.uuid || "";
    const suffix = raw ? String(raw).slice(-4).toUpperCase() : String(fallbackIndex).padStart(4, "0");
    return `#EN-${suffix}`;
  };

  const getRole = (user) => user.role || user.user_role || user.account_type || user.user_type || "Buyer";
  const getStatus = (user) => {
    if (user.status) return user.status;
    if (user.is_active === false) return "Inactive";
    return "Active";
  };

  const handleEditUser = async (user) => {
    const currentName = getDisplayName(user);
    const newName = window.prompt("Edit full name for this user:", currentName);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      alert("Name cannot be empty.");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: trimmed })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating user profile:", error);
        alert("Failed to update user. Please try again.");
      } else {
        alert("User updated successfully.");
        fetchUsers();
      }
    } catch (err) {
      console.error("Unexpected error updating user:", err);
      alert("Unexpected error while updating user.");
    }
  };

  const handleDeleteUser = async (user) => {
    const name = getDisplayName(user);
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${name}"?`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (error) {
        console.error("Error deleting user profile:", error);
        alert("Failed to delete user. Please try again.");
      } else {
        alert("User deleted successfully.");
        fetchUsers();
      }
    } catch (err) {
      console.error("Unexpected error deleting user:", err);
      alert("Unexpected error while deleting user.");
    }
  };

  const filteredUsers = users.filter((user) => {
    const name = getDisplayName(user).toLowerCase();
    const email = (user.email || "").toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  const displayedUsers = filteredUsers;

  return (
    <div style={{ fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#1f2937" }}>Users</h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "0.95rem" }}>Manage and monitor all platform members.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.9rem" }}>🔍</span>
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
              placeholder="Search users..."
              style={{
                padding: "10px 14px 10px 34px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
                fontSize: "0.95rem",
                width: 220
              }}
            />
          </div>

          <button
            onClick={fetchUsers}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>

          <button
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #f97316, #f59e0b)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(249, 115, 22, 0.35)"
            }}
          >
            + Add New User
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eef2f7", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #eef2f7", display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", color: "#94a3b8", fontWeight: 600, fontSize: "0.8rem", letterSpacing: "0.6px", textTransform: "uppercase" }}>
          <div>User Profile</div>
          <div>Email Address</div>
          <div>Role</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {displayedUsers.length === 0 ? (
          <div style={{ padding: "28px 22px", color: "#6b7280" }}>{loading ? "Loading users..." : "No users found."}</div>
        ) : (
          displayedUsers.map((user, index) => {
            const name = getDisplayName(user);
            const initials = getInitials(name);
            const role = getRole(user);
            const status = getStatus(user);
            const statusColor = status.toLowerCase() === "active" ? "#10b981" : "#9ca3af";
            return (
              <div key={user.id || index} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", padding: "18px 22px", alignItems: "center", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#6b7280" }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#111827" }}>{name}</div>
                  </div>
                </div>

                <div style={{ color: "#6b7280" }}>{user.email || "N/A"}</div>

                <div>
                  <span style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: role.toLowerCase() === "admin" ? "#ede9fe" : role.toLowerCase() === "seller" ? "#fef3c7" : "#dbeafe",
                    color: role.toLowerCase() === "admin" ? "#7c3aed" : role.toLowerCase() === "seller" ? "#d97706" : "#2563eb",
                    fontWeight: 600,
                    fontSize: "0.85rem"
                  }}>
                    {role}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, color: statusColor, fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, display: "inline-block" }}></span>
                  {status}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    title="Edit user"
                    onClick={() => handleEditUser(user)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#374151",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.85rem"
                    }}
                  >
                    Edit
                  </button>
                  <button
                    title="Delete user"
                    onClick={() => handleDeleteUser(user)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#b91c1c",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.85rem"
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


export function SellersTab({ sellers, fetchSellers, updateStatus, setEditingProperty, setShowModal }) {
  const [selectedSeller, setSelectedSeller] = React.useState(null);
  const [showModalLocal, setShowModalLocal] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const filteredByStatus = filterStatus === "all" 
    ? sellers 
    : sellers.filter(p => p.status === filterStatus);

  const filteredSellers = filteredByStatus.filter((p) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const title = (p.title || "").toLowerCase();
    const address = (p.address || "").toLowerCase();
    const city = (p.city || "").toLowerCase();
    const contactName = (p.contact_name || "").toLowerCase();
    const contactEmail = (p.contact_email || "").toLowerCase();
    const contactPhone = (p.contact_phone || "").toLowerCase();
    return (
      title.includes(query) ||
      address.includes(query) ||
      city.includes(query) ||
      contactName.includes(query) ||
      contactEmail.includes(query) ||
      contactPhone.includes(query)
    );
  });
  
  const displayedSellers = filteredSellers;

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      if (!updateStatus) {
        console.warn("updateStatus function is not provided");
        return;
      }
      await updateStatus(propertyId, newStatus);
      setShowModalLocal(false);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + (error.message || "Unknown error"));
    }
  };

  const handleEdit = (seller) => {
    setShowModalLocal(false);
    setEditingProperty(seller);
    setShowModal(true);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={fetchSellers} style={{
          padding: "12px 24px",
          cursor: "pointer",
          background: "linear-gradient(135deg, #764ba2, #ec4899)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem",
          fontWeight: "600",
          boxShadow: "0 4px 15px rgba(118, 75, 162, 0.4)",
          transition: "all 0.3s"
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = "0 6px 20px rgba(118, 75, 162, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 4px 15px rgba(118, 75, 162, 0.4)";
        }}>🛍️ Load Sellers</button>
        
        {sellers.length > 0 && (
          <>
            <span style={{
              background: "rgba(118, 75, 162, 0.15)",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "600",
              border: "1px solid rgba(118, 75, 162, 0.3)"
            }}>
              Total: {sellers.length} sellers
            </span>
            
            <div style={{ 
              display: 'flex', 
              background: 'rgba(118, 75, 162, 0.1)', 
              padding: '6px', 
              borderRadius: '10px', 
              border: '1px solid rgba(118, 75, 162, 0.3)',
              gap: '4px'
            }}>
              <button 
                onClick={() => { setFilterStatus("all"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "all" ? "linear-gradient(135deg, #764ba2, #ec4899)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                All
              </button>
              <button 
                onClick={() => { setFilterStatus("pending"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "pending" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                ⏳ Pending
              </button>
              <button 
                onClick={() => { setFilterStatus("accepted"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "accepted" ? "linear-gradient(135deg, #10b981, #059669)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                ✅ Accepted
              </button>
              <button 
                onClick={() => { setFilterStatus("rejected"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "rejected" ? "linear-gradient(135deg, #ef4444, #dc2626)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                ❌ Rejected
              </button>
            </div>

            <div style={{ position: "relative", marginLeft: "auto" }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#e5e7eb",
                  fontSize: "0.9rem",
                }}
              >
                🔍
              </span>
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search sellers..."
                style={{
                  padding: "8px 12px 8px 32px",
                  borderRadius: 999,
                  border: "1px solid rgba(148, 163, 184, 0.6)",
                  background: "rgba(15, 23, 42, 0.9)",
                  fontSize: "0.9rem",
                  color: "#e5e7eb",
                  minWidth: 220,
                }}
              />
            </div>
          </>
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        {sellers.length === 0 ? (
          <div style={{
            background: "rgba(118, 75, 162, 0.1)",
            border: "2px dashed rgba(118, 75, 162, 0.3)",
            borderRadius: "16px",
            padding: "60px 40px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🛍️</div>
            <p style={{ 
              color: "#fff", 
              fontSize: "1.3rem", 
              fontWeight: "600",
              margin: "0 0 8px 0"
            }}>No sellers loaded</p>
            <p style={{
              color: "#a0aec0",
              fontSize: "1rem",
              margin: 0
            }}>Click "Load Sellers" button to fetch seller properties from database</p>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div style={{
            background: "rgba(118, 75, 162, 0.1)",
            border: "2px dashed rgba(118, 75, 162, 0.3)",
            borderRadius: "16px",
            padding: "60px 40px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🔍</div>
            <p style={{ 
              color: "#fff", 
              fontSize: "1.3rem", 
              fontWeight: "600",
              margin: "0 0 8px 0"
            }}>No sellers found</p>
            <p style={{
              color: "#a0aec0",
              fontSize: "1rem",
              margin: 0
            }}>No seller properties match the selected filter: {filterStatus}</p>
          </div>
        ) : (
          <>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24, 
              marginBottom: 20 
            }}>
              {displayedSellers.map((p) => {
                const imageUrl = (p.image_urls && p.image_urls.length > 0) 
                  ? p.image_urls[0] 
                  : (p.photos && p.photos.length > 0) 
                    ? p.photos[0] 
                    : "https://via.placeholder.com/300x200?text=No+Image";
                
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedSeller(p); setShowModalLocal(true); }}
                    style={{
                      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                      border: "2px solid #764ba240",
                      borderRadius: 16,
                      cursor: "pointer",
                      color: "#fff",
                      transition: "all 0.3s",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                      overflow: "hidden"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 20px 50px rgba(118, 75, 162, 0.6)";
                      e.currentTarget.style.transform = "translateY(-8px)";
                      e.currentTarget.style.borderColor = "#764ba2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "#764ba240";
                    }}
                  >
                    <div style={{
                      width: "100%",
                      height: "200px",
                      overflow: "hidden",
                      position: "relative"
                    }}>
                      <img 
                        src={imageUrl} 
                        alt={p.title} 
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                        onError={(e) => { e.target.src = "https://via.placeholder.com/300x200?text=No+Image"; }}
                      />
                      <div style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: p.status === "pending" ? "rgba(245, 158, 11, 0.9)" : p.status === "accepted" ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)",
                        color: "#fff",
                        fontSize: "0.8rem",
                        fontWeight: "700"
                      }}>
                        {p.status ? p.status.toUpperCase() : "UNKNOWN"}
                      </div>
                    </div>

                    <div style={{ padding: 16 }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem" }}>{p.title || "Untitled Property"}</h3>
                      <p style={{ margin: "0 0 8px 0", color: "#cbd5f5", fontSize: "0.9rem" }}>
                        {p.address || "No address"}, {p.city || "No city"}
                      </p>
                      <p style={{ margin: "0 0 12px 0", color: "#e5e7eb", fontWeight: "600" }}>
                        ₹ {p.price ? p.price.toLocaleString() : "N/A"}
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(p.id, "accepted"); }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "none",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#fff",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(p.id, "rejected"); }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "none",
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            color: "#fff",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "1px solid rgba(148, 163, 184, 0.6)",
                            background: "transparent",
                            color: "#e5e7eb",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showModalLocal && selectedSeller && (
        <PropertyModal
          property={selectedSeller}
          onClose={() => setShowModalLocal(false)}
        />
      )}
    </div>
  );
}

export function LeasesTab({ leases, fetchLeases, updateStatus, setEditingProperty, setShowModal }) {
  const [selectedLease, setSelectedLease] = React.useState(null);
  const [showModalLocal, setShowModalLocal] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const leasesPerPage = 8;
  
  const filteredByStatus = filterStatus === "all" 
    ? leases 
    : leases.filter(p => p.status === filterStatus);

  const filteredLeases = filteredByStatus.filter((p) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const title = (p.title || "").toLowerCase();
    const address = (p.address || "").toLowerCase();
    const city = (p.city || "").toLowerCase();
    const contactName = (p.contact_name || "").toLowerCase();
    const contactEmail = (p.contact_email || "").toLowerCase();
    const contactPhone = (p.contact_phone || "").toLowerCase();
    return (
      title.includes(query) ||
      address.includes(query) ||
      city.includes(query) ||
      contactName.includes(query) ||
      contactEmail.includes(query) ||
      contactPhone.includes(query)
    );
  });
  
  const displayedLeases = filteredLeases;

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      if (!updateStatus) {
        console.warn("updateStatus function is not provided");
        return;
      }
      await updateStatus(propertyId, newStatus);
      setShowModalLocal(false);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + (error.message || "Unknown error"));
    }
  };

  const handleEdit = (lease) => {
    setShowModalLocal(false);
    setEditingProperty(lease);
    setShowModal(true);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={fetchLeases} style={{
          padding: "12px 24px",
          cursor: "pointer",
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem",
          fontWeight: "600",
          boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
          transition: "all 0.3s"
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
        }}>🏢 Load Leases</button>
        
        {leases.length > 0 && (
          <>
            <span style={{
              background: "rgba(59, 130, 246, 0.15)",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "600",
              border: "1px solid rgba(59, 130, 246, 0.3)"
            }}>
              Total: {leases.length} leases
            </span>
            
            <div style={{ 
              display: 'flex', 
              background: 'rgba(59, 130, 246, 0.1)', 
              padding: '6px', 
              borderRadius: '10px', 
              border: '1px solid rgba(59, 130, 246, 0.3)',
              gap: '4px'
            }}>
              <button 
                onClick={() => { setFilterStatus("all"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "all" ? "linear-gradient(135deg, #3b82f6, #06b6d4)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                All
              </button>
              <button 
                onClick={() => { setFilterStatus("pending"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "pending" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                ⏳ Pending
              </button>
              <button 
                onClick={() => { setFilterStatus("accepted"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "accepted" ? "linear-gradient(135deg, #10b981, #059669)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                ✅ Accepted
              </button>
              <button 
                onClick={() => { setFilterStatus("rejected"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "rejected" ? "linear-gradient(135deg, #ef4444, #dc2626)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                ❌ Rejected
              </button>
            </div>

            <div style={{ position: "relative", marginLeft: "auto" }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#e5e7eb",
                  fontSize: "0.9rem",
                }}
              >
                🔍
              </span>
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search leases..."
                style={{
                  padding: "8px 12px 8px 32px",
                  borderRadius: 999,
                  border: "1px solid rgba(148, 163, 184, 0.6)",
                  background: "rgba(15, 23, 42, 0.9)",
                  fontSize: "0.9rem",
                  color: "#e5e7eb",
                  minWidth: 220,
                }}
              />
            </div>
          </>
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        {leases.length === 0 ? (
          <div style={{
            background: "rgba(59, 130, 246, 0.1)",
            border: "2px dashed rgba(59, 130, 246, 0.3)",
            borderRadius: "16px",
            padding: "60px 40px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🏢</div>
            <p style={{ 
              color: "#fff", 
              fontSize: "1.3rem", 
              fontWeight: "600",
              margin: "0 0 8px 0"
            }}>No leases loaded</p>
            <p style={{
              color: "#a0aec0",
              fontSize: "1rem",
              margin: 0
            }}>Click "Load Leases" button to fetch leases from database</p>
          </div>
        ) : filteredLeases.length === 0 ? (
          <div style={{
            background: "rgba(59, 130, 246, 0.1)",
            border: "2px dashed rgba(59, 130, 246, 0.3)",
            borderRadius: "16px",
            padding: "60px 40px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🔍</div>
            <p style={{ 
              color: "#fff", 
              fontSize: "1.3rem", 
              fontWeight: "600",
              margin: "0 0 8px 0"
            }}>No leases found</p>
            <p style={{
              color: "#a0aec0",
              fontSize: "1rem",
              margin: 0
            }}>No leases match the selected filter: {filterStatus}</p>
          </div>
        ) : (
          <>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24, 
              marginBottom: 20 
            }}>
              {displayedLeases.map((p) => {
                const imageUrl = (p.image_urls && p.image_urls.length > 0) 
                  ? p.image_urls[0] 
                  : (p.photos && p.photos.length > 0) 
                    ? p.photos[0] 
                    : "https://via.placeholder.com/300x200?text=No+Image";
                
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedLease(p); setShowModalLocal(true); }}
                    style={{
                      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                      border: "2px solid #3b82f640",
                      borderRadius: 16,
                      cursor: "pointer",
                      color: "#fff",
                      transition: "all 0.3s",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                      overflow: "hidden"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 20px 50px rgba(59, 130, 246, 0.6)";
                      e.currentTarget.style.transform = "translateY(-8px)";
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "#3b82f640";
                    }}
                  >
                    <div style={{
                      width: "100%",
                      height: "200px",
                      overflow: "hidden",
                      position: "relative"
                    }}>
                      <img 
                        src={imageUrl} 
                        alt={p.title} 
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                        onError={(e) => { e.target.src = "https://via.placeholder.com/300x200?text=No+Image"; }}
                      />
                      <div style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: p.status === "pending" ? "rgba(245, 158, 11, 0.9)" : p.status === "accepted" ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)",
                        color: "#fff",
                        fontSize: "0.8rem",
                        fontWeight: "700"
                      }}>
                        {p.status ? p.status.toUpperCase() : "UNKNOWN"}
                      </div>
                    </div>

                    <div style={{ padding: 16 }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem" }}>{p.title || "Untitled Property"}</h3>
                      <p style={{ margin: "0 0 8px 0", color: "#cbd5f5", fontSize: "0.9rem" }}>
                        {p.address || "No address"}, {p.city || "No city"}
                      </p>
                      <p style={{ margin: "0 0 12px 0", color: "#e5e7eb", fontWeight: "600" }}>
                        ₹ {p.price ? p.price.toLocaleString() : "N/A"}
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(p.id, "accepted"); }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "none",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#fff",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(p.id, "rejected"); }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "none",
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            color: "#fff",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "1px solid rgba(148, 163, 184, 0.6)",
                            background: "transparent",
                            color: "#e5e7eb",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showModalLocal && selectedLease && (
        <PropertyModal
          property={selectedLease}
          onClose={() => setShowModalLocal(false)}
        />
      )}
    </div>
  );
}

export function RentalsTab({ rentals, fetchRentals, updateStatus, setEditingProperty, setShowModal }) {
  const [selectedRental, setSelectedRental] = React.useState(null);
  const [showModalLocal, setShowModalLocal] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const filteredByStatus = filterStatus === "all" 
    ? rentals 
    : rentals.filter(p => p.status === filterStatus);

  const filteredRentals = filteredByStatus.filter((p) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const title = (p.title || "").toLowerCase();
    const address = (p.address || "").toLowerCase();
    const city = (p.city || "").toLowerCase();
    const contactName = (p.contact_name || "").toLowerCase();
    const contactEmail = (p.contact_email || "").toLowerCase();
    const contactPhone = (p.contact_phone || "").toLowerCase();
    return (
      title.includes(query) ||
      address.includes(query) ||
      city.includes(query) ||
      contactName.includes(query) ||
      contactEmail.includes(query) ||
      contactPhone.includes(query)
    );
  });
  
  const displayedRentals = filteredRentals;

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      if (!updateStatus) {
        console.warn("updateStatus function is not provided");
        return;
      }
      await updateStatus(propertyId, newStatus);
      setShowModalLocal(false);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + (error.message || "Unknown error"));
    }
  };

  const handleEdit = (rental) => {
    setShowModalLocal(false);
    setEditingProperty(rental);
    setShowModal(true);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={fetchRentals} style={{
          padding: "12px 24px",
          cursor: "pointer",
          background: "linear-gradient(135deg, #764ba2, #ec4899)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem",
          fontWeight: "600",
          boxShadow: "0 4px 15px rgba(118, 75, 162, 0.4)",
          transition: "all 0.3s"
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = "0 6px 20px rgba(118, 75, 162, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 4px 15px rgba(118, 75, 162, 0.4)";
        }}>🏠 Load Rentals</button>
        
        {rentals.length > 0 && (
          <>
            <span style={{
              background: "rgba(118, 75, 162, 0.15)",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "600",
              border: "1px solid rgba(118, 75, 162, 0.3)"
            }}>
              Total: {rentals.length} rentals
            </span>
            
            <div style={{ 
              display: 'flex', 
              background: 'rgba(118, 75, 162, 0.1)', 
              padding: '6px', 
              borderRadius: '10px', 
              border: '1px solid rgba(118, 75, 162, 0.3)',
              gap: '4px'
            }}>
              <button 
                onClick={() => { setFilterStatus("all"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "all" ? "linear-gradient(135deg, #764ba2, #ec4899)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                All
              </button>
              <button 
                onClick={() => { setFilterStatus("pending"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "pending" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                ⏳ Pending
              </button>
              <button 
                onClick={() => { setFilterStatus("accepted"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "accepted" ? "linear-gradient(135deg, #10b981, #059669)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                ✅ Accepted
              </button>
              <button 
                onClick={() => { setFilterStatus("rejected"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "rejected" ? "linear-gradient(135deg, #ef4444, #dc2626)" : "transparent",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s"
                }}
              >
                ❌ Rejected
              </button>
            </div>

            <div style={{ position: "relative", marginLeft: "auto" }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#e5e7eb",
                  fontSize: "0.9rem",
                }}
              >
                🔍
              </span>
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search rentals..."
                style={{
                  padding: "8px 12px 8px 32px",
                  borderRadius: 999,
                  border: "1px solid rgba(148, 163, 184, 0.6)",
                  background: "rgba(15, 23, 42, 0.9)",
                  fontSize: "0.9rem",
                  color: "#e5e7eb",
                  minWidth: 220,
                }}
              />
            </div>
          </>
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        {rentals.length === 0 ? (
          <div style={{
            background: "rgba(118, 75, 162, 0.1)",
            border: "2px dashed rgba(118, 75, 162, 0.3)",
            borderRadius: "16px",
            padding: "60px 40px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🏠</div>
            <p style={{ 
              color: "#fff", 
              fontSize: "1.3rem", 
              fontWeight: "600",
              margin: "0 0 8px 0"
            }}>No rentals loaded</p>
            <p style={{
              color: "#a0aec0",
              fontSize: "1rem",
              margin: 0
            }}>Click "Load Rentals" button to fetch rentals from database</p>
          </div>
        ) : filteredRentals.length === 0 ? (
          <div style={{
            background: "rgba(118, 75, 162, 0.1)",
            border: "2px dashed rgba(118, 75, 162, 0.3)",
            borderRadius: "16px",
            padding: "60px 40px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🔍</div>
            <p style={{ 
              color: "#fff", 
              fontSize: "1.3rem", 
              fontWeight: "600",
              margin: "0 0 8px 0"
            }}>No rentals found</p>
            <p style={{
              color: "#a0aec0",
              fontSize: "1rem",
              margin: 0
            }}>No rentals match the selected filter: {filterStatus}</p>
          </div>
        ) : (
          <>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24, 
              marginBottom: 20 
            }}>
              {displayedRentals.map((p) => {
                const imageUrl = (p.image_urls && p.image_urls.length > 0) 
                  ? p.image_urls[0] 
                  : (p.photos && p.photos.length > 0) 
                    ? p.photos[0] 
                    : "https://via.placeholder.com/300x200?text=No+Image";
                
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedRental(p); setShowModalLocal(true); }}
                    style={{
                      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                      border: "2px solid #764ba240",
                      borderRadius: 16,
                      cursor: "pointer",
                      color: "#fff",
                      transition: "all 0.3s",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                      overflow: "hidden"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 20px 50px rgba(118, 75, 162, 0.6)";
                      e.currentTarget.style.transform = "translateY(-8px)";
                      e.currentTarget.style.borderColor = "#764ba2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "#764ba240";
                    }}
                  >
                    <div style={{
                      width: "100%",
                      height: "200px",
                      overflow: "hidden",
                      position: "relative"
                    }}>
                      <img 
                        src={imageUrl} 
                        alt={p.title} 
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                        onError={(e) => { e.target.src = "https://via.placeholder.com/300x200?text=No+Image"; }}
                      />
                      <div style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: p.status === "pending" ? "rgba(245, 158, 11, 0.9)" : p.status === "accepted" ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)",
                        color: "#fff",
                        fontSize: "0.8rem",
                        fontWeight: "700"
                      }}>
                        {p.status ? p.status.toUpperCase() : "UNKNOWN"}
                      </div>
                    </div>

                    <div style={{ padding: 16 }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem" }}>{p.title || "Untitled Property"}</h3>
                      <p style={{ margin: "0 0 8px 0", color: "#cbd5f5", fontSize: "0.9rem" }}>
                        {p.address || "No address"}, {p.city || "No city"}
                      </p>
                      <p style={{ margin: "0 0 12px 0", color: "#e5e7eb", fontWeight: "600" }}>
                        ₹ {p.price ? p.price.toLocaleString() : "N/A"}
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(p.id, "accepted"); }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "none",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#fff",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(p.id, "rejected"); }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "none",
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            color: "#fff",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "1px solid rgba(148, 163, 184, 0.6)",
                            background: "transparent",
                            color: "#e5e7eb",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showModalLocal && selectedRental && (
        <PropertyModal
          property={selectedRental}
          onClose={() => setShowModalLocal(false)}
        />
      )}
    </div>
  );
}


export function FeedbackTab({ feedback, fetchFeedback, deleteFeedback, loading }) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const itemsPerPage = 5;
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const filteredFeedback = feedback.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const name = (item.name || "").toLowerCase();
    const message = (item.message || "").toLowerCase();
    const email = (item.email || "").toLowerCase();
    return (
      name.includes(query) ||
      message.includes(query) ||
      email.includes(query)
    );
  });

  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const displayedFeedback = filteredFeedback.slice(startIndex, startIndex + itemsPerPage);
  
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div style={{
      background: "#000000",
      borderRadius: "16px",
      padding: "30px",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
      minHeight: "400px"
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: "24px" }}>
        <button onClick={fetchFeedback} style={{
          padding: "14px 28px",
          cursor: "pointer",
          background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          fontSize: "1.1rem",
          fontWeight: "700",
          boxShadow: "0 8px 20px rgba(168, 85, 247, 0.5)",
          transition: "all 0.3s",
          letterSpacing: "0.5px"
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-3px) scale(1.05)";
          e.target.style.boxShadow = "0 12px 30px rgba(236, 72, 153, 0.7)";
          e.target.style.background = "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0) scale(1)";
          e.target.style.boxShadow = "0 8px 20px rgba(168, 85, 247, 0.5)";
          e.target.style.background = "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)";
        }}>
          {loading ? "⏳ Loading..." : "💬 Load Feedback"}
        </button>

        <span style={{ fontSize: "0.9rem", color: "#e5e7eb" }}>
          Total: {feedback.length} feedbacks
        </span>

        <div style={{ position: "relative", marginLeft: "auto" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              fontSize: "0.9rem",
            }}
          >
            🔍
          </span>
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Search feedback..."
            style={{
              padding: "8px 12px 8px 32px",
              borderRadius: 999,
              border: "1px solid #4b5563",
              background: "#020617",
              fontSize: "0.9rem",
              color: "#e5e7eb",
              minWidth: 220,
            }}
          />
        </div>
      </div>

      {feedback.length === 0 ? (
        <div style={{
          background: "rgba(55, 65, 81, 0.6)",
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(107, 114, 128, 0.3)"
        }}>
          <p style={{ 
            marginTop: 0, 
            fontSize: "1.1rem", 
            color: "#d1d5db",
            fontWeight: "500"
          }}>No feedback found.</p>
        </div>
      ) : (
        <>
          <div style={{ 
            overflowX: "auto", 
            marginTop: 12, 
            marginBottom: 20,
            borderRadius: "12px",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
            background: "rgba(31, 41, 55, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(107, 114, 128, 0.3)"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "transparent", color: "#e5e7eb" }}>
              <thead>
                <tr style={{ background: "rgba(55, 65, 81, 0.4)", borderBottom: "2px solid #a855f7" }}>
                  <th style={{ border: "1px solid #4b5563", padding: 12, color: "#a855f7", fontWeight: "700", textAlign: "left" }}>Date</th>
                  <th style={{ border: "1px solid #4b5563", padding: 12, color: "#a855f7", fontWeight: "700", textAlign: "left" }}>Name</th>
                  <th style={{ border: "1px solid #4b5563", padding: 12, color: "#a855f7", fontWeight: "700", textAlign: "left" }}>Rating</th>
                  <th style={{ border: "1px solid #4b5563", padding: 12, color: "#a855f7", fontWeight: "700", textAlign: "left" }}>Message</th>
                  <th style={{ border: "1px solid #4b5563", padding: 12, color: "#a855f7", fontWeight: "700", textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedFeedback.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? "rgba(55, 65, 81, 0.2)" : "rgba(31, 41, 55, 0.3)", borderBottom: "1px solid #4b5563" }}>
                    <td style={{ border: "1px solid #4b5563", padding: 12, color: "#e5e7eb" }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ border: "1px solid #4b5563", padding: 12, color: "#e5e7eb" }}>{item.name}</td>
                    <td style={{ border: "1px solid #4b5563", padding: 12 }}>
                      <span style={{ color: "#ec4899", fontWeight: "bold", fontSize: "1.1rem" }}>
                        {"★".repeat(item.rating)}
                        <span style={{ color: "#6b7280" }}>{"★".repeat(5 - item.rating)}</span>
                      </span>
                    </td>
                    <td style={{ border: "1px solid #4b5563", padding: 12, maxWidth: "400px", color: "#d1d5db" }}>
                      {item.message}
                    </td>
                    <td style={{ border: "1px solid #4b5563", padding: 12 }}>
                      <button
                        onClick={() => deleteFeedback(item.id)}
                        style={{
                          padding: "8px 16px",
                          background: "linear-gradient(135deg, #ef4444, #dc2626)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)",
                          transition: "all 0.3s"
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#9ca3af" }}>
            <div>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, feedback.length)} of {feedback.length} feedbacks
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid #4b5563",
                  background: "#111827",
                  color: "#e5e7eb",
                  cursor: currentPage === 0 ? "not-allowed" : "pointer"
                }}
              >
                Previous
              </button>
              <button
                onClick={goToNextPage}
                disabled={currentPage >= totalPages - 1}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid #4b5563",
                  background: "#111827",
                  color: "#e5e7eb",
                  cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer"
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function PropertyModal({ property, onClose }) {
  if (!property) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 8, maxWidth: "600px", width: "90%", maxHeight: "80vh", overflow: "auto", color: "#000" }}>
        <h2>{property.title}</h2>
        <img src={property.image_urls?.[0] || property.photos?.[0] || "https://via.placeholder.com/300"} alt={property.title} style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: 8 }} />
        <p><strong>Type:</strong> {property.type}</p>
        <p><strong>Price:</strong> {property.price}</p>
        <p><strong>Description:</strong> {property.description}</p>
        <p><strong>Address:</strong> {property.address}, {property.city}</p>
        {property.status === "rejected" && property.rejection_reason && (
          <p style={{ color: "#dc2626" }}><strong>Rejection Reason:</strong> {property.rejection_reason}</p>
        )}
        <button onClick={onClose} style={{ marginTop: 20, padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Close</button>
      </div>
    </div>
  );
}
