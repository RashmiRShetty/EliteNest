import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../admin-supabase.js";
import { getArray } from "../utils/properties.js";
import EditPropertyModal from "../components/EditPropertyModal";
import emailjs from "@emailjs/browser";
import Sidebar from "./AdminSidebar";
import Overview from "./AdminOverview";
import { UsersTab, PropertiesTab, SellersTab, LeasesTab, RentalsTab, AppointmentsTab, PaymentsTab, RemindersTab, FeedbackTab, PropertyModal } from "./AdminTabs";
import { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } from "./AdminEmailConfig";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [leases, setLeases] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [feedback, setFeedback] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin", { replace: true });
      } else {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (authLoading) return;
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
    if (activeTab === "payments") fetchPayments();
    if (activeTab === "feedback") fetchFeedback();
  }, [activeTab, authLoading]);

  const handleLogout = async () => {
    // Sign out ONLY from the local admin session to avoid logging out regular user dashboard
    await supabase.auth.signOut({ scope: 'local' });
    window.location.href = "/admin";
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
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at, is_admin")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users (registration):", error);
      console.error("Error fetching users (profiles):", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
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

      const { data: bookingsData, error: bookingsError, count } = await supabase
        .from("bookings")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (bookingsError) {
        console.error("Bookings table error:", bookingsError.message);
        setFetchError(bookingsError.message);
        setAppointments([]);
        setAppointmentsCount(0);
        return;
      }

      const combinedRaw = bookingsData || [];
      setAppointmentsCount(count || combinedRaw.length);

      console.log(`Raw bookings: ${combinedRaw.length}, Total count: ${count}`);

      if (combinedRaw.length === 0) {
        setAppointments([]);
        return;
      }

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
      setAppointmentsCount(0);
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

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // Map package names to prices
      const packagePrices = {
        'Silver': 299,
        'Gold': 499,
        'Platinum': 999
      };

      // Since there is no explicit payments table, we infer it from properties with packages
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, package_name, contact_name, contact_email, created_at')
        .in('package_name', Object.keys(packagePrices))
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const paymentsData = (data || []).map(p => ({
        ...p,
        amount: packagePrices[p.package_name] || 0,
        status: 'Success',
        payment_date: p.created_at
      }));

      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching payments:", error);
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

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "white" }}>
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #020617 0%, #020617 50%, #020617 100%)",
      }}
    >
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />

      <div
        style={{
          marginLeft: 260,
          padding: 32,
          flex: 1,
          background: "transparent",
        }}
      >
        <Header activeTab={activeTab} />

        {activeTab === "overview" && <Overview />}
        {activeTab === "users" && <UsersTab users={users} fetchUsers={fetchUsers} loading={loading} />}
        {activeTab === "properties" && (
          <PropertiesTab
            properties={properties}
            fetchProperties={fetchProperties}
            setSelectedProperty={setSelectedProperty}
            setShowModal={setShowModal}
            updateStatus={updateStatus}
          />
        )}
        {activeTab === "sellers" && <SellersTab sellers={sellers} fetchSellers={fetchSellers} updateStatus={updateStatus} setEditingProperty={setEditingProperty} setShowModal={setShowModal} />}
        {activeTab === "leases" && <LeasesTab leases={leases} fetchLeases={fetchLeases} updateStatus={updateStatus} setEditingProperty={setEditingProperty} setShowModal={setShowModal} />}
        {activeTab === "rentals" && <RentalsTab rentals={rentals} fetchRentals={fetchRentals} updateStatus={updateStatus} setEditingProperty={setEditingProperty} setShowModal={setShowModal} />}
        {activeTab === "appointments" && <AppointmentsTab appointments={appointments} fetchAppointments={fetchAppointments} loading={loading} fetchError={fetchError} appointmentsCount={appointmentsCount} />}
        {activeTab === "payments" && <PaymentsTab payments={payments} loading={loading} />}
        {activeTab === "reminders" && (
          <RemindersTab 
            properties={properties} 
            appointments={appointments} 
            loading={loading} 
            emailConfig={{ SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY }}
          />
        )}
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

function Header({ activeTab }) {
  return null;
}
function SellersTabLocal({ sellers, fetchSellers, updateStatus, setEditingProperty, setShowModal }) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [selectedSeller, setSelectedSeller] = React.useState(null);
  const [showModalLocal, setShowModalLocal] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState("all");
  const sellersPerPage = 8;
  
  const filteredSellers = filterStatus === "all" 
    ? sellers 
    : sellers.filter(p => p.status === filterStatus);
  
  const totalPages = Math.ceil(filteredSellers.length / sellersPerPage);
  const startIndex = currentPage * sellersPerPage;
  const displayedSellers = filteredSellers.slice(startIndex, startIndex + sellersPerPage);
  
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

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
                onClick={() => { setFilterStatus("all"); setCurrentPage(0); }}
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
                onClick={() => { setFilterStatus("pending"); setCurrentPage(0); }}
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
                onClick={() => { setFilterStatus("accepted"); setCurrentPage(0); }}
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
                onClick={() => { setFilterStatus("rejected"); setCurrentPage(0); }}
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
                        background: p.status === "accepted" ? "rgba(16, 185, 129, 0.9)" : 
                                   p.status === "rejected" ? "rgba(239, 68, 68, 0.9)" : 
                                   "rgba(245, 158, 11, 0.9)",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {p.status || "pending"}
                      </div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <h3 style={{ 
                        margin: "0 0 12px 0", 
                        color: "#fff", 
                        fontSize: "1.3rem",
                        fontWeight: "700",
                        lineHeight: "1.3"
                      }}>{p.title}</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#764ba2", fontSize: "1.1rem" }}>📍</span>
                          <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{p.city}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#764ba2", fontSize: "1.1rem" }}>🏠</span>
                          <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{p.property_listing_type}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#764ba2", fontSize: "1.1rem" }}>💰</span>
                          <span style={{ color: "#fff", fontSize: "1rem", fontWeight: "700" }}>₹{p.price}</span>
                        </div>
                        {p.bedrooms && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#764ba2", fontSize: "1.1rem" }}>🛏️</span>
                            <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{p.bedrooms} Bedrooms</span>
                          </div>
                        )}
                      </div>
                      <div style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: "1px solid rgba(118, 75, 162, 0.2)",
                        color: "#764ba2",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        textAlign: "center"
                      }}>
                        Click to view full details →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginTop: 32,
              background: "rgba(118, 75, 162, 0.08)",
              padding: "20px",
              borderRadius: "12px"
            }}>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                style={{
                  padding: "12px 24px",
                  background: currentPage === 0 ? "rgba(75, 85, 99, 0.4)" : "linear-gradient(135deg, #764ba2, #ec4899)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: currentPage === 0 ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "700",
                  transition: "all 0.3s",
                  boxShadow: currentPage === 0 ? "none" : "0 4px 15px rgba(118, 75, 162, 0.4)"
                }}
                onMouseEnter={(e) => {
                  if (currentPage > 0) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(118, 75, 162, 0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage > 0) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(118, 75, 162, 0.4)";
                  }
                }}
              >
                ← Previous
              </button>
              <span style={{ 
                color: "#fff", 
                fontSize: "1.1rem", 
                fontWeight: "600",
                background: "rgba(118, 75, 162, 0.15)",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid rgba(118, 75, 162, 0.3)"
              }}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                style={{
                  padding: "12px 24px",
                  background: currentPage === totalPages - 1 ? "rgba(75, 85, 99, 0.4)" : "linear-gradient(135deg, #764ba2, #ec4899)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "700",
                  transition: "all 0.3s",
                  boxShadow: currentPage === totalPages - 1 ? "none" : "0 4px 15px rgba(118, 75, 162, 0.4)"
                }}
                onMouseEnter={(e) => {
                  if (currentPage < totalPages - 1) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(118, 75, 162, 0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage < totalPages - 1) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(118, 75, 162, 0.4)";
                  }
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
      
      {showModalLocal && selectedSeller && (
        <SellerDetailsModal
          seller={selectedSeller}
          onClose={() => setShowModalLocal(false)}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

function SellerDetailsModal({ seller, onClose, onEdit, onStatusChange }) {
  const [rejectionReason, setRejectionReason] = React.useState(seller.rejection_reason || "");
  const [showRejectInput, setShowRejectInput] = React.useState(false);

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    
    try {
      await supabase
        .from("properties")
        .update({ rejection_reason: rejectionReason })
        .eq("id", seller.id);
      
      await onStatusChange(seller.id, "rejected");
      setShowRejectInput(false);
    } catch (error) {
      console.error("Error updating rejection reason:", error);
      alert("Error updating rejection reason");
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      backdropFilter: "blur(5px)"
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        padding: 32,
        borderRadius: 16,
        maxWidth: "900px",
        width: "90%",
        maxHeight: "85vh",
        overflowY: "auto",
        color: "#fff",
        border: "2px solid rgba(118, 75, 162, 0.3)",
        boxShadow: "0 25px 80px rgba(0, 0, 0, 0.8)"
      }}>
        <h2 style={{
          color: "#fff",
          marginTop: 0,
          fontSize: "2rem",
          fontWeight: "bold",
          background: "linear-gradient(135deg, #764ba2, #ec4899)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "24px"
        }}>{seller.title}</h2>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "rgba(118, 75, 162, 0.05)",
            borderRadius: "8px"
          }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600", width: "30%" }}>Type</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.type}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Area</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.area}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Bedrooms</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.bedrooms ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Bathrooms</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.bathrooms ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Parking</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.parking || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Furnished Status</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.furnished_status || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Balcony</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.balcony || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Nearby Places</td>
                <td style={{ padding: "12px 16px", color: "#a0aec0" }}>{seller.nearby_places || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Description</td>
                <td style={{ padding: "12px 16px", color: "#a0aec0" }}>{seller.description || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Address</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.address}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>City</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.city}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Price</td>
                <td style={{ padding: "12px 16px", color: "#fff", fontSize: "1.2rem", fontWeight: "bold" }}>₹{seller.price}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Listing Type</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.property_listing_type}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Deposit</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.deposit ? `₹${seller.deposit}` : "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Min Duration</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.min_duration ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Contact Name</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.contact_name}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Contact Phone</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.contact_phone}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Contact Email</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{seller.contact_email}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Status</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    backgroundColor: seller.status === "accepted" ? "rgba(5, 150, 105, 0.2)" : seller.status === "rejected" ? "rgba(220, 38, 38, 0.2)" : "rgba(245, 158, 11, 0.2)",
                    color: seller.status === "accepted" ? "#10b981" : seller.status === "rejected" ? "#ef4444" : "#f59e0b",
                    fontWeight: "600",
                    border: `1px solid ${seller.status === "accepted" ? "#10b981" : seller.status === "rejected" ? "#ef4444" : "#f59e0b"}`
                  }}>
                    {seller.status || "pending"}
                  </span>
                </td>
              </tr>
              {seller.rejection_reason && (
                <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(239, 68, 68, 0.1)" }}>
                  <td style={{ padding: "12px 16px", color: "#ef4444", fontWeight: "600", verticalAlign: "top" }}>Rejection Reason</td>
                  <td style={{ padding: "12px 16px", color: "#fca5a5" }}>{seller.rejection_reason}</td>
                </tr>
              )}
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600", verticalAlign: "top" }}>Rejection Reason</td>
                <td style={{ padding: "12px 16px" }}>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason (required for rejection)"
                    style={{
                      width: "100%",
                      minHeight: "80px",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "2px solid rgba(118, 75, 162, 0.3)",
                      background: "rgba(26, 26, 46, 0.5)",
                      color: "#fff",
                      fontSize: "0.95rem",
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                  />
                </td>
              </tr>
              {seller.image_urls && seller.image_urls.length > 0 && (
                <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                  <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600", verticalAlign: "top" }}>Images</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {seller.image_urls.map((src, i) => (
                        <img key={i} src={src} alt={`img-${i}`} style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 8, border: "2px solid rgba(118, 75, 162, 0.3)" }} />
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600", verticalAlign: "top" }}>Actions</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => onEdit(seller)}
                      style={{
                        padding: "10px 20px",
                        background: "linear-gradient(135deg, #667eea, #764ba2)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: "0 4px 12px rgba(118, 75, 162, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 6px 16px rgba(118, 75, 162, 0.6)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 4px 12px rgba(118, 75, 162, 0.4)";
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => onStatusChange(seller.id, "accepted")}
                      disabled={seller.status === "accepted"}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: seller.status === "accepted" ? "#6b7280" : "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: seller.status === "accepted" ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: seller.status === "accepted" ? "none" : "0 4px 12px rgba(16, 185, 129, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        if (seller.status !== "accepted") {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = seller.status === "accepted" ? "none" : "0 4px 12px rgba(16, 185, 129, 0.4)";
                      }}
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={seller.status === "rejected"}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: seller.status === "rejected" ? "#6b7280" : "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: seller.status === "rejected" ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: seller.status === "rejected" ? "none" : "0 4px 12px rgba(239, 68, 68, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        if (seller.status !== "rejected") {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = seller.status === "rejected" ? "none" : "0 4px 12px rgba(239, 68, 68, 0.4)";
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <button
          onClick={onClose}
          style={{
            marginTop: "24px",
            padding: "12px 32px",
            cursor: "pointer",
            background: "linear-gradient(135deg, #764ba2, #ec4899)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            width: "100%",
            transition: "all 0.3s",
            boxShadow: "0 4px 15px rgba(118, 75, 162, 0.4)"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(118, 75, 162, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(118, 75, 162, 0.4)";
          }}
        >Close</button>
      </div>
    </div>
  );
}

function LeasesTabLocal({ leases, fetchLeases, updateStatus, setEditingProperty, setShowModal }) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [selectedLease, setSelectedLease] = React.useState(null);
  const [showModalLocal, setShowModalLocal] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState("all");
  const leasesPerPage = 8;
  
  const filteredLeases = filterStatus === "all" 
    ? leases 
    : leases.filter(p => p.status === filterStatus);
  
  const totalPages = Math.ceil(filteredLeases.length / leasesPerPage);
  const startIndex = currentPage * leasesPerPage;
  const displayedLeases = filteredLeases.slice(startIndex, startIndex + leasesPerPage);
  
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

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
                onClick={() => { setFilterStatus("all"); setCurrentPage(0); }}
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
                onClick={() => { setFilterStatus("pending"); setCurrentPage(0); }}
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
                onClick={() => { setFilterStatus("accepted"); setCurrentPage(0); }}
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
                onClick={() => { setFilterStatus("rejected"); setCurrentPage(0); }}
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
                        background: p.status === "accepted" ? "rgba(16, 185, 129, 0.9)" : 
                                   p.status === "rejected" ? "rgba(239, 68, 68, 0.9)" : 
                                   "rgba(245, 158, 11, 0.9)",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {p.status || "pending"}
                      </div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <h3 style={{ 
                        margin: "0 0 12px 0", 
                        color: "#fff", 
                        fontSize: "1.3rem",
                        fontWeight: "700",
                        lineHeight: "1.3"
                      }}>{p.title}</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#3b82f6", fontSize: "1.1rem" }}>📍</span>
                          <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{p.city}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#3b82f6", fontSize: "1.1rem" }}>🏢</span>
                          <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{p.property_listing_type}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#3b82f6", fontSize: "1.1rem" }}>💰</span>
                          <span style={{ color: "#fff", fontSize: "1rem", fontWeight: "700" }}>₹{p.price}</span>
                        </div>
                        {p.bedrooms && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#3b82f6", fontSize: "1.1rem" }}>🛏️</span>
                            <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{p.bedrooms} Bedrooms</span>
                          </div>
                        )}
                      </div>
                      <div style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: "1px solid rgba(59, 130, 246, 0.2)",
                        color: "#3b82f6",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        textAlign: "center"
                      }}>
                        Click to view full details →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginTop: 32,
              background: "rgba(59, 130, 246, 0.08)",
              padding: "20px",
              borderRadius: "12px"
            }}>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                style={{
                  padding: "12px 24px",
                  background: currentPage === 0 ? "rgba(75, 85, 99, 0.4)" : "linear-gradient(135deg, #3b82f6, #06b6d4)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: currentPage === 0 ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "700",
                  transition: "all 0.3s",
                  boxShadow: currentPage === 0 ? "none" : "0 4px 15px rgba(59, 130, 246, 0.4)"
                }}
                onMouseEnter={(e) => {
                  if (currentPage > 0) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage > 0) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
                  }
                }}
              >
                ← Previous
              </button>
              <span style={{ 
                color: "#fff", 
                fontSize: "1.1rem", 
                fontWeight: "600",
                background: "rgba(59, 130, 246, 0.15)",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid rgba(59, 130, 246, 0.3)"
              }}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                style={{
                  padding: "12px 24px",
                  background: currentPage === totalPages - 1 ? "rgba(75, 85, 99, 0.4)" : "linear-gradient(135deg, #3b82f6, #06b6d4)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "700",
                  transition: "all 0.3s",
                  boxShadow: currentPage === totalPages - 1 ? "none" : "0 4px 15px rgba(59, 130, 246, 0.4)"
                }}
                onMouseEnter={(e) => {
                  if (currentPage < totalPages - 1) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage < totalPages - 1) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
                  }
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
      
      {showModalLocal && selectedLease && (
        <LeaseDetailsModal
          lease={selectedLease}
          onClose={() => setShowModalLocal(false)}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

function LeaseDetailsModal({ lease, onClose, onEdit, onStatusChange }) {
  const [rejectionReason, setRejectionReason] = React.useState(lease.rejection_reason || "");

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    
    try {
      await supabase
        .from("properties")
        .update({ rejection_reason: rejectionReason })
        .eq("id", lease.id);
      
      await onStatusChange(lease.id, "rejected");
    } catch (error) {
      console.error("Error updating rejection reason:", error);
      alert("Error updating rejection reason");
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      backdropFilter: "blur(5px)"
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        padding: 32,
        borderRadius: 16,
        maxWidth: "900px",
        width: "90%",
        maxHeight: "85vh",
        overflowY: "auto",
        color: "#fff",
        border: "2px solid rgba(59, 130, 246, 0.3)",
        boxShadow: "0 25px 80px rgba(0, 0, 0, 0.8)"
      }}>
        <h2 style={{
          color: "#fff",
          marginTop: 0,
          fontSize: "2rem",
          fontWeight: "bold",
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "24px"
        }}>{lease.title}</h2>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "rgba(59, 130, 246, 0.05)",
            borderRadius: "8px"
          }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600", width: "30%" }}>Type</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.type}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)", background: "rgba(59, 130, 246, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Area</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.area}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Bedrooms</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.bedrooms ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)", background: "rgba(59, 130, 246, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Bathrooms</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.bathrooms ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Parking</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.parking || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)", background: "rgba(59, 130, 246, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Furnished Status</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.furnished_status || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Balcony</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.balcony || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)", background: "rgba(59, 130, 246, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Nearby Places</td>
                <td style={{ padding: "12px 16px", color: "#a0aec0" }}>{lease.nearby_places || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Description</td>
                <td style={{ padding: "12px 16px", color: "#a0aec0" }}>{lease.description || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)", background: "rgba(59, 130, 246, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Address</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.address}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>City</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.city}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)", background: "rgba(59, 130, 246, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Price</td>
                <td style={{ padding: "12px 16px", color: "#fff", fontSize: "1.2rem", fontWeight: "bold" }}>₹{lease.price}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Listing Type</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.property_listing_type}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)", background: "rgba(59, 130, 246, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Deposit</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.deposit ? `₹${lease.deposit}` : "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Min Duration</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.min_duration ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)", background: "rgba(59, 130, 246, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Contact Name</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.contact_name}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Contact Phone</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.contact_phone}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)", background: "rgba(59, 130, 246, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Contact Email</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{lease.contact_email}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600" }}>Status</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    backgroundColor: lease.status === "accepted" ? "rgba(5, 150, 105, 0.2)" : lease.status === "rejected" ? "rgba(220, 38, 38, 0.2)" : "rgba(245, 158, 11, 0.2)",
                    color: lease.status === "accepted" ? "#10b981" : lease.status === "rejected" ? "#ef4444" : "#f59e0b",
                    fontWeight: "600",
                    border: `1px solid ${lease.status === "accepted" ? "#10b981" : lease.status === "rejected" ? "#ef4444" : "#f59e0b"}`
                  }}>
                    {lease.status || "pending"}
                  </span>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)", background: "rgba(59, 130, 246, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600", verticalAlign: "top" }}>Rejection Reason</td>
                <td style={{ padding: "12px 16px" }}>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason (required for rejection)"
                    style={{
                      width: "100%",
                      minHeight: "80px",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "2px solid rgba(59, 130, 246, 0.3)",
                      background: "rgba(26, 26, 46, 0.5)",
                      color: "#fff",
                      fontSize: "0.95rem",
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                  />
                </td>
              </tr>
              {lease.image_urls && lease.image_urls.length > 0 && (
                <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                  <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600", verticalAlign: "top" }}>Images</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {lease.image_urls.map((src, i) => (
                        <img key={i} src={src} alt={`img-${i}`} style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 8, border: "2px solid rgba(59, 130, 246, 0.3)" }} />
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "12px 16px", color: "#3b82f6", fontWeight: "600", verticalAlign: "top" }}>Actions</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => onEdit(lease)}
                      style={{
                        padding: "10px 20px",
                        background: "linear-gradient(135deg, #667eea, #3b82f6)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.6)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => onStatusChange(lease.id, "accepted")}
                      disabled={lease.status === "accepted"}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: lease.status === "accepted" ? "#6b7280" : "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: lease.status === "accepted" ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: lease.status === "accepted" ? "none" : "0 4px 12px rgba(16, 185, 129, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        if (lease.status !== "accepted") {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = lease.status === "accepted" ? "none" : "0 4px 12px rgba(16, 185, 129, 0.4)";
                      }}
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={lease.status === "rejected"}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: lease.status === "rejected" ? "#6b7280" : "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: lease.status === "rejected" ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: lease.status === "rejected" ? "none" : "0 4px 12px rgba(239, 68, 68, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        if (lease.status !== "rejected") {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = lease.status === "rejected" ? "none" : "0 4px 12px rgba(239, 68, 68, 0.4)";
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <button
          onClick={onClose}
          style={{
            marginTop: "24px",
            padding: "12px 32px",
            cursor: "pointer",
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            width: "100%",
            transition: "all 0.3s",
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
          }}
        >Close</button>
      </div>
    </div>
  );
}

function RentalsTabLocal({ rentals, fetchRentals, updateStatus, setEditingProperty, setShowModal }) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [selectedRental, setSelectedRental] = React.useState(null);
  const [showModalLocal, setShowModalLocal] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState("all");
  const rentalsPerPage = 8;
  
  const filteredRentals = filterStatus === "all" 
    ? rentals 
    : rentals.filter(p => p.status === filterStatus);
  
  const totalPages = Math.ceil(filteredRentals.length / rentalsPerPage);
  const startIndex = currentPage * rentalsPerPage;
  const displayedRentals = filteredRentals.slice(startIndex, startIndex + rentalsPerPage);
  
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

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
                onClick={() => { setFilterStatus("all"); setCurrentPage(0); }}
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
                onClick={() => { setFilterStatus("pending"); setCurrentPage(0); }}
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
                onClick={() => { setFilterStatus("accepted"); setCurrentPage(0); }}
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
                onClick={() => { setFilterStatus("rejected"); setCurrentPage(0); }}
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
                        background: p.status === "accepted" ? "rgba(16, 185, 129, 0.9)" : 
                                   p.status === "rejected" ? "rgba(239, 68, 68, 0.9)" : 
                                   "rgba(245, 158, 11, 0.9)",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {p.status || "pending"}
                      </div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <h3 style={{ 
                        margin: "0 0 12px 0", 
                        color: "#fff", 
                        fontSize: "1.3rem",
                        fontWeight: "700",
                        lineHeight: "1.3"
                      }}>{p.title}</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#764ba2", fontSize: "1.1rem" }}>📍</span>
                          <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{p.city}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#764ba2", fontSize: "1.1rem" }}>🏠</span>
                          <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{p.property_listing_type}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#764ba2", fontSize: "1.1rem" }}>💰</span>
                          <span style={{ color: "#fff", fontSize: "1rem", fontWeight: "700" }}>₹{p.price}</span>
                        </div>
                        {p.bedrooms && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#764ba2", fontSize: "1.1rem" }}>🛏️</span>
                            <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{p.bedrooms} Bedrooms</span>
                          </div>
                        )}
                      </div>
                      <div style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: "1px solid rgba(118, 75, 162, 0.2)",
                        color: "#764ba2",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        textAlign: "center"
                      }}>
                        Click to view full details →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginTop: 32,
              background: "rgba(118, 75, 162, 0.08)",
              padding: "20px",
              borderRadius: "12px"
            }}>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                style={{
                  padding: "12px 24px",
                  background: currentPage === 0 ? "rgba(75, 85, 99, 0.4)" : "linear-gradient(135deg, #764ba2, #ec4899)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: currentPage === 0 ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "700",
                  transition: "all 0.3s",
                  boxShadow: currentPage === 0 ? "none" : "0 4px 15px rgba(118, 75, 162, 0.4)"
                }}
                onMouseEnter={(e) => {
                  if (currentPage > 0) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(118, 75, 162, 0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage > 0) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(118, 75, 162, 0.4)";
                  }
                }}
              >
                ← Previous
              </button>
              <span style={{ 
                color: "#fff", 
                fontSize: "1.1rem", 
                fontWeight: "600",
                background: "rgba(118, 75, 162, 0.15)",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid rgba(118, 75, 162, 0.3)"
              }}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                style={{
                  padding: "12px 24px",
                  background: currentPage === totalPages - 1 ? "rgba(75, 85, 99, 0.4)" : "linear-gradient(135deg, #764ba2, #ec4899)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "700",
                  transition: "all 0.3s",
                  boxShadow: currentPage === totalPages - 1 ? "none" : "0 4px 15px rgba(118, 75, 162, 0.4)"
                }}
                onMouseEnter={(e) => {
                  if (currentPage < totalPages - 1) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(118, 75, 162, 0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage < totalPages - 1) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(118, 75, 162, 0.4)";
                  }
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
      
      {showModalLocal && selectedRental && (
        <RentalDetailsModal
          rental={selectedRental}
          onClose={() => setShowModalLocal(false)}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

function RentalDetailsModal({ rental, onClose, onEdit, onStatusChange }) {
  const [rejectionReason, setRejectionReason] = React.useState(rental.rejection_reason || "");

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    
    try {
      await supabase
        .from("properties")
        .update({ rejection_reason: rejectionReason })
        .eq("id", rental.id);
      
      await onStatusChange(rental.id, "rejected");
    } catch (error) {
      console.error("Error updating rejection reason:", error);
      alert("Error updating rejection reason");
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      backdropFilter: "blur(5px)"
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        padding: 32,
        borderRadius: 16,
        maxWidth: "900px",
        width: "90%",
        maxHeight: "85vh",
        overflowY: "auto",
        color: "#fff",
        border: "2px solid rgba(118, 75, 162, 0.3)",
        boxShadow: "0 25px 80px rgba(0, 0, 0, 0.8)"
      }}>
        <h2 style={{
          color: "#fff",
          marginTop: 0,
          fontSize: "2rem",
          fontWeight: "bold",
          background: "linear-gradient(135deg, #764ba2, #ec4899)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "24px"
        }}>{rental.title}</h2>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "rgba(118, 75, 162, 0.05)",
            borderRadius: "8px"
          }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600", width: "30%" }}>Type</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.type}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Area</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.area}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Bedrooms</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.bedrooms ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Bathrooms</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.bathrooms ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Parking</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.parking || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Furnished Status</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.furnished_status || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Balcony</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.balcony || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Nearby Places</td>
                <td style={{ padding: "12px 16px", color: "#a0aec0" }}>{rental.nearby_places || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Description</td>
                <td style={{ padding: "12px 16px", color: "#a0aec0" }}>{rental.description || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Address</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.address}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>City</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.city}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Price</td>
                <td style={{ padding: "12px 16px", color: "#fff", fontSize: "1.2rem", fontWeight: "bold" }}>₹{rental.price}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Listing Type</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.property_listing_type}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Deposit</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.deposit ? `₹${rental.deposit}` : "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Min Duration</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.min_duration ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Contact Name</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.contact_name}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Contact Phone</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.contact_phone}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Contact Email</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{rental.contact_email}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600" }}>Status</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    backgroundColor: rental.status === "accepted" ? "rgba(5, 150, 105, 0.2)" : rental.status === "rejected" ? "rgba(220, 38, 38, 0.2)" : "rgba(245, 158, 11, 0.2)",
                    color: rental.status === "accepted" ? "#10b981" : rental.status === "rejected" ? "#ef4444" : "#f59e0b",
                    fontWeight: "600",
                    border: `1px solid ${rental.status === "accepted" ? "#10b981" : rental.status === "rejected" ? "#ef4444" : "#f59e0b"}`
                  }}>
                    {rental.status || "pending"}
                  </span>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)", background: "rgba(118, 75, 162, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600", verticalAlign: "top" }}>Rejection Reason</td>
                <td style={{ padding: "12px 16px" }}>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason (required for rejection)"
                    style={{
                      width: "100%",
                      minHeight: "80px",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "2px solid rgba(118, 75, 162, 0.3)",
                      background: "rgba(26, 26, 46, 0.5)",
                      color: "#fff",
                      fontSize: "0.95rem",
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                  />
                </td>
              </tr>
              {rental.image_urls && rental.image_urls.length > 0 && (
                <tr style={{ borderBottom: "1px solid rgba(118, 75, 162, 0.2)" }}>
                  <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600", verticalAlign: "top" }}>Images</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {rental.image_urls.map((src, i) => (
                        <img key={i} src={src} alt={`img-${i}`} style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 8, border: "2px solid rgba(118, 75, 162, 0.3)" }} />
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "12px 16px", color: "#764ba2", fontWeight: "600", verticalAlign: "top" }}>Actions</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => onEdit(rental)}
                      style={{
                        padding: "10px 20px",
                        background: "linear-gradient(135deg, #667eea, #764ba2)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: "0 4px 12px rgba(118, 75, 162, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 6px 16px rgba(118, 75, 162, 0.6)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 4px 12px rgba(118, 75, 162, 0.4)";
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => onStatusChange(rental.id, "accepted")}
                      disabled={rental.status === "accepted"}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: rental.status === "accepted" ? "#6b7280" : "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: rental.status === "accepted" ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: rental.status === "accepted" ? "none" : "0 4px 12px rgba(16, 185, 129, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        if (rental.status !== "accepted") {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = rental.status === "accepted" ? "none" : "0 4px 12px rgba(16, 185, 129, 0.4)";
                      }}
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={rental.status === "rejected"}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: rental.status === "rejected" ? "#6b7280" : "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: rental.status === "rejected" ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: rental.status === "rejected" ? "none" : "0 4px 12px rgba(239, 68, 68, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        if (rental.status !== "rejected") {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = rental.status === "rejected" ? "none" : "0 4px 12px rgba(239, 68, 68, 0.4)";
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <button
          onClick={onClose}
          style={{
            marginTop: "24px",
            padding: "12px 32px",
            cursor: "pointer",
            background: "linear-gradient(135deg, #764ba2, #ec4899)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            width: "100%",
            transition: "all 0.3s",
            boxShadow: "0 4px 15px rgba(118, 75, 162, 0.4)"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(118, 75, 162, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(118, 75, 162, 0.4)";
          }}
        >Close</button>
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
      <button onClick={fetchData} style={{
        padding: "12px 24px",
        marginBottom: "24px",
        cursor: "pointer",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "600",
        boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
        transition: "all 0.3s"
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = "translateY(-2px)";
        e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = "translateY(0)";
        e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
      }}>
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

function AppointmentsTabLocal({ appointments, fetchAppointments, loading, fetchError, appointmentsCount }) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [filter, setFilter] = React.useState("all"); // "all", "confirmed", or "pending"
  const itemsPerPage = 8;
  
  const filteredAppointments = filter === "confirmed" 
    ? appointments.filter(apt => apt.status === "confirmed" || apt.status === "accepted")
    : filter === "pending"
    ? appointments.filter(apt => apt.status === "pending")
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
                
                // Create in-app notification for appointment status update
                try {
                  const isConfirmed = newStatus === "confirmed" || newStatus === "accepted";
                  const notifType = isConfirmed ? "appointment_confirmed" : "appointment_rejected";
                  const notifTitle = isConfirmed ? "Appointment Confirmed!" : "Appointment Rejected";
                  const propertyTitle = aptData.property_title || "Property";
                  const notifMessage = isConfirmed 
                    ? `Your appointment for "${propertyTitle}" has been confirmed for ${updateData.appointment_date || aptData.appointment_date} at ${updateData.appointment_time || aptData.appointment_time}.`
                    : `Your appointment request for "${propertyTitle}" has been rejected. Reason: ${rejectionReason}`;

                  const { error: notifError } = await supabase
                    .from("notifications")
                    .insert({
                      user_id: userId,
                      type: notifType,
                      title: notifTitle,
                      message: notifMessage,
                      property_id: aptData.property_id,
                      read: false,
                      created_at: new Date().toISOString()
                    });
                  
                  if (notifError) console.error("Error creating appointment notification:", notifError);

                  // Also create a message for the user
                  await supabase.from("messages").insert({
                    user_id: userId,
                    subject: notifTitle,
                    message: notifMessage,
                    created_at: new Date().toISOString()
                  });
                } catch (notifErr) {
                  console.error("Failed to create in-app notification:", notifErr);
                }
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
        <button onClick={() => { setCurrentPage(0); fetchAppointments(); }} style={{
          padding: "12px 24px",
          cursor: "pointer",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem",
          fontWeight: "600",
          boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
          transition: "all 0.3s"
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
        }}>
          {loading ? "Loading..." : `  Load Appointments (${appointmentsCount})`}
        </button>
        
        <span style={{
          background: "rgba(102, 126, 234, 0.15)",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: "8px",
          fontSize: "0.95rem",
          fontWeight: "600",
          border: "1px solid rgba(102, 126, 234, 0.3)"
        }}>
          Total: {appointments.length} bookings
        </span>
        
        <div style={{ 
          display: 'flex', 
          background: 'rgba(102, 126, 234, 0.1)', 
          padding: '6px', 
          borderRadius: '10px', 
          border: '1px solid rgba(102, 126, 234, 0.3)',
          gap: '4px'
        }}>
          <button 
            onClick={() => { setFilter("all"); setCurrentPage(0); }}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              background: filter === "all" ? "linear-gradient(135deg, #667eea, #764ba2)" : "transparent",
              color: "#fff",
              fontWeight: "600",
              fontSize: "0.9rem",
              transition: "all 0.3s"
            }}
          >
            All
          </button>
          <button 
            onClick={() => { setFilter("pending"); setCurrentPage(0); }}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              background: filter === "pending" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
              color: "#fff",
              fontWeight: "600",
              fontSize: "0.9rem",
              transition: "all 0.3s"
            }}
          >
            ⏳ Pending
          </button>
          <button 
            onClick={() => { setFilter("confirmed"); setCurrentPage(0); }}
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              background: filter === "confirmed" ? "linear-gradient(135deg, #10b981, #059669)" : "transparent",
              color: "#fff",
              fontWeight: "600",
              fontSize: "0.9rem",
              transition: "all 0.3s"
            }}
          >
            ✅ Confirmed
          </button>
        </div>

        {fetchError && (
          <span style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '500' }}>
            ⚠️ {fetchError}
          </span>
        )}
      </div>

      {filteredAppointments.length === 0 ? (
        <div style={{
          background: "rgba(102, 126, 234, 0.1)",
          border: "2px dashed rgba(102, 126, 234, 0.3)",
          borderRadius: "16px",
          padding: "60px 40px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📅</div>
          <p style={{ 
            color: "#fff", 
            fontSize: "1.3rem", 
            fontWeight: "600",
            margin: "0 0 8px 0"
          }}>
            {loading ? "Loading appointments..." : fetchError ? `Error: ${fetchError}` : filter === "pending" ? "No pending appointments" : filter === "confirmed" ? "No confirmed appointments" : "No appointments found"}
          </p>
          <p style={{
            color: "#a0aec0",
            fontSize: "1rem",
            margin: 0
          }}>Click "Load Appointments" button to fetch bookings from database</p>
          {fetchError && (
            <button 
              onClick={fetchAppointments} 
              style={{ 
                marginTop: '15px', 
                padding: '8px 16px', 
                backgroundColor: '#667eea', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24, 
            marginBottom: 20 
          }}>
            {displayedAppointments.map((apt) => {
              const propertyImage = apt.property_image || "https://via.placeholder.com/300x200?text=No+Image";
              
              return (
                <div
                  key={apt.id}
                  style={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                    border: "2px solid #667eea40",
                    borderRadius: 16,
                    cursor: "pointer",
                    color: "#fff",
                    transition: "all 0.3s",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                    overflow: "hidden"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 20px 50px rgba(102, 126, 234, 0.6)";
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.borderColor = "#667eea";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "#667eea40";
                  }}
                >
                  <div style={{
                    width: "100%",
                    height: "200px",
                    overflow: "hidden",
                    position: "relative"
                  }}>
                    <img 
                      src={propertyImage} 
                      alt={apt.property_title} 
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
                      background: apt.status === "confirmed" || apt.status === "accepted" ? "rgba(16, 185, 129, 0.9)" : 
                                 apt.status === "cancelled" || apt.status === "rejected" ? "rgba(239, 68, 68, 0.9)" : 
                                 "rgba(245, 158, 11, 0.9)",
                      color: "#fff",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {apt.status || "pending"}
                    </div>
                  </div>
                  <div style={{ padding: 20 }}>
                    <h3 style={{ 
                      margin: "0 0 12px 0", 
                      color: "#fff", 
                      fontSize: "1.3rem",
                      fontWeight: "700",
                      lineHeight: "1.3"
                    }}>{apt.property_title || "Property"}</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#667eea", fontSize: "1.1rem" }}>📍</span>
                        <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{apt.property_location || apt.city || "Location N/A"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#667eea", fontSize: "1.1rem" }}>👤</span>
                        <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{apt.user_name || "N/A"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#667eea", fontSize: "1.1rem" }}>📧</span>
                        <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{apt.user_email || "N/A"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#667eea", fontSize: "1.1rem" }}>📱</span>
                        <span style={{ color: "#a0aec0", fontSize: "0.9rem" }}>{apt.mobile_number || "N/A"}</span>
                      </div>
                      {apt.appointment_date && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#667eea", fontSize: "1.1rem" }}>📅</span>
                          <span style={{ color: "#fff", fontSize: "0.9rem", fontWeight: "600" }}>
                            {new Date(apt.appointment_date).toLocaleDateString()}
                            {apt.appointment_time && apt.appointment_time !== '00:00:00' ? ` @ ${apt.appointment_time}` : ""}
                          </span>
                        </div>
                      )}
                      {apt.message && (
                        <div style={{ marginTop: 8, padding: "8px", backgroundColor: "rgba(102, 126, 234, 0.1)", borderRadius: "8px", borderLeft: "3px solid #667eea" }}>
                          <p style={{ margin: 0, color: "#a0aec0", fontSize: "0.8rem" }}>💬 {apt.message}</p>
                        </div>
                      )}
                    </div>
                    <div style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid rgba(102, 126, 234, 0.2)",
                      display: "flex",
                      gap: 8
                    }}>
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, "confirmed")}
                        disabled={apt.status === "confirmed" || apt.status === "accepted"}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: (apt.status === "confirmed" || apt.status === "accepted") ? "#4b5563" : "#10b981",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: (apt.status === "confirmed" || apt.status === "accepted") ? "not-allowed" : "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          transition: "all 0.3s"
                        }}
                        onMouseEnter={(e) => {
                          if (apt.status !== "confirmed" && apt.status !== "accepted") {
                            e.target.style.backgroundColor = "#059669";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (apt.status !== "confirmed" && apt.status !== "accepted") {
                            e.target.style.backgroundColor = "#10b981";
                          }
                        }}
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, "rejected")}
                        disabled={apt.status === "rejected" || apt.status === "cancelled"}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: (apt.status === "rejected" || apt.status === "cancelled") ? "#4b5563" : "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: (apt.status === "rejected" || apt.status === "cancelled") ? "not-allowed" : "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          transition: "all 0.3s"
                        }}
                        onMouseEnter={(e) => {
                          if (apt.status !== "rejected" && apt.status !== "cancelled") {
                            e.target.style.backgroundColor = "#dc2626";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (apt.status !== "rejected" && apt.status !== "cancelled") {
                            e.target.style.backgroundColor = "#ef4444";
                          }
                        }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            marginTop: 32,
            background: "rgba(102, 126, 234, 0.08)",
            padding: "20px",
            borderRadius: "12px"
          }}>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              style={{
                padding: "12px 24px",
                background: currentPage === 0 ? "rgba(75, 85, 99, 0.4)" : "linear-gradient(135deg, #667eea, #764ba2)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "700",
                transition: "all 0.3s",
                boxShadow: currentPage === 0 ? "none" : "0 4px 15px rgba(102, 126, 234, 0.4)"
              }}
              onMouseEnter={(e) => {
                if (currentPage > 0) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage > 0) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
                }
              }}
            >
              ← Previous
            </button>
            <span style={{ 
              color: "#fff", 
              fontSize: "1.1rem", 
              fontWeight: "600",
              background: "rgba(102, 126, 234, 0.15)",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid rgba(102, 126, 234, 0.3)"
            }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              style={{
                padding: "12px 24px",
                background: currentPage === totalPages - 1 ? "rgba(75, 85, 99, 0.4)" : "linear-gradient(135deg, #667eea, #764ba2)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "700",
                transition: "all 0.3s",
                boxShadow: currentPage === totalPages - 1 ? "none" : "0 4px 15px rgba(102, 126, 234, 0.4)"
              }}
              onMouseEnter={(e) => {
                if (currentPage < totalPages - 1) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage < totalPages - 1) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
                }
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

function FeedbackTabLocal({ feedback, fetchFeedback, deleteFeedback, loading }) {
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
    <div style={{
      background: "#000000",
      borderRadius: "16px",
      padding: "30px",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
      minHeight: "400px"
    }}>
      <button onClick={fetchFeedback} style={{
        padding: "14px 28px",
        marginBottom: "24px",
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
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 6px 16px rgba(220, 38, 38, 0.6)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.4)";
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
            marginTop: 20,
            background: "rgba(55, 65, 81, 0.4)",
            backdropFilter: "blur(10px)",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid rgba(107, 114, 128, 0.3)"
          }}>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              style={{
                padding: "12px 20px",
                background: currentPage === 0 ? "rgba(209, 213, 219, 0.3)" : "linear-gradient(135deg, #a855f7, #ec4899)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "600",
                boxShadow: currentPage === 0 ? "none" : "0 4px 15px rgba(168, 85, 247, 0.4)",
                transition: "all 0.3s"
              }}
            >
              ← Previous
            </button>
            <span style={{ color: "#e5e7eb", fontSize: "1rem", fontWeight: "600", textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              style={{
                padding: "12px 20px",
                background: currentPage === totalPages - 1 ? "rgba(209, 213, 219, 0.3)" : "linear-gradient(135deg, #a855f7, #ec4899)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "600",
                boxShadow: currentPage === totalPages - 1 ? "none" : "0 4px 15px rgba(168, 85, 247, 0.4)",
                transition: "all 0.3s"
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

function PropertyDetailsModal({ property, onClose, onEdit, onStatusChange }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      backdropFilter: "blur(5px)"
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        padding: 32,
        borderRadius: 16,
        maxWidth: "900px",
        width: "90%",
        maxHeight: "85vh",
        overflowY: "auto",
        color: "#fff",
        border: "2px solid rgba(102, 126, 234, 0.3)",
        boxShadow: "0 25px 80px rgba(0, 0, 0, 0.8)"
      }}>
        <h2 style={{
          color: "#fff",
          marginTop: 0,
          fontSize: "2rem",
          fontWeight: "bold",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "24px"
        }}>{property.title}</h2>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "rgba(102, 126, 234, 0.05)",
            borderRadius: "8px"
          }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600", width: "30%" }}>Type</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.type}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)", background: "rgba(102, 126, 234, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Area</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.area}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Bedrooms</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.bedrooms ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)", background: "rgba(102, 126, 234, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Bathrooms</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.bathrooms ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Parking</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.parking || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)", background: "rgba(102, 126, 234, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Furnished Status</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.furnished_status || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Balcony</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.balcony || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)", background: "rgba(102, 126, 234, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Nearby Places</td>
                <td style={{ padding: "12px 16px", color: "#a0aec0" }}>{property.nearby_places || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Description</td>
                <td style={{ padding: "12px 16px", color: "#a0aec0" }}>{property.description || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)", background: "rgba(102, 126, 234, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Address</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.address}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>City</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.city}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)", background: "rgba(102, 126, 234, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Price</td>
                <td style={{ padding: "12px 16px", color: "#fff", fontSize: "1.2rem", fontWeight: "bold" }}>₹{property.price}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Listing Type</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.property_listing_type}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)", background: "rgba(102, 126, 234, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Deposit</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.deposit ? `₹${property.deposit}` : "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Min Duration</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.min_duration ?? "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)", background: "rgba(102, 126, 234, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Contact Name</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.contact_name}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Contact Phone</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.contact_phone}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)", background: "rgba(102, 126, 234, 0.05)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Contact Email</td>
                <td style={{ padding: "12px 16px", color: "#fff" }}>{property.contact_email}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)" }}>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600" }}>Status</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    backgroundColor: property.status === "accepted" ? "rgba(5, 150, 105, 0.2)" : property.status === "rejected" ? "rgba(220, 38, 38, 0.2)" : "rgba(245, 158, 11, 0.2)",
                    color: property.status === "accepted" ? "#10b981" : property.status === "rejected" ? "#ef4444" : "#f59e0b",
                    fontWeight: "600",
                    border: `1px solid ${property.status === "accepted" ? "#10b981" : property.status === "rejected" ? "#ef4444" : "#f59e0b"}`
                  }}>
                    {property.status || "pending"}
                  </span>
                </td>
              </tr>
              {property.image_urls && property.image_urls.length > 0 && (
                <tr style={{ borderBottom: "1px solid rgba(102, 126, 234, 0.2)", background: "rgba(102, 126, 234, 0.05)" }}>
                  <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600", verticalAlign: "top" }}>Images</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {property.image_urls.map((src, i) => (
                        <img key={i} src={src} alt={`img-${i}`} style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 8, border: "2px solid rgba(102, 126, 234, 0.3)" }} />
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "12px 16px", color: "#667eea", fontWeight: "600", verticalAlign: "top" }}>Actions</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => onEdit(property)}
                      style={{
                        padding: "10px 20px",
                        background: "linear-gradient(135deg, #667eea, #764ba2)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.6)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => onStatusChange(property.id, "accepted")}
                      disabled={property.status === "accepted"}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: property.status === "accepted" ? "#6b7280" : "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: property.status === "accepted" ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: property.status === "accepted" ? "none" : "0 4px 12px rgba(16, 185, 129, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        if (property.status !== "accepted") {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = property.status === "accepted" ? "none" : "0 4px 12px rgba(16, 185, 129, 0.4)";
                      }}
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => onStatusChange(property.id, "rejected")}
                      disabled={property.status === "rejected"}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: property.status === "rejected" ? "#6b7280" : "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: property.status === "rejected" ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        transition: "all 0.3s",
                        boxShadow: property.status === "rejected" ? "none" : "0 4px 12px rgba(239, 68, 68, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        if (property.status !== "rejected") {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.6)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = property.status === "rejected" ? "none" : "0 4px 12px rgba(239, 68, 68, 0.4)";
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <button
          onClick={onClose}
          style={{
            marginTop: "24px",
            padding: "12px 32px",
            cursor: "pointer",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            width: "100%",
            transition: "all 0.3s",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
          }}
        >Close</button>
      </div>
    </div>
  );
}

function PropertyModalLegacy({ property, onClose }) {
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
