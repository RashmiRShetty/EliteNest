import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "./supabase";
import "./App.css";

function PostNowButton({ property }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showTestPayment, setShowTestPayment] = useState(false);

  // Check if payment is already completed
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Check status first (this column should exist)
        const { data } = await supabase
          .from("properties")
          .select("status, payment_status")
          .eq("id", property.id)
          .single();
        
        // If status is approved, payment is considered complete
        if (data?.status === "approved" || data?.payment_status === "paid") {
          setShowPaymentModal(false);
        }
      } catch (error) {
        // If payment_status column doesn't exist, check status only
        const { data } = await supabase
          .from("properties")
          .select("status")
          .eq("id", property.id)
          .single();
        
        if (data?.status === "approved") {
          setShowPaymentModal(false);
        }
      }
    };
    checkPaymentStatus();
  }, [property.id]);

  const handlePayment = async (isTestPayment = false) => {
    setProcessing(true);
    
    try {
      // Simulate payment processing delay for test payment
      if (isTestPayment) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
      }

      // Update payment status and set status to approved so it's visible to all users
      // First, check if payment_status column exists, if not, we'll use status only
      const updateData = {
        status: "approved" // Make property visible to all users
      };
      
      // Try to add payment_status if column exists (will fail gracefully if it doesn't)
      try {
        // Check if we can query payment_status first
        const { data: testData } = await supabase
          .from("properties")
          .select("payment_status")
          .eq("id", property.id)
          .limit(1);
        
        if (testData !== null) {
          // Column exists, add it to update
          updateData.payment_status = "paid";
        }
      } catch (e) {
        // Column doesn't exist, continue without it
        console.log("payment_status column not found, using status only");
      }

      const { data, error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", property.id)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Verify the update was successful
      if (!data || data.length === 0) {
        throw new Error("Property update failed - no data returned");
      }

      console.log("Payment successful, property updated:", data);

      // Show success message with clear indication
      const message = isTestPayment 
        ? "✅ PAYMENT SUCCESSFUL!\n\nTest Payment Confirmed\n\nYour property listing is now:\n• Live on the platform\n• Visible to all users\n• Active and searchable\n\nYou can view it on the Properties page!"
        : "✅ PAYMENT SUCCESSFUL!\n\nPayment Confirmed\n\nYour property listing is now:\n• Live on the platform\n• Visible to all users\n• Active and searchable\n\nYou can view it on the Properties page!";
      
      alert(message);
      setShowPaymentModal(false);
      setShowTestPayment(false);
      
      // Small delay before reload to ensure database update is complete
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error("Error updating payment status:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      alert(`❌ Payment Failed\n\nError: ${error.message || "Failed to process payment. Please try again."}`);
      setProcessing(false);
    }
  };

  // Only show button if payment is not completed
  // Check both payment_status and status for compatibility
  if (property.payment_status === "paid" || property.status === "approved") {
    return (
      <span style={{
        padding: "8px 16px",
        backgroundColor: "#d1fae5",
        color: "#065f46",
        border: "none",
        borderRadius: "6px",
        fontSize: "0.9rem",
        fontWeight: "500"
      }}>
        ✅ Posted & Active
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowPaymentModal(true)}
        style={{
          padding: "8px 16px",
          backgroundColor: "#059669",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "600"
        }}
      >
        📝 Post Now
      </button>

      {showPaymentModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%"
          }}>
            <h3 style={{ marginBottom: "20px" }}>Complete Payment to Post Your Property</h3>
            <div style={{ marginBottom: "20px" }}>
              <p><strong>Property:</strong> {property.title}</p>
              <p><strong>Amount:</strong> ₹500 (Listing Fee)</p>
              <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "10px" }}>
                After payment, your property will be live and visible to all users on the platform.
              </p>
            </div>

            {!showTestPayment ? (
              <>
                <div style={{ 
                  marginBottom: "20px", 
                  padding: "15px", 
                  backgroundColor: "#f3f4f6", 
                  borderRadius: "8px",
                  border: "1px dashed #9ca3af"
                }}>
                  <p style={{ 
                    fontSize: "0.9rem", 
                    color: "#6b7280", 
                    marginBottom: "10px",
                    fontWeight: "500"
                  }}>
                    Payment Options:
                  </p>
                  <button
                    onClick={() => setShowTestPayment(true)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "#fef3c7",
                      color: "#92400e",
                      border: "1px solid #fbbf24",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      marginBottom: "10px"
                    }}
                  >
                    🧪 Test Payment (Dummy)
                  </button>
                  <p style={{ 
                    fontSize: "0.75rem", 
                    color: "#9ca3af", 
                    margin: 0,
                    fontStyle: "italic"
                  }}>
                    Use test payment for development/testing purposes
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    disabled={processing}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: processing ? "#9ca3af" : "#6b7280",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: processing ? "not-allowed" : "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // In production, this would integrate with a real payment gateway
                      alert("Real payment gateway integration would be implemented here.\nFor now, please use Test Payment.");
                    }}
                    disabled={processing}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: processing ? "#9ca3af" : "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: processing ? "not-allowed" : "pointer",
                      fontWeight: "600"
                    }}
                  >
                    Pay with Gateway
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div style={{ 
                  marginBottom: "20px", 
                  padding: "15px", 
                  backgroundColor: "#fef3c7", 
                  borderRadius: "8px",
                  border: "1px solid #fbbf24"
                }}>
                  <p style={{ 
                    fontSize: "0.9rem", 
                    color: "#92400e", 
                    marginBottom: "10px",
                    fontWeight: "600"
                  }}>
                    🧪 Test Payment Mode
                  </p>
                  <p style={{ 
                    fontSize: "0.85rem", 
                    color: "#78350f", 
                    margin: 0
                  }}>
                    This is a dummy payment for testing. No actual payment will be processed.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setShowTestPayment(false)}
                    disabled={processing}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: processing ? "#9ca3af" : "#6b7280",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: processing ? "not-allowed" : "pointer"
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handlePayment(true)}
                    disabled={processing}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: processing ? "#9ca3af" : "#f59e0b",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: processing ? "not-allowed" : "pointer",
                      fontWeight: "600"
                    }}
                  >
                    {processing ? "Processing..." : "Confirm Test Payment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function MyListingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserListings = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate("/loginpage");
          return;
        }

        setUser(currentUser);

        // Fetch ALL properties first (to show complete history)
        let { data, error } = await supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching properties:", error);
          // Try with user filter as fallback
          const { data: filteredData, error: filterError } = await supabase
            .from("properties")
            .select("*")
            .or(`user_id.eq.${currentUser.id},created_by.eq.${currentUser.id},contact_email.eq.${currentUser.email}`)
            .order("created_at", { ascending: false });
          
          if (filterError) throw filterError;
          data = filteredData;
        }

        // Filter properties by current user (if user_id/created_by/email match)
        // This ensures we show all properties uploaded by the user
        const userProperties = (data || []).filter(property => {
          return (
            property.user_id === currentUser.id ||
            property.created_by === currentUser.id ||
            property.contact_email === currentUser.email
          );
        });

        setProperties(userProperties);
      } catch (error) {
        console.error("Error loading listings:", error);
        // Fallback: try to show all properties if filtering fails
        try {
          const { data: allData } = await supabase
            .from("properties")
            .select("*")
            .order("created_at", { ascending: false });
          setProperties(allData || []);
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
          setProperties([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserListings();
  }, [navigate]);

  const handleDelete = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

      if (error) throw error;

      setProperties(prev => prev.filter(p => p.id !== propertyId));
      alert("Listing deleted successfully!");
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Failed to delete listing. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "100px", textAlign: "center" }}>
        <p>Loading your listings...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <h1>My Listings</h1>
            <Link to="/seller">
              <button style={{
                padding: "12px 24px",
                backgroundColor: "#1e40af",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "600"
              }}>
                + Add New Listing
              </button>
            </Link>
          </div>

          {properties.length === 0 ? (
            <div style={{
              backgroundColor: "#fff",
              padding: "60px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <p style={{ fontSize: "1.2rem", color: "#6b7280", marginBottom: "20px" }}>
                You haven't listed any properties yet.
              </p>
              <Link to="/seller">
                <button style={{
                  padding: "12px 24px",
                  backgroundColor: "#1e40af",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}>
                  List Your First Property
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "20px" }}>
              {properties.map((property) => (
                <div
                  key={property.id}
                  style={{
                    backgroundColor: "#fff",
                    padding: "20px",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    display: "flex",
                    gap: "20px"
                  }}
                >
                  {property.image_urls && property.image_urls[0] && (
                    <img
                      src={property.image_urls[0]}
                      alt={property.title}
                      style={{
                        width: "200px",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "8px"
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 10px 0" }}>{property.title}</h3>
                    <p style={{ color: "#6b7280", margin: "5px 0" }}>
                      {property.city || property.address}
                    </p>
                    <p style={{ color: "#1e40af", fontSize: "1.2rem", fontWeight: "bold", margin: "10px 0" }}>
                      ₹{property.price?.toLocaleString()}{property.property_listing_type !== "Sell" ? "/month" : ""}
                    </p>
                    <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
                      <span style={{
                        padding: "4px 12px",
                        backgroundColor: (property.status === "approved" || property.status === "accepted") ? "#d1fae5" : property.status === "pending" ? "#fef3c7" : "#fee2e2",
                        color: (property.status === "approved" || property.status === "accepted") ? "#065f46" : property.status === "pending" ? "#92400e" : "#991b1b",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "500"
                      }}>
                        {property.status || "pending"}
                      </span>
                      {property.payment_status === "paid" && (
                        <span style={{
                          padding: "4px 12px",
                          backgroundColor: "#dbeafe",
                          color: "#1e40af",
                          borderRadius: "20px",
                          fontSize: "0.85rem",
                          fontWeight: "500"
                        }}>
                          💳 Paid
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <Link to={`/properties/${property.id}`}>
                      <button style={{
                        padding: "8px 16px",
                        backgroundColor: "#1e40af",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}>
                        View
                      </button>
                    </Link>
                    {(property.status === "accepted" || property.status === "approved") && (
                      <PostNowButton property={property} />
                    )}
                    <button
                      onClick={() => handleDelete(property.id)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#dc2626",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


