import React, { useState } from "react";
import { supabase } from "../supabase.js";


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [leases, setLeases] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);


  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  const updateStatus = async (propertyId, newStatus) => {
    try {
      console.log("Updating status for property:", propertyId, "to:", newStatus);
      
      // First, get the property to find the user_id
      const { data: propertyData, error: fetchError } = await supabase
        .from("properties")
        .select("user_id, created_by, title, contact_email, contact_name")
        .eq("id", propertyId)
        .single();

      if (fetchError) {
        console.error("Error fetching property:", fetchError);
      }

      let property = propertyData;

      // Update status
      const { data: updatedData, error } = await supabase
        .from("properties")
        .update({ status: newStatus })
        .eq("id", propertyId)
        .select();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      if (!property && updatedData && updatedData.length > 0) {
        property = updatedData[0];
      }

      console.log("Status updated successfully:", updatedData);

      // Create notification for user when status is accepted
      if (newStatus === "accepted" && property) {
        // Try to find user by email if user_id is not available
        let userId = property.user_id || property.created_by;
        
        if (!userId && property.contact_email) {
          try {
            // Try to find user by email
            const { data: userData } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", property.contact_email)
              .single();
            
            if (userData) {
              userId = userData.id;
            } else {
              // Try auth users table
              const { data: authUsers } = await supabase.auth.admin.listUsers();
              const foundUser = authUsers?.users?.find(u => u.email === property.contact_email);
              if (foundUser) {
                userId = foundUser.id;
              }
            }
          } catch (err) {
            console.warn("Could not find user by email:", err);
          }
        }
        
        if (userId) {
          try {
            // Try to create notification in notifications table
            const { error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: userId,
                type: "property_approved",
                title: "Property Approved!",
                message: `Your property "${property.title || 'Property'}" has been approved. Click "Post Now" to upload documents and complete payment.`,
                read: false,
                created_at: new Date().toISOString()
              });

            if (notifError) {
              console.warn("Could not create notification (table may not exist):", notifError);
              // Try alternative notification method - create a message
              try {
                await supabase
                  .from("messages")
                  .insert({
                    user_id: userId,
                    subject: "Property Approved",
                    message: `Your property "${property.title || 'Property'}" has been approved. You can now post it by clicking "Post Now" in My Listings.`,
                    created_at: new Date().toISOString()
                  });
              } catch (msgErr) {
                console.warn("Could not create message either:", msgErr);
              }
            } else {
              console.log("Notification created for user:", userId);
            }
          } catch (notifErr) {
            console.warn("Error creating notification:", notifErr);
          }
        } else {
          console.warn("Could not find user_id for property notification");
        }
      }

      // Immediately update local state for instant UI feedback
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status: newStatus } : p));
      setSellers(prev => prev.map(p => p.id === propertyId ? { ...p, status: newStatus } : p));
      setLeases(prev => prev.map(p => p.id === propertyId ? { ...p, status: newStatus } : p));
      setRentals(prev => prev.map(p => p.id === propertyId ? { ...p, status: newStatus } : p));

      // Then refresh from database to ensure consistency
      await Promise.all([
        fetchProperties(),
        fetchSellers(),
        fetchLeases(),
        fetchRentals()
      ]);
      
      console.log("All data refreshed");
      alert(`Property status updated to ${newStatus} successfully!`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + (error.message || "Unknown error"));
    }
  };
  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*");
    setUsers(data || []);
    setLoading(false);
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("property_listing_type", "Sell")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSellers(data || []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const fetchLeases = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("property_listing_type", "Lease")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeases(data || []);
    } catch (error) {
      console.error("Error fetching leases:", error);
    }
  };

  const fetchRentals = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("property_listing_type", "Rent")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRentals(data || []);
    } catch (error) {
      console.error("Error fetching rentals:", error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    // Try appointments table first, then bookings
    let data = null;
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });

    if (appointmentsError) {
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      data = bookingsData || [];
    } else {
      data = appointmentsData || [];
    }
    setAppointments(data);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f5" }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />

      <div style={{ marginLeft: 250, padding: 40, flex: 1 }}>
        <Header activeTab={activeTab} />

        {activeTab === "overview" && <Overview />}
        {activeTab === "users" && <UsersTab users={users} fetchUsers={fetchUsers} loading={loading} />}
        {activeTab === "properties" && (
          <PropertiesTab
            properties={properties}
            fetchProperties={fetchProperties}
            setSelectedProperty={setSelectedProperty}
            setShowModal={setShowModal}
          />
        )}
        {activeTab === "sellers" && <ListingTab title="Sellers" data={sellers} fetchData={fetchSellers} updateStatus={updateStatus} loading={loading} setEditingProperty={setEditingProperty} setShowEditModal={setShowEditModal} />}
        {activeTab === "leases" && <ListingTab title="Leases" data={leases} fetchData={fetchLeases} updateStatus={updateStatus} loading={loading} setEditingProperty={setEditingProperty} setShowEditModal={setShowEditModal} />}
        {activeTab === "rentals" && <ListingTab title="Rentals" data={rentals} fetchData={fetchRentals} updateStatus={updateStatus} loading={loading} setEditingProperty={setEditingProperty} setShowEditModal={setShowEditModal} />}
        {activeTab === "appointments" && <AppointmentsTab appointments={appointments} fetchAppointments={fetchAppointments} loading={loading} />}

        {showEditModal && editingProperty && (
          <EditPropertyModal 
            property={editingProperty} 
            onClose={() => {
              setShowEditModal(false);
              setEditingProperty(null);
            }}
            onSave={async () => {
              await Promise.all([fetchSellers(), fetchLeases(), fetchRentals(), fetchProperties()]);
              setShowEditModal(false);
              setEditingProperty(null);
            }}
          />
        )}

        {showModal && selectedProperty && (
          <PropertyModal property={selectedProperty} onClose={() => setShowModal(false)} />
        )}
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function Sidebar({ activeTab, setActiveTab, handleLogout }) {
  const items = [
    ["overview", "📊 Overview"],
    ["users", "👥 Users"],
    ["properties", "🏠 Properties"],
    ["sellers", "🛍️ Sellers"],
    ["leases", "📋 Leases"],
    ["rentals", "🔑 Rentals"],
    ["appointments", "📅 Appointments"],
  ];

  return (
    <div style={{ width: 250, background: "#1e293b", color: "#fff", padding: 50, position: "fixed", height: "100vh" }}>
      <h2 style={{ marginBottom: 30, color: "#fff" }}>Elite Nest Admin</h2>
      {items.map(([id, label]) => (
        <div
          key={id}
          onClick={() => setActiveTab(id)}
          style={{
            padding: 12,
            borderRadius: 6,
            marginBottom: 8,
            cursor: "pointer",
            background: activeTab === id ? "#ff6b35" : "transparent",
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function Header({ activeTab }) {
  return (
    <div style={{ background: "#fff", padding: 50, borderRadius: 8, marginBottom: 30, display: "flex", justifyContent: "space-between" }}>
      <h1 style={{ margin: 0, textTransform: "capitalize", color: "#000" }}>{activeTab}</h1>
    </div>
  );
}

function Overview() {
  const [overviewData, setOverviewData] = React.useState({
    totalUsers: 0,
    totalProperties: 0,
    totalAppointments: 0,
    pendingProperties: 0
  });
  const [loading, setLoading] = React.useState(false);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [users, properties] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("properties").select("id", { count: "exact" })
      ]);

      // Try appointments table first, then fallback to bookings
      let appointments = await supabase.from("appointments").select("id", { count: "exact" });
      if (!appointments.data && appointments.error) {
        appointments = await supabase.from("bookings").select("id", { count: "exact" });
      }

      const pendingProps = await supabase
        .from("properties")
        .select("id", { count: "exact" })
        .eq("status", "pending");

      setOverviewData({
        totalUsers: users.count || 0,
        totalProperties: properties.count || 0,
        totalAppointments: appointments.count || 0,
        pendingProperties: pendingProps.count || 0
      });
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOverviewData();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      padding: 20,
      flex: 1,
      minWidth: "200px",
      textAlign: "center",
      transition: "all 0.3s",
      cursor: "pointer",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
      e.currentTarget.style.transform = "translateY(-4px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
      e.currentTarget.style.transform = "translateY(0)";
    }}>
      <div style={{ fontSize: "32px", marginBottom: 10 }}>{icon}</div>
      <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: 8 }}>{title}</div>
      <div style={{ color: color, fontSize: "28px", fontWeight: "bold" }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{
        background: "#fff",
        padding: 30,
        borderRadius: 8,
        color: "#000",
        marginBottom: 30
      }}>
        <h2 style={{ color: "#000", marginTop: 0 }}>Welcome to Elite Nest Admin Dashboard</h2>
        <p style={{ color: "#6b7280" }}>Manage properties, users, and appointments from one central location.</p>
        <button
          onClick={fetchOverviewData}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#9ca3af" : "#1e40af",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "500"
          }}
        >
          {loading ? "Refreshing..." : "Refresh Stats"}
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 20,
        marginBottom: 30
      }}>
        <StatCard title="Total Users" value={overviewData.totalUsers} icon="👥" color="#1e40af" />
        <StatCard title="Total Properties" value={overviewData.totalProperties} icon="🏠" color="#059669" />
        <StatCard title="Pending Properties" value={overviewData.pendingProperties} icon="⏳" color="#f59e0b" />
        <StatCard title="Total Appointments" value={overviewData.totalAppointments} icon="📅" color="#8b5cf6" />
      </div>
    </div>
  );
}

function UsersTab({ users, fetchUsers, loading }) {
  return (
    <div>
      <button onClick={fetchUsers}>{loading ? "Loading..." : "Load Users"}</button>
      <ul>
        {users.map((u, i) => (
          <li key={i}>{u.email}</li>
        ))}
      </ul>
    </div>
  );
}

function PropertiesTab({ properties, fetchProperties, setSelectedProperty, setShowModal }) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const propertiesPerPage = 3;
  
  const totalPages = Math.ceil(properties.length / propertiesPerPage);
  const startIndex = currentPage * propertiesPerPage;
  const displayedProperties = properties.slice(startIndex, startIndex + propertiesPerPage);
  
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div>
      <button onClick={fetchProperties}>Load Properties</button>
      <div style={{ marginTop: 20 }}>
        {properties.length === 0 ? (
          <p style={{ color: "#000" }}>No properties loaded.</p>
        ) : (
          <>
            <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              {displayedProperties.map((p) => (
                <div
                  key={p.id}
                  onClick={() => { setSelectedProperty(p); setShowModal(true); }}
                  style={{
                    padding: 16,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    cursor: "pointer",
                    color: "#000",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                >
                  <h3 style={{ margin: "0 0 8px 0", color: "#000" }}>{p.title}</h3>
                  <p style={{ margin: 0, color: "#000", fontSize: "0.9rem" }}>Type: {p.property_listing_type}</p>
                </div>
              ))}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginTop: 20
            }}>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                style={{
                  padding: "10px 16px",
                  backgroundColor: currentPage === 0 ? "#d1d5db" : "#1e40af",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: currentPage === 0 ? "not-allowed" : "pointer",
                  fontSize: "1.2rem",
                  fontWeight: "bold"
                }}
              >
                ← Previous
              </button>
              <span style={{ color: "#000", fontSize: "1rem", fontWeight: "500" }}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                style={{
                  padding: "10px 16px",
                  backgroundColor: currentPage === totalPages - 1 ? "#d1d5db" : "#1e40af",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                  fontSize: "1.2rem",
                  fontWeight: "bold"
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ListingTab({ title, data, fetchData, updateStatus, loading, setEditingProperty, setShowEditModal }) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const itemsPerPage = 3;
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const displayedData = data.slice(startIndex, startIndex + itemsPerPage);
  
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleStatusChange = async (propertyId, newStatus) => {
    if (!updateStatus) return;
    
    try {
      // Update status in database
      await updateStatus(propertyId, newStatus);
      // Wait a bit for database to sync, then refresh
      setTimeout(async () => {
        if (fetchData) {
          await fetchData();
        }
      }, 300);
    } catch (error) {
      console.error("Error changing status:", error);
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setShowEditModal(true);
  };

  return (
    <div>
      <button onClick={fetchData} style={{ padding: "10px 20px", marginBottom: "20px", cursor: "pointer" }}>
        {loading ? "Loading..." : `Load ${title}`}
      </button>

      {data.length === 0 ? (
        <p style={{ marginTop: 12 }}>No {title} loaded.</p>
      ) : (
        <>
          <div style={{ overflowX: "auto", marginTop: 12, marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", color: "#000" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Title</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Type</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Area</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Bedrooms</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Bathrooms</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Parking</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Furnished</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Balcony</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Nearby</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Description</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Address</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>City</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Price</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Listing Type</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Deposit</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Min Duration</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Contact Name</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Contact Phone</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Contact Email</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Status</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Images</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedData.map((p) => (
                  <tr key={p.id}>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.title}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.type}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.area}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.bedrooms ?? "-"}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.bathrooms ?? "-"}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.parking || "-"}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.furnished_status || "-"}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.balcony || "-"}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8, maxWidth: 200 }}>{p.nearby_places || "-"}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8, maxWidth: 300 }}>{p.description}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.address}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.city}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.price}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.property_listing_type}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.deposit ?? "-"}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.min_duration ?? "-"}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.contact_name}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.contact_phone}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{p.contact_email}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor: p.status === "accepted" ? "#d1fae5" : p.status === "rejected" ? "#fee2e2" : "#fef3c7",
                        color: p.status === "accepted" ? "#065f46" : p.status === "rejected" ? "#991b1b" : "#92400e",
                        fontWeight: "500"
                      }}>
                        {p.status || "pending"}
                      </span>
                    </td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                      {Array.isArray(p.image_urls) && p.image_urls.length > 0 ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {p.image_urls.map((src, i) => (
                            <img key={i} src={src} alt={`img-${i}`} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} />
                          ))}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                      <div style={{ display: "flex", gap: "5px", flexDirection: "column" }}>
                        <button
                          onClick={() => handleEdit(p)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#1e40af",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.85rem"
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleStatusChange(p.id, "accepted")}
                          disabled={p.status === "accepted"}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: p.status === "accepted" ? "#9ca3af" : "#059669",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: p.status === "accepted" ? "not-allowed" : "pointer",
                            fontSize: "0.85rem"
                          }}
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleStatusChange(p.id, "rejected")}
                          disabled={p.status === "rejected"}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: p.status === "rejected" ? "#9ca3af" : "#dc2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: p.status === "rejected" ? "not-allowed" : "pointer",
                            fontSize: "0.85rem"
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            marginTop: 20
          }}>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              style={{
                padding: "10px 16px",
                backgroundColor: currentPage === 0 ? "#d1d5db" : "#1e40af",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}
            >
              ← Previous
            </button>
            <span style={{ color: "#000", fontSize: "1rem", fontWeight: "500" }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              style={{
                padding: "10px 16px",
                backgroundColor: currentPage === totalPages - 1 ? "#d1d5db" : "#1e40af",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AppointmentsTab({ appointments, fetchAppointments, loading }) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const itemsPerPage = 3;
  
  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const displayedAppointments = appointments.slice(startIndex, startIndex + itemsPerPage);
  
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      // Try appointments table first
      let error = null;
      const { error: appointmentsError } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (appointmentsError) {
        // Try bookings table
        const { error: bookingsError } = await supabase
          .from("bookings")
          .update({ status: newStatus })
          .eq("id", appointmentId);

        if (bookingsError) throw bookingsError;
      }

      alert(`Appointment ${newStatus} successfully!`);
      fetchAppointments();
    } catch (error) {
      console.error("Error updating appointment status:", error);
      alert("Error updating appointment status: " + error.message);
    }
  };

  return (
    <div>
      <button onClick={fetchAppointments} style={{ padding: "10px 20px", marginBottom: "20px", cursor: "pointer" }}>
        {loading ? "Loading..." : "Load Appointments"}
      </button>

      {appointments.length === 0 ? (
        <p style={{ marginTop: 12 }}>No appointments found.</p>
      ) : (
        <>
          <div style={{ overflowX: "auto", marginTop: 12, marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", color: "#000" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Property Title</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>User Email</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Mobile Number</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Date</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Time</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Status</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Booked On</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedAppointments.map((apt) => {
                  const appointmentDate = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
                  return (
                    <tr key={apt.id}>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{apt.property_title || "N/A"}</td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{apt.user_email || "N/A"}</td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{apt.mobile_number || "N/A"}</td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                        {appointmentDate.toLocaleDateString()}
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                        {appointmentDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor: apt.status === "confirmed" || apt.status === "accepted" ? "#d1fae5" : 
                                          apt.status === "cancelled" || apt.status === "rejected" ? "#fee2e2" : "#fef3c7",
                          color: apt.status === "confirmed" || apt.status === "accepted" ? "#065f46" : 
                                 apt.status === "cancelled" || apt.status === "rejected" ? "#991b1b" : "#92400e",
                          fontWeight: "500"
                        }}>
                          {apt.status || "pending"}
                        </span>
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                        {new Date(apt.created_at).toLocaleString()}
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                        <div style={{ display: "flex", gap: "5px", flexDirection: "column" }}>
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, "confirmed")}
                            disabled={apt.status === "confirmed" || apt.status === "accepted"}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: (apt.status === "confirmed" || apt.status === "accepted") ? "#9ca3af" : "#059669",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              cursor: (apt.status === "confirmed" || apt.status === "accepted") ? "not-allowed" : "pointer",
                              fontSize: "0.85rem"
                            }}
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, "rejected")}
                            disabled={apt.status === "rejected" || apt.status === "cancelled"}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: (apt.status === "rejected" || apt.status === "cancelled") ? "#9ca3af" : "#dc2626",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              cursor: (apt.status === "rejected" || apt.status === "cancelled") ? "not-allowed" : "pointer",
                              fontSize: "0.85rem"
                            }}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            marginTop: 20
          }}>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              style={{
                padding: "10px 16px",
                backgroundColor: currentPage === 0 ? "#d1d5db" : "#1e40af",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}
            >
              ← Previous
            </button>
            <span style={{ color: "#000", fontSize: "1rem", fontWeight: "500" }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              style={{
                padding: "10px 16px",
                backgroundColor: currentPage === totalPages - 1 ? "#d1d5db" : "#1e40af",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EditPropertyModal({ property, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: property.title || "",
    type: property.type || "",
    area: property.area || "",
    bedrooms: property.bedrooms || "",
    bathrooms: property.bathrooms || "",
    address: property.address || "",
    city: property.city || "",
    price: property.price || "",
    description: property.description || "",
    contact_name: property.contact_name || "",
    contact_phone: property.contact_phone || "",
    contact_email: property.contact_email || "",
    deposit: property.deposit || "",
    min_duration: property.min_duration || "",
    parking: property.parking || "",
    furnished_status: property.furnished_status || "",
    balcony: property.balcony || "",
    nearby_places: property.nearby_places || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "price") {
      const lt = property.property_listing_type;
      if ((lt === "Rent" || lt === "Lease") && value.length > 8) {
        alert("Maximum 8 digits allowed");
        return;
      }
      if (lt === "Sell" && value.length > 9) {
        alert("Maximum 9 digits allowed");
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("properties")
        .update({
          title: formData.title,
          type: formData.type,
          area: formData.area,
          bedrooms: formData.bedrooms || null,
          bathrooms: formData.bathrooms || null,
          address: formData.address,
          city: formData.city,
          price: Number(formData.price),
          description: formData.description,
          contact_name: formData.contact_name,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
          deposit: formData.deposit || null,
          min_duration: formData.min_duration || null,
          parking: formData.parking,
          furnished_status: formData.furnished_status,
          balcony: formData.balcony,
          nearby_places: formData.nearby_places,
        })
        .eq("id", property.id);

      if (error) throw error;

      alert("Property updated successfully!");
      onSave();
    } catch (error) {
      console.error("Error updating property:", error);
      alert("Error updating property: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", padding: 30, borderRadius: 12, maxWidth: "600px", width: "90%", maxHeight: "90vh", overflow: "auto" }}>
        <h2 style={{ marginBottom: 20 }}>Edit Property</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Type</label>
              <input type="text" name="type" value={formData.type} onChange={handleChange} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Area</label>
                <input type="text" name="area" value={formData.area} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Price</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Bedrooms</label>
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Bathrooms</label>
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Parking</label>
                <input type="text" name="parking" value={formData.parking} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Furnished</label>
                <input type="text" name="furnished_status" value={formData.furnished_status} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Balcony</label>
                <input type="text" name="balcony" value={formData.balcony} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Nearby Places</label>
              <textarea name="nearby_places" value={formData.nearby_places} onChange={handleChange} rows="2" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Contact Name</label>
                <input type="text" name="contact_name" value={formData.contact_name} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Contact Phone</label>
                <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Contact Email</label>
              <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Deposit</label>
                <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Min Duration</label>
                <input type="text" name="min_duration" value={formData.min_duration} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", backgroundColor: "#6b7280", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: "10px 20px", backgroundColor: saving ? "#9ca3af" : "#1e40af", color: "#fff", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PropertyModal({ property, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 8, maxWidth: "500px", width: "100%", color: "#000" }}>
        <h2 style={{ color: "#000" }}>{property.title}</h2>
        <p style={{ color: "#000" }}><strong>Type:</strong> {property.type}</p>
        <p style={{ color: "#000" }}><strong>Category:</strong> {property.property_listing_type}</p>
        <p style={{ color: "#000" }}><strong>Price:</strong> {property.price}</p>
        <p style={{ color: "#000" }}><strong>Location:</strong> {property.address}, {property.city}</p>
        <p style={{ color: "#000" }}><strong>Bedrooms:</strong> {property.bedrooms}</p>
        <p style={{ color: "#000" }}><strong>Bathrooms:</strong> {property.bathrooms}</p>
        <p style={{ color: "#000" }}><strong>Parking:</strong> {property.parking || "N/A"}</p>
        <p style={{ color: "#000" }}><strong>Furnished:</strong> {property.furnished_status || "N/A"}</p>
        <p style={{ color: "#000" }}><strong>Balcony:</strong> {property.balcony || "N/A"}</p>
        <p style={{ color: "#000" }}><strong>Nearby:</strong> {property.nearby_places || "N/A"}</p>
        <button onClick={onClose} style={{ marginTop: "20px", padding: "8px 16px", cursor: "pointer" }}>Close</button>
      </div>
    </div>
    );
}