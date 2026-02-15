import React, { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { getArray } from "../utils/properties.js";
import EditPropertyModal from "../components/EditPropertyModal";
import emailjs from "@emailjs/browser";

// EmailJS Configuration
const SERVICE_ID = "service_lgq3cwf";
const TEMPLATE_ID = "template_md0v59s";
const PUBLIC_KEY = "DM42XVFihQTMWzqW3";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [leases, setLeases] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);


  useEffect(() => {
    console.log("AdminDashboard activeTab changed to:", activeTab);
    if (activeTab === "users") fetchUsers();
    if (activeTab === "properties") fetchProperties();
    if (activeTab === "sellers") fetchSellers();
    if (activeTab === "leases") fetchLeases();
    if (activeTab === "rentals") fetchRentals();
    if (activeTab === "appointments") {
      console.log("Triggering fetchAppointments for appointments tab");
      fetchAppointments();
    }
    if (activeTab === "feedback") fetchFeedback();
  }, [activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  const updateStatus = async (propertyId, newStatus) => {
    try {
      console.log("Updating status for property:", propertyId, "to:", newStatus);
      
      let rejectionReason = null;
      if (newStatus === "rejected") {
        rejectionReason = window.prompt("Please provide a reason for rejecting this property listing:");
        if (rejectionReason === null) return; // Admin clicked Cancel
        if (!rejectionReason.trim()) {
          alert("A rejection reason is required.");
          return;
        }
      }

      // First, get the property to find the user_id
      const { data: propertyData, error: fetchError } = await supabase
        .from("properties")
        .select("user_id, created_by, title, contact_email, contact_name, approval_count")
        .eq("id", propertyId)
        .single();

      if (fetchError) {
        console.error("Error fetching property:", fetchError);
      }

      let property = propertyData;

      // Update status
      const updateData = { 
        status: newStatus,
        rejection_reason: rejectionReason 
      };
      if (newStatus === "accepted") {
        // Increment approval_count (requires 'approval_count' column in DB)
        // Ensure we handle nulls and strings correctly.
        let currentCount = 0;
        
        // Re-fetch strictly to be sure we have the latest count
         const { data: freshProp, error: freshError } = await supabase
             .from("properties")
             .select("approval_count")
             .eq("id", propertyId)
             .single();
             
         if (freshError) {
             console.error("Network Error fetching fresh count:", freshError);
             alert("Network Error: Could not fetch latest approval count. Please check your connection.");
             return; // Stop execution to prevent writing bad data
         }

         if (freshProp) {
             currentCount = Number(freshProp.approval_count);
             if (isNaN(currentCount)) currentCount = 0;
         }

        updateData.approval_count = currentCount + 1;
        console.log(`[Admin] Approving property ${propertyId}. Old Count: ${currentCount}, New Count: ${updateData.approval_count}`);
      }

      const { data: updatedData, error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", propertyId)
        .select();

      // Fallback: If updateData included approval_count but it didn't stick (e.g. column missing in update payload for some reason), try explicit update
      if (updateData.approval_count !== undefined && !error) {
           // Double check persistence
           const { data: verifyData } = await supabase.from("properties").select("approval_count").eq("id", propertyId).single();
           if (verifyData && verifyData.approval_count !== updateData.approval_count) {
               console.warn("Update didn't persist approval_count. Forcing separate update...");
               await supabase.from("properties").update({ approval_count: updateData.approval_count }).eq("id", propertyId);
           }
      }

      // DEBUG: Verify update
      if (updatedData && updatedData[0]) {
          console.log("Admin update verified:", updatedData[0]);
      } else {
          console.warn("Admin update returned no data!", error);
      }

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      if (!property && updatedData && updatedData.length > 0) {
        property = updatedData[0];
      }

      console.log("Status updated successfully:", updatedData);

      // Create notification for user when status is updated
      if ((newStatus === "accepted" || newStatus === "rejected") && property) {
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
              // SELF-HEALING: Update the property with the found user_id so we don't have to look it up next time
              await supabase.from("properties").update({ user_id: userId }).eq("id", propertyId);
            } else {
              console.warn("User not found in profiles table by email:", property.contact_email);
            }
          } catch (err) {
            console.warn("Could not find user by email:", err);
          }
        }

        // FALLBACK: If still no userId, ask the admin manually
        if (!userId) {
           const manualEmail = window.prompt(`Could not automatically find the user for this property.\n\nProperty Email: ${property.contact_email || 'N/A'}\n\nPlease enter the correct User Email to send the notification:`, property.contact_email || "");
           
           if (manualEmail) {
               try {
                   const { data: manualUserData } = await supabase
                      .from("profiles")
                      .select("id")
                      .eq("email", manualEmail.trim())
                      .single();
                      
                   if (manualUserData) {
                       userId = manualUserData.id;
                       // SELF-HEALING: Update the property with the found user_id
                       await supabase.from("properties").update({ user_id: userId }).eq("id", propertyId);
                       alert(`User found! Notification will be sent to ${manualEmail}.`);
                   } else {
                       alert(`Error: User with email "${manualEmail}" was not found in the system. Please ensure they have signed up.`);
                   }
               } catch (err) {
                   console.error("Manual lookup failed:", err);
               }
           }
        }
        
        if (userId) {
          try {
            // Determine notification content based on status
            const isAccepted = newStatus === "accepted";
            const notifType = isAccepted ? "property_approved" : "property_rejected";
            const notifTitle = isAccepted ? "Property Approved!" : "Property Rejected";
            const notifMessage = isAccepted 
              ? `Your property "${property.title || 'Property'}" has been accepted. Click "Post Now" to publish your listing.`
              : `Your property "${property.title || 'Property'}" has been rejected. Reason: ${rejectionReason}`;

            // Try to create notification in notifications table
            const { error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: userId,
                type: notifType,
                title: notifTitle,
                message: notifMessage,
                property_id: propertyId,
                read: false,
                created_at: new Date().toISOString()
              });
            
            if (notifError) {
              console.error("NOTIFICATION INSERT ERROR:", notifError);
              alert("Warning: Status updated, but failed to send notification: " + notifError.message);
            } else {
              console.log(`Notification (${newStatus}) created for user:`, userId);
            }

            // ALWAYS create a message as well
            try {
              const { error: msgError } = await supabase
                .from("messages")
                .insert({
                  user_id: userId,
                  subject: isAccepted ? "Property Accepted" : "Property Rejected",
                  message: isAccepted 
                    ? `Your property "${property.title || 'Property'}" has been accepted. Please go to "My Listings" and click "Post Now" to publish it.`
                    : `Your property "${property.title || 'Property'}" has been rejected. Reason: ${rejectionReason}`,
                  created_at: new Date().toISOString()
                });
                
              if (msgError) {
                 console.error("MESSAGE INSERT ERROR:", msgError);
                 // Don't alert twice, just log
              } else {
                 console.log(`Message (${newStatus}) created for user:`, userId);
              }
            } catch (msgErr) {
              console.warn("Could not create message:", msgErr);
            }

          } catch (notifErr) {
            console.warn("Error creating notification/message:", notifErr);
            alert("Error sending notification: " + notifErr.message);
          }
        } else {
          console.warn("Could not find user_id for property notification. Email:", property.contact_email);
          alert("Warning: Property status updated, but could not find the user to notify. (Missing user_id and email lookup failed)");
        }

        // --- SEPARATE EMAIL LOGIC (Independent of userId) ---
        if (property.contact_email || property.email) {
          try {
            const userEmail = property.contact_email || property.email;
            const userName = property.contact_name || "Seller";
            const propertyTitle = property.title || "Property";
            
            const templateParams = {
                to_name: userName,
                to_email: userEmail,
                property_title: propertyTitle,
                status: newStatus === "rejected" ? "Listing Request Declined" : "Listing Request Approved",
                message: newStatus === "rejected" 
                  ? `We have reviewed your request to list "${propertyTitle}" and unfortunately, we cannot approve it at this time. \n\nReason for decision: ${rejectionReason}` 
                  : `Great news! Your request to list "${propertyTitle}" has been approved. You can now log in to your dashboard to post it live.`,
                date_label: "Property Listing",
                time_label: "Status Update",
                details_header: "Listing Details",
                view_link: "https://ndfxcuboxpxbbsrdvywv.supabase.co",
                logo_url: "https://raw.githubusercontent.com/RashmiShetty07/EliteNest/main/src/assets/logo.png" // Placeholder or direct URL if available
              };

            console.log(`Attempting to send property ${newStatus} email to: "${userEmail}" via EmailJS...`);
            
            if (SERVICE_ID && SERVICE_ID !== "service_xxxxxxx") {
              await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
              console.log("EmailJS Property Notification sent.");
              alert(`✅ ${newStatus === "rejected" ? "Rejection" : "Approval"} email sent to ${userEmail}`);
            }
          } catch (emailErr) {
            console.error("Error sending property email via EmailJS:", emailErr);
            alert("❌ Failed to send email: " + (emailErr.text || emailErr.message));
          }
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

  const [fetchError, setFetchError] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      console.log("Fetching ALL bookings for admin dashboard...");
      
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookingsError) {
        console.error("Bookings table error:", bookingsError.message);
        setFetchError(bookingsError.message);
        setAppointments([]);
        return;
      }

      const combinedRaw = bookingsData || [];

      console.log(`Raw bookings: ${combinedRaw.length}`);

      if (combinedRaw.length === 0) {
        setAppointments([]);
        return;
      }

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
        } else if (propsError) {
          console.error("Error fetching properties for bookings:", propsError.message);
        }
      }

      // Normalize bookings
      const unique = combinedRaw.reduce((acc, current) => {
        if (!current || !current.id) return acc;
        const currentId = String(current.id);
        
        if (!acc.find(item => String(item.id) === currentId)) {
          const propInfo = propertiesMap[current.property_id] || {};
          const propertyTitle = propInfo.title || current.property_title || "N/A";
          
          let propertyImage = "https://via.placeholder.com/60?text=No+Img";
          if (propInfo.image_urls && propInfo.image_urls.length > 0) {
            propertyImage = propInfo.image_urls[0];
          } else if (propInfo.photos && propInfo.photos.length > 0) {
            propertyImage = propInfo.photos[0];
          } else if (current.property_image) {
            propertyImage = current.property_image;
          }

          const normalized = {
            ...current,
            property_title: propertyTitle,
            property_image: propertyImage,
            user_email: current.user_email || current.email || "N/A",
            user_name: current.user_name || current.name || "N/A",
            mobile_number: current.mobile_number || current.user_phone || current.phone || "N/A",
          };
          acc.push(normalized);
        }
        return acc;
      }, []);

      console.log("Total normalized bookings:", unique.length);
      setAppointments(unique);
      
    } catch (err) {
      console.error("Critical exception in fetchAppointments:", err);
      setFetchError(`Exception: ${err.message}`);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    try {
      const { error } = await supabase.from('feedback').delete().eq('id', id);
      if (error) throw error;
      setFeedback(prev => prev.filter(item => item.id !== id));
      alert("Feedback deleted successfully");
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("Error deleting feedback");
    }
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
        {activeTab === "appointments" && <AppointmentsTab appointments={appointments} fetchAppointments={fetchAppointments} loading={loading} fetchError={fetchError} />}
        {activeTab === "feedback" && <FeedbackTab feedback={feedback} fetchFeedback={fetchFeedback} deleteFeedback={deleteFeedback} loading={loading} />}

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
    ["feedback", "💬 Feedback"],
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
      <div
          onClick={handleLogout}
          style={{
            padding: 12,
            borderRadius: 6,
            marginTop: 20,
            cursor: "pointer",
            background: "transparent",
            color: "#fff",
            border: "1px solid #ff6b35"
          }}
        >
          Logout
      </div>
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
      const [users, properties, pendingProps] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("properties").select("id", { count: "exact" }),
        supabase.from("properties").select("id", { count: "exact" }).eq("status", "pending")
      ]);

      const { count: bCount, error: bErr } = await supabase.from("bookings").select("id", { count: "exact", head: true });
      const appointmentsCount = bErr ? 0 : (bCount || 0);

      setOverviewData({
        totalUsers: users.count || 0,
        totalProperties: properties.count || 0,
        totalAppointments: appointmentsCount,
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
                  {p.status === "rejected" && p.rejection_reason && (
                    <p style={{ margin: "4px 0 0 0", color: "#dc2626", fontSize: "0.8rem" }}>
                      <strong>Reason:</strong> {p.rejection_reason}
                    </p>
                  )}
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
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Rejection Reason</th>
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
                    <td style={{ border: "1px solid #e5e7eb", padding: 8, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.rejection_reason}>
                      {p.rejection_reason || "-"}
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

function AppointmentsTab({ appointments, fetchAppointments, loading, fetchError }) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [filter, setFilter] = React.useState("all"); // "all" or "accepted"
  const itemsPerPage = 3;
  
  const filteredAppointments = filter === "accepted" 
    ? appointments.filter(apt => apt.status === "confirmed" || apt.status === "accepted")
    : appointments;

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const displayedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);
  
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const updateAppointmentStatus = async (appointmentId, newStatus, selectedDate = null) => {
    try {
      let rejectionReason = null;
      if (newStatus === "rejected") {
        rejectionReason = window.prompt("Please provide a reason for rejecting this appointment:");
        if (rejectionReason === null) return; // Admin clicked Cancel
        if (!rejectionReason.trim()) {
          alert("A rejection reason is required.");
          return;
        }
      }

      const updateData = { 
        status: newStatus,
        rejection_reason: rejectionReason 
      };
      if (selectedDate) {
        updateData.appointment_date = selectedDate.date;
        updateData.appointment_time = selectedDate.time || '00:00:00';
      }

      // Only use bookings table
      const { error: bookingsError } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", appointmentId);

      if (bookingsError) throw bookingsError;

      // Create notification for user when appointment status changes
      if (["confirmed", "accepted", "rejected", "cancelled"].includes(newStatus)) {
        try {
          // Fetch appointment details to get user_id and property info
          const { data: aptData, error: fetchAptError } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", appointmentId)
            .single();
            
          if (fetchAptError) {
             console.error("Error fetching booking details for notification:", fetchAptError.message);
          }

          if (aptData) {
             let userId = aptData.user_id;

             // If no user_id, try to find user by email (common for some bookings)
             if (!userId && aptData.user_email) {
                try {
                  const { data: userData } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("email", aptData.user_email)
                    .single();
                  
                  if (userData) {
                    userId = userData.id;
                  } else {
                    // Try auth users table as fallback
                    const { data: authUsers } = await supabase.auth.admin.listUsers();
                    const foundUser = authUsers?.users?.find(u => u.email === aptData.user_email);
                    if (foundUser) userId = foundUser.id;
                  }
                } catch (err) {
                  console.warn("Could not find user by email for appointment notification:", err);
                }
             }

             // Handle notification if userId was found
             if (userId) {
                console.log("User ID found for notification:", userId);
             } else {
                console.warn("Could not find user_id for appointment notification (no ID and email lookup failed)");
             }

             // --- SEPARATE EMAIL LOGIC (Independent of userId) ---
             if (["confirmed", "accepted", "rejected"].includes(newStatus) && (aptData.user_email || aptData.email)) {
               try {
                 const userEmail = aptData.user_email || aptData.email;
                 const userName = aptData.user_name || "Valued Customer";
                 const propertyTitle = aptData.properties?.title || aptData.property_title || "Property";
                 
                 // EmailJS Parameters
                 const templateParams = {
                   to_name: userName,
                   to_email: userEmail,
                   property_title: propertyTitle,
                   status: newStatus === "rejected" ? "Booking Request Declined" : "Booking Confirmed",
                   message: newStatus === "rejected" 
                     ? `We have reviewed your appointment request for "${propertyTitle}" and unfortunately, we are unable to proceed at this time. \n\nReason: ${rejectionReason}` 
                     : `Your appointment request for "${propertyTitle}" has been confirmed. We look forward to seeing you on ${aptData.appointment_date} at ${aptData.appointment_time}.`,
                   date_label: aptData.appointment_date,
                   time_label: aptData.appointment_time,
                   details_header: "Booking Details",
                   view_link: "https://ndfxcuboxpxbbsrdvywv.supabase.co",
                   logo_url: "https://raw.githubusercontent.com/RashmiShetty07/EliteNest/main/src/assets/logo.png"
                 };

                 console.log(`Attempting to send ${newStatus} email to: "${userEmail}" via EmailJS...`);
                 
                 if (SERVICE_ID && SERVICE_ID !== "service_xxxxxxx") {
                   await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
                   console.log("EmailJS send successful.");
                   alert(`✅ ${newStatus === "rejected" ? "Rejection" : "Acceptance"} email sent to ${userEmail}`);
                 }
               } catch (emailErr) {
                 console.error("Error sending email via EmailJS:", emailErr);
                 alert("❌ Failed to send email: " + (emailErr.text || emailErr.message));
               }
             }
          }
        } catch (notifErr) {
          console.error("Error in appointment notification logic:", notifErr);
        }
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
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={fetchAppointments} style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#1e40af", color: "#fff", border: "none", borderRadius: "6px" }}>
          {loading ? "Loading..." : "🔄 Refresh"}
        </button>
        
        <div style={{ display: 'flex', background: '#fff', padding: '4px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <button 
            onClick={() => { setFilter("all"); setCurrentPage(0); }}
            style={{ 
              padding: '6px 12px', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              background: filter === "all" ? "#ff6b35" : "transparent",
              color: filter === "all" ? "#fff" : "#64748b",
              fontWeight: "500"
            }}
          >
            All Bookings
          </button>
          <button 
            onClick={() => { setFilter("accepted"); setCurrentPage(0); }}
            style={{ 
              padding: '6px 12px', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              background: filter === "accepted" ? "#059669" : "transparent",
              color: filter === "accepted" ? "#fff" : "#64748b",
              fontWeight: "500"
            }}
          >
            ✅ Accepted Only
          </button>
        </div>

        {fetchError && (
          <span style={{ color: '#dc2626', fontSize: '0.9rem', fontWeight: '500' }}>
            ⚠️ {fetchError}
          </span>
        )}
      </div>

      {filteredAppointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: fetchError ? '#dc2626' : '#6b7280', margin: 0, fontWeight: fetchError ? '500' : 'normal' }}>
            {loading 
              ? "Checking for appointments..." 
              : fetchError 
                ? `Error: ${fetchError}` 
                : filter === "accepted" 
                  ? "No accepted appointments found." 
                  : "No appointments found."
            }
          </p>
          {fetchError && (
            <button 
              onClick={fetchAppointments} 
              style={{ 
                marginTop: '15px', 
                padding: '8px 16px', 
                backgroundColor: '#1e40af', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", marginTop: 12, marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", color: "#000" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Image</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Property Title</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Location</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>User Name</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>User Email</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Mobile Number</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Message</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Rejection Reason</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Cancel Reason</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Date</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Time</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Status</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Booked On</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedAppointments.map((apt) => {
                  const appointmentDateStr = apt.appointment_date && apt.appointment_time 
                    ? `${apt.appointment_date}T${apt.appointment_time}`
                    : apt.appointment_date;
                  const appointmentDate = appointmentDateStr ? new Date(appointmentDateStr) : null;
                  const proposedDates = apt.proposed_dates || [];
                  
                  // Use local properties from appointment data if relation fetch fails
                  const propertyTitle = apt.property_title || "N/A";
                  const propertyImage = apt.property_image || "https://via.placeholder.com/60?text=No+Img";
                  
                  return (
                    <tr key={apt.id}>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                        <img 
                          src={propertyImage} 
                          alt="Prop" 
                          style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/60?text=Error"; }}
                        />
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{propertyTitle}</td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{apt.property_location || "N/A"}</td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{apt.user_name || "N/A"}</td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{apt.user_email || "N/A"}</td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{apt.mobile_number || "N/A"}</td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={apt.message}>
                        {apt.message || "-"}
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={apt.rejection_reason}>
                        {apt.rejection_reason || "-"}
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={apt.cancellation_reason}>
                        {apt.cancellation_reason || "-"}
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                        {proposedDates.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {proposedDates.map((pd, idx) => (
                              <div key={idx} style={{ 
                                fontSize: "0.8rem", 
                                padding: "4px", 
                                backgroundColor: apt.appointment_date === pd.date && apt.appointment_time === pd.time ? "#d1fae5" : "#f3f4f6",
                                borderRadius: "4px",
                                border: apt.appointment_date === pd.date && apt.appointment_time === pd.time ? "1px solid #059669" : "1px solid #e5e7eb"
                              }}>
                                {new Date(pd.date).toLocaleDateString()}{pd.time && pd.time !== '00:00:00' ? ` @ ${pd.time}` : " (Date Only)"}
                              </div>
                            ))}
                          </div>
                        ) : (
                          appointmentDate ? appointmentDate.toLocaleDateString() : "N/A"
                        )}
                      </td>
                      <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                          {appointmentDate && apt.appointment_time && apt.appointment_time !== '00:00:00' 
                            ? appointmentDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) 
                            : "Date Only"}
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
                          {proposedDates.length > 0 && apt.status === "pending" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Select a confirmed date:</div>
                              {proposedDates.map((pd, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => updateAppointmentStatus(apt.id, "confirmed", pd)}
                                  style={{
                                    padding: "6px 12px",
                                    backgroundColor: "#059669",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                    textAlign: "left"
                                  }}
                                >
                                  ✓ Accept {new Date(pd.date).toLocaleDateString()}
                                </button>
                              ))}
                            </div>
                          ) : (
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
                              ✓ Accept Current
                            </button>
                          )}
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

function FeedbackTab({ feedback, fetchFeedback, deleteFeedback, loading }) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const itemsPerPage = 5;
  
  const totalPages = Math.ceil(feedback.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const displayedFeedback = feedback.slice(startIndex, startIndex + itemsPerPage);
  
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div>
      <button onClick={fetchFeedback} style={{ padding: "10px 20px", marginBottom: "20px", cursor: "pointer" }}>
        {loading ? "Loading..." : "Load Feedback"}
      </button>

      {feedback.length === 0 ? (
        <p style={{ marginTop: 12 }}>No feedback found.</p>
      ) : (
        <>
          <div style={{ overflowX: "auto", marginTop: 12, marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", color: "#000" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Date</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Name</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Rating</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Message</th>
                  <th style={{ border: "1px solid #e5e7eb", padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedFeedback.map((item) => (
                  <tr key={item.id}>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>{item.name}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                      <span style={{ color: "#f59e0b", fontWeight: "bold" }}>
                        {"★".repeat(item.rating)}
                        <span style={{ color: "#d1d5db" }}>{"★".repeat(5 - item.rating)}</span>
                      </span>
                    </td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8, maxWidth: "400px" }}>
                      {item.message}
                    </td>
                    <td style={{ border: "1px solid #e5e7eb", padding: 8 }}>
                      <button
                        onClick={() => deleteFeedback(item.id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#dc2626",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.85rem"
                        }}
                      >
                        🗑️ Delete
                      </button>
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

function PropertyModal({ property, onClose }) {
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