import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPropertyById } from "./utils/properties";
import { supabase } from "./supabase";
import { ArrowLeft, MapPin, CheckCircle, ShieldCheck, Home, Car, Building, Users, Calendar, DollarSign, CalendarCheck, X, Clock, Phone, Mail } from "lucide-react";

function PropertyDetailsPage() {
  const { propertyId, id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    mobileNumber: "",
    date: "",
    time: "",
    email: ""
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user?.email) {
        setBookingForm(prev => ({ ...prev, email: user.email }));
      }
    });

    const loadProperty = async () => {
      setLoading(true);
      const propertyIdToUse = propertyId || id;
      
      if (!propertyIdToUse) {
        console.error("No property ID found in URL");
        setLoading(false);
        return;
      }

      console.log("Fetching property with ID:", propertyIdToUse);
      
      // Check if it's a UUID (contains hyphens) or a numeric ID
      const isUUID = propertyIdToUse.includes('-');
      const idToFetch = isUUID ? propertyIdToUse : parseInt(propertyIdToUse, 10);
      
      if (!isUUID && isNaN(idToFetch)) {
        console.error("Invalid property ID:", propertyIdToUse);
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPropertyById(idToFetch);
        console.log("Fetched property data:", data);
        setProperty(data);
      } catch (error) {
        console.error("Error loading property:", error);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    loadProperty();
  }, [propertyId, id]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError("");
    setBookingLoading(true);

    // Validation
    if (!bookingForm.mobileNumber || !bookingForm.date || !bookingForm.time || !bookingForm.email) {
      setBookingError("Please fill in all fields");
      setBookingLoading(false);
      return;
    }

    // Validate mobile number (basic validation)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(bookingForm.mobileNumber.replace(/\D/g, ""))) {
      setBookingError("Please enter a valid 10-digit mobile number");
      setBookingLoading(false);
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(`${bookingForm.date}T${bookingForm.time}`);
    const now = new Date();
    if (selectedDate < now) {
      setBookingError("Please select a future date and time");
      setBookingLoading(false);
      return;
    }

    try {
      // Insert appointment into Supabase
      const { data, error } = await supabase
        .from("appointments")
        .insert([
          {
            property_id: property.id,
            property_title: property.title,
            user_id: user?.id || null,
            user_email: bookingForm.email,
            mobile_number: bookingForm.mobileNumber,
            appointment_date: bookingForm.date,
            appointment_time: bookingForm.time,
            status: "pending",
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.error("Error creating appointment:", error);
        // If appointments table doesn't exist, try bookings table
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .insert([
            {
              property_id: property.id,
              property_title: property.title,
              user_id: user?.id || null,
              user_email: bookingForm.email,
              mobile_number: bookingForm.mobileNumber,
              appointment_date: bookingForm.date,
              appointment_time: bookingForm.time,
              status: "pending",
              created_at: new Date().toISOString()
            }
          ])
          .select();

        if (bookingError) {
          throw bookingError;
        }
      }

      setBookingSuccess(true);
      setBookingForm({ mobileNumber: "", date: "", time: "", email: "" });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error submitting appointment:", error);
      setBookingError(error.message || "Failed to book appointment. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingInputChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: "120px", textAlign: "center" }}>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    const propertyIdToUse = propertyId || id;
    return (
      <div style={{ padding: "120px 20px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ color: "#ef4444", marginBottom: "15px" }}>Property Not Found</h2>
        <p style={{ color: "#6b7280", marginBottom: "10px" }}>
          The property with ID <strong>{propertyIdToUse}</strong> could not be found.
        </p>
        <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "0.9rem" }}>
          This could mean the property doesn't exist in the database or there was an error loading it.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button 
            onClick={() => navigate("/properties")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#1e40af",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600"
            }}
          >
            Return to Properties
          </button>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            Retry
          </button>
        </div>
        <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f3f4f6", borderRadius: "8px", textAlign: "left" }}>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0 }}>
            <strong>Debug Info:</strong><br />
            Property ID from URL: {propertyIdToUse}<br />
            Parsed ID: {propertyIdToUse ? parseInt(propertyIdToUse, 10) : "N/A"}<br />
            Check the browser console (F12) for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "100px 20px 40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* BACK BUTTON */}
        <button 
          onClick={() => navigate(-1)} 
          style={{
            display: "flex", alignItems: "center", gap: "8px", background: "none",
            border: "none", color: "#1e40af", cursor: "pointer",
            fontWeight: "600", marginBottom: "20px", fontSize: "16px"
          }}
        >
          <ArrowLeft size={20} /> Back to Properties
        </button>

        {/* MAIN CONTENT */}
        <div style={{ 
          backgroundColor: "#fff", 
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
          overflow: "hidden"
        }}>
          
          {/* HEADER SECTION */}
          <div style={{ padding: "30px", borderBottom: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: 0, fontSize: "2.5rem", color: "#111827", marginBottom: "10px" }}>
                  {property.title}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
                  <p style={{ display: "flex", alignItems: "center", gap: "5px", color: "#6b7280", margin: 0 }}>
                    <MapPin size={18} /> {property.address || property.location}
                  </p>
                  {property.verified && (
                    <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.9rem", fontWeight: "bold" }}>
                      <ShieldCheck size={18} /> Verified Property
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ color: "#1e40af", fontSize: "2.5rem", margin: 0, fontWeight: "bold" }}>
                  ₹{property.price.toLocaleString()}
                </h2>
                <p style={{ color: "#6b7280", margin: "5px 0 0 0" }}>
                  {property.type === 'sale' ? 'For Sale' : property.type === 'rent' ? '/month' : '/month'}
                </p>
              </div>
            </div>
          </div>

          {/* PHOTO GALLERY */}
          {property.photos && property.photos.length > 0 && (
            <div style={{ padding: "30px", borderBottom: "1px solid #eee" }}>
              <div style={{ marginBottom: "15px" }}>
                <h3 style={{ margin: "0 0 15px 0", fontSize: "1.5rem" }}>Photos</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: property.photos.length > 1 ? "2fr 1fr" : "1fr", gap: "10px" }}>
                <div>
                  <img 
                    src={property.photos[selectedImage] || property.img} 
                    alt={property.title}
                    style={{ 
                      width: "100%", 
                      height: "500px", 
                      objectFit: "cover", 
                      borderRadius: "12px",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      setFullImageUrl(property.photos[selectedImage] || property.img);
                      setShowFullImage(true);
                    }}
                  />
                  {property.photos.length > 1 && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "center" }}>
                      <button
                        onClick={() => setSelectedImage((selectedImage - 1 + property.photos.length) % property.photos.length)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#1e40af",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        ← Previous
                      </button>
                      <span style={{ display: "flex", alignItems: "center", color: "#6b7280" }}>
                        {selectedImage + 1} / {property.photos.length}
                      </span>
                      <button
                        onClick={() => setSelectedImage((selectedImage + 1) % property.photos.length)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#1e40af",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                  <p style={{ textAlign: "center", marginTop: "10px", color: "#6b7280", fontSize: "0.9rem" }}>
                    Click image to view full size
                  </p>
                </div>
                {property.photos.length > 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {property.photos.slice(0, 4).map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`${property.title} ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          cursor: "pointer",
                          border: selectedImage === index ? "3px solid #1e40af" : "3px solid transparent",
                          opacity: selectedImage === index ? 1 : 0.7
                        }}
                        onClick={() => setSelectedImage(index)}
                      />
                    ))}
                    {property.photos.length > 4 && (
                      <div style={{
                        width: "100%",
                        height: "120px",
                        borderRadius: "8px",
                        backgroundColor: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#6b7280",
                        fontWeight: "bold"
                      }}>
                        +{property.photos.length - 4} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DETAILS GRID */}
          <div style={{ padding: "30px", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px" }}>
            
            {/* LEFT COLUMN - MAIN DETAILS */}
            <div>
              {/* PROPERTY SPECIFICATIONS */}
              <div style={{ marginBottom: "30px" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "20px", color: "#111827" }}>Property Details</h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(2, 1fr)", 
                  gap: "15px" 
                }}>
                  <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <Home size={18} color="#1e40af" />
                      <strong>Bedrooms</strong>
                    </div>
                    <p style={{ margin: 0, color: "#6b7280" }}>{property.bedrooms}</p>
                  </div>
                  <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <Home size={18} color="#1e40af" />
                      <strong>Bathrooms</strong>
                    </div>
                    <p style={{ margin: 0, color: "#6b7280" }}>{property.bathrooms || "N/A"}</p>
                  </div>
                  {property.area && (
                    <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                        <Building size={18} color="#1e40af" />
                        <strong>Area</strong>
                      </div>
                      <p style={{ margin: 0, color: "#6b7280" }}>{property.area}</p>
                    </div>
                  )}
                  <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <Building size={18} color="#1e40af" />
                      <strong>Listing Type</strong>
                    </div>
                    <p style={{ margin: 0, color: "#6b7280", textTransform: "capitalize" }}>{property.type}</p>
                  </div>
                  <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <Home size={18} color="#1e40af" />
                      <strong>Furnishing</strong>
                    </div>
                    <p style={{ margin: 0, color: "#6b7280", textTransform: "capitalize" }}>
                      {property.furnished === 'fully' ? 'Fully Furnished' : 
                       property.furnished === 'semi' ? 'Semi Furnished' : 
                       property.furnished === 'non' ? 'Non Furnished' : 
                       property.furnished}
                    </p>
                  </div>
                  <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <Users size={18} color="#1e40af" />
                      <strong>Category</strong>
                    </div>
                    <p style={{ margin: 0, color: "#6b7280", textTransform: "capitalize" }}>
                      {property.bachelorFriendly === 'family' ? 'Family' :
                       property.bachelorFriendly === 'boys' ? 'Boys' :
                       property.bachelorFriendly === 'girls' ? 'Girls' :
                       property.bachelorFriendly === 'shared' ? 'Shared' :
                       property.bachelorFriendly}
                    </p>
                  </div>
                </div>
              </div>

              {/* AMENITIES */}
              <div style={{ marginBottom: "30px" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "20px", color: "#111827" }}>Amenities</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                  <div style={{ 
                    padding: "12px 20px", 
                    backgroundColor: property.balcony ? "#dbeafe" : "#f3f4f6",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <CheckCircle size={18} color={property.balcony ? "#1e40af" : "#9ca3af"} />
                    <span style={{ color: property.balcony ? "#1e40af" : "#6b7280", fontWeight: property.balcony ? "600" : "400" }}>
                      Balcony {property.balcony ? "✓" : "✗"}
                    </span>
                  </div>
                  <div style={{ 
                    padding: "12px 20px", 
                    backgroundColor: property.parking ? "#dbeafe" : "#f3f4f6",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <Car size={18} color={property.parking ? "#1e40af" : "#9ca3af"} />
                    <span style={{ color: property.parking ? "#1e40af" : "#6b7280", fontWeight: property.parking ? "600" : "400" }}>
                      Parking {property.parking ? "✓" : "✗"}
                    </span>
                  </div>
                  {property.parking && property.parkingFee > 0 && (
                    <div style={{ 
                      padding: "12px 20px", 
                      backgroundColor: "#dbeafe",
                      borderRadius: "8px"
                    }}>
                      <span style={{ color: "#1e40af", fontWeight: "600" }}>
                        Parking Fee: ₹{property.parkingFee}/month
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              {property.description && (
                <div style={{ marginBottom: "30px" }}>
                  <h3 style={{ fontSize: "1.5rem", marginBottom: "15px", color: "#111827" }}>Description</h3>
                  <p style={{ color: "#6b7280", lineHeight: "1.6", fontSize: "1rem" }}>
                    {property.description}
                  </p>
                </div>
              )}

              {/* PRICING DETAILS */}
              <div style={{ marginBottom: "30px" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "20px", color: "#111827" }}>Pricing Details</h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(2, 1fr)", 
                  gap: "15px" 
                }}>
                  <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <DollarSign size={18} color="#1e40af" />
                      <strong>Rent/Price</strong>
                    </div>
                    <p style={{ margin: 0, color: "#1e40af", fontSize: "1.2rem", fontWeight: "bold" }}>
                      ₹{property.price.toLocaleString()}{property.type === 'sale' ? '' : '/month'}
                    </p>
                  </div>
                  {property.deposit > 0 && (
                    <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                        <DollarSign size={18} color="#1e40af" />
                        <strong>Security Deposit</strong>
                      </div>
                      <p style={{ margin: 0, color: "#6b7280", fontSize: "1.1rem" }}>
                        ₹{property.deposit.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {property.minDuration && (
                    <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                        <Calendar size={18} color="#1e40af" />
                        <strong>Minimum Duration</strong>
                      </div>
                      <p style={{ margin: 0, color: "#6b7280" }}>{property.minDuration}</p>
                    </div>
                  )}
                  <div style={{ padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <Building size={18} color="#1e40af" />
                      <strong>Owner Type</strong>
                    </div>
                    <p style={{ margin: 0, color: "#6b7280", textTransform: "capitalize" }}>{property.ownerType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - BOOK APPOINTMENT & QUICK INFO */}
            <div>
              <div style={{ 
                border: "1px solid #e5e7eb", 
                borderRadius: "12px", 
                padding: "25px",
                position: "sticky",
                top: "100px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                  <CalendarCheck size={24} color="#1e40af" />
                  <h3 style={{ fontSize: "1.3rem", margin: 0, color: "#111827" }}>Book Appointment</h3>
                </div>
                
                <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: "25px", lineHeight: "1.6" }}>
                  Schedule a visit to view this property. Our team will coordinate with you to arrange a convenient time.
                </p>

                <button 
                  onClick={() => setShowBookingModal(true)}
                  style={{
                    width: "100%",
                    padding: "18px",
                    backgroundColor: "#1e40af",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "background-color 0.3s",
                    boxShadow: "0 4px 6px rgba(30, 64, 175, 0.2)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#1e40af"}
                >
                  Book Appointment
                </button>

                <div style={{ 
                  marginTop: "25px", 
                  paddingTop: "25px", 
                  borderTop: "1px solid #e5e7eb" 
                }}>
                  <h4 style={{ fontSize: "1rem", marginBottom: "15px", color: "#111827" }}>Quick Summary</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6b7280" }}>Type:</span>
                      <span style={{ fontWeight: "600", textTransform: "capitalize" }}>{property.type}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6b7280" }}>BHK:</span>
                      <span style={{ fontWeight: "600" }}>{property.bedrooms}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6b7280" }}>Furnishing:</span>
                      <span style={{ fontWeight: "600", textTransform: "capitalize" }}>
                        {property.furnished === 'fully' ? 'Fully' : 
                         property.furnished === 'semi' ? 'Semi' : 
                         property.furnished === 'non' ? 'Non' : property.furnished}
                      </span>
                    </div>
                    {property.balcony && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#6b7280" }}>Balcony:</span>
                        <span style={{ fontWeight: "600", color: "#059669" }}>Yes</span>
                      </div>
                    )}
                    {property.parking && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#6b7280" }}>Parking:</span>
                        <span style={{ fontWeight: "600", color: "#059669" }}>Yes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => !bookingLoading && setShowBookingModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "30px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#111827" }}>Book Appointment</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                disabled={bookingLoading}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            {property && (
              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                <p style={{ margin: "0 0 5px 0", color: "#6b7280", fontSize: "0.9rem" }}>Property:</p>
                <p style={{ margin: 0, fontWeight: "600", color: "#111827" }}>{property.title}</p>
                <p style={{ margin: "5px 0 0 0", color: "#6b7280", fontSize: "0.9rem" }}>{property.location}</p>
              </div>
            )}

            {bookingSuccess ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "15px" }}>✅</div>
                <h3 style={{ color: "#059669", marginBottom: "10px" }}>Appointment Booked!</h3>
                <p style={{ color: "#6b7280" }}>Your appointment request has been sent to the admin. You will be contacted shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit}>
                {bookingError && (
                  <div style={{
                    padding: "12px",
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontSize: "0.9rem"
                  }}>
                    {bookingError}
                  </div>
                )}

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "#374151", fontWeight: "500" }}>
                    <Mail size={16} style={{ display: "inline", marginRight: "5px", verticalAlign: "middle" }} />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={bookingForm.email}
                    onChange={handleBookingInputChange}
                    placeholder="Enter email address"
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      boxSizing: "border-box"
                    }}
                    disabled={bookingLoading}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "#374151", fontWeight: "500" }}>
                    <Phone size={16} style={{ display: "inline", marginRight: "5px", verticalAlign: "middle" }} />
                    Alternative Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={bookingForm.mobileNumber}
                    onChange={handleBookingInputChange}
                    placeholder="Enter 10-digit mobile number"
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      boxSizing: "border-box"
                    }}
                    disabled={bookingLoading}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "#374151", fontWeight: "500" }}>
                    <Calendar size={16} style={{ display: "inline", marginRight: "5px", verticalAlign: "middle" }} />
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={bookingForm.date}
                    onChange={handleBookingInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      boxSizing: "border-box"
                    }}
                    disabled={bookingLoading}
                  />
                </div>

                <div style={{ marginBottom: "25px" }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "#374151", fontWeight: "500" }}>
                    <Clock size={16} style={{ display: "inline", marginRight: "5px", verticalAlign: "middle" }} />
                    Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={bookingForm.time}
                    onChange={handleBookingInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      boxSizing: "border-box"
                    }}
                    disabled={bookingLoading}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    disabled={bookingLoading}
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "500",
                      cursor: bookingLoading ? "not-allowed" : "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: bookingLoading ? "#9ca3af" : "#1e40af",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: bookingLoading ? "not-allowed" : "pointer",
                      transition: "background-color 0.3s"
                    }}
                  >
                    {bookingLoading ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Full Image Modal */}
      {showFullImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setShowFullImage(false)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={fullImageUrl}
              alt={property?.title}
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: "8px"
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowFullImage(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                fontSize: "24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#000"
              }}
            >
              ×
            </button>
            {property?.photos && property.photos.length > 1 && (
              <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "10px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (selectedImage - 1 + property.photos.length) % property.photos.length;
                    setSelectedImage(newIndex);
                    setFullImageUrl(property.photos[newIndex]);
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#000",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px"
                  }}
                >
                  ← Previous
                </button>
                <span style={{ display: "flex", alignItems: "center", color: "#fff", padding: "0 10px" }}>
                  {selectedImage + 1} / {property.photos.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (selectedImage + 1) % property.photos.length;
                    setSelectedImage(newIndex);
                    setFullImageUrl(property.photos[newIndex]);
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    color: "#000",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px"
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyDetailsPage;