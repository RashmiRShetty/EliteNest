import React from "react";

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

export default function AdminProperties({ properties, fetchProperties, setSelectedProperty, setShowModal, updateStatus }) {
  const [selectedPropertyLocal, setSelectedPropertyLocal] = React.useState(null);
  const [showModalLocal, setShowModalLocal] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

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
  
  const filteredByStatus = filterStatus === "all" 
    ? properties 
    : properties.filter(p => p.status === filterStatus);

  const filteredProperties = filteredByStatus.filter((p) => {
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
  
  const displayedProperties = filteredProperties;

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

  const handleEdit = (property) => {
    setShowModalLocal(false);
    setSelectedProperty(property);
    setShowModal(true);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={fetchProperties} style={{
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
        }}>🏠 Load Properties</button>
        
        {properties.length > 0 && (
          <>
            <span style={{
              background: "rgba(102, 126, 234, 0.15)",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "600",
              border: "1px solid rgba(102, 126, 234, 0.3)"
            }}>
              Total: {properties.length} properties
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
                onClick={() => { setFilterStatus("all"); }}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: filterStatus === "all" ? "linear-gradient(135deg, #667eea, #764ba2)" : "transparent",
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
                }}
                placeholder="Search properties..."
                style={{
                  padding: "10px 14px 10px 34px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  fontSize: "0.95rem",
                  minWidth: 220,
                }}
              />
            </div>
          </>
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        {properties.length === 0 ? (
          <div style={{
            background: "rgba(102, 126, 234, 0.1)",
            border: "2px dashed rgba(102, 126, 234, 0.3)",
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
            }}>No properties loaded</p>
            <p style={{
              color: "#a0aec0",
              fontSize: "1rem",
              margin: 0
            }}>Click "Load Properties" button to fetch properties from database</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div style={{
            background: "rgba(102, 126, 234, 0.1)",
            border: "2px dashed rgba(102, 126, 234, 0.3)",
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
            }}>No properties found</p>
            <p style={{
              color: "#a0aec0",
              fontSize: "1rem",
              margin: 0
            }}>No properties match the selected filter: {filterStatus}</p>
          </div>
        ) : (
          <>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24, 
              marginBottom: 20 
            }}>
              {displayedProperties.map((p) => {
                const imageUrl = (p.image_urls && p.image_urls.length > 0) 
                  ? p.image_urls[0] 
                  : (p.photos && p.photos.length > 0) 
                    ? p.photos[0] 
                    : "https://via.placeholder.com/300x200?text=No+Image";
                
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedPropertyLocal(p); setShowModalLocal(true); }}
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
                      
                      {/* Expiry Reminder for Admin */}
                      {(() => {
                        const remainingDays = getExpiryRemainingDays(p);
                        if (remainingDays !== null && remainingDays <= 3 && remainingDays > 0) {
                          return (
                            <div style={{ 
                              padding: '6px 10px', 
                              backgroundColor: 'rgba(245, 158, 11, 0.2)', 
                              borderRadius: '6px', 
                              border: '1px solid #f59e0b',
                              color: '#fbbf24',
                              fontSize: '0.75rem',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '700'
                            }}>
                              ⚠️ Nearing Expiry: {remainingDays}d left
                            </div>
                          );
                        }
                        return null;
                      })()}

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

      {showModalLocal && selectedPropertyLocal && (
        <PropertyModal
          property={selectedPropertyLocal}
          onClose={() => setShowModalLocal(false)}
        />
      )}
    </div>
  );
}
