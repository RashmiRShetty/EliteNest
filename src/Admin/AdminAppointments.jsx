import React from "react";
import { supabase } from "../admin-supabase.js";
import emailjs from "@emailjs/browser";
import { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } from "./AdminEmailConfig";

export default function AdminAppointments({ appointments, fetchAppointments, loading, fetchError, appointmentsCount }) {
  const [filter, setFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState(null);
  const [selectedDate, setSelectedDate] = React.useState("");
  const [selectedTime, setSelectedTime] = React.useState("");
  
  const filteredByStatus = filter === "confirmed" 
    ? appointments.filter(apt => apt.status === "confirmed" || apt.status === "accepted")
    : filter === "pending"
    ? appointments.filter(apt => apt.status === "pending")
    : appointments;

  const filteredAppointments = filteredByStatus.filter((apt) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const userName = (apt.user_name || "").toLowerCase();
    const email = (apt.user_email || apt.email || "").toLowerCase();
    const propertyTitle = (apt.properties?.title || apt.property_title || "").toLowerCase();
    const city = (apt.city || "").toLowerCase();
    return (
      userName.includes(query) ||
      email.includes(query) ||
      propertyTitle.includes(query) ||
      city.includes(query)
    );
  });

  const displayedAppointments = filteredAppointments;

  const openDatePicker = (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(appointment.appointment_date || "");
    setSelectedTime(appointment.appointment_time || "");
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
    setSelectedAppointment(null);
    setSelectedDate("");
    setSelectedTime("");
  };

  const confirmWithDate = () => {
    if (!selectedDate) {
      alert("Please select a date for the appointment.");
      return;
    }
    
    const selectedDateTime = {
      date: selectedDate,
      time: selectedTime || "10:00:00"
    };
    
    updateAppointmentStatus(selectedAppointment.id, "confirmed", selectedDateTime);
    closeDatePicker();
  };

  const updateAppointmentStatus = async (appointmentId, newStatus, selectedDate = null) => {
    try {
      let rejectionReason = null;
      if (newStatus === "rejected") {
        rejectionReason = window.prompt("Please provide a reason for rejecting this appointment:");
        if (rejectionReason === null) return;
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

      const { error: bookingsError } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", appointmentId);

      if (bookingsError) throw bookingsError;

      if (["confirmed", "accepted", "rejected", "cancelled"].includes(newStatus)) {
        try {
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
                    const { data: authUsers } = await supabase.auth.admin.listUsers();
                    const foundUser = authUsers?.users?.find(u => u.email === aptData.user_email);
                    if (foundUser) userId = foundUser.id;
                  }
                } catch (err) {
                  console.warn("Could not find user by email for appointment notification:", err);
                }
             }

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

             if (["confirmed", "accepted", "rejected"].includes(newStatus) && (aptData.user_email || aptData.email)) {
               try {
                 const userEmail = aptData.user_email || aptData.email;
                 const userName = aptData.user_name || "Valued Customer";
                 const propertyTitle = aptData.properties?.title || aptData.property_title || "Property";
                 
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
        <button onClick={() => { fetchAppointments(); }} style={{
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
            onClick={() => { setFilter("all"); }}
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
            onClick={() => { setFilter("confirmed"); }}
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
            Confirmed
          </button>
          <button 
            onClick={() => { setFilter("pending"); }}
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
            Pending
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
            placeholder="Search appointments..."
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
      </div>

      {fetchError && (
        <div style={{ marginBottom: 16, color: "#fecaca" }}>
          Error: {fetchError}
        </div>
      )}

      {appointments.length === 0 ? (
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
          }}>No bookings loaded</p>
          <p style={{
            color: "#a0aec0",
            fontSize: "1rem",
            margin: 0
          }}>Click "Load Appointments" button to fetch bookings from database</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
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
          }}>No bookings found</p>
          <p style={{
            color: "#a0aec0",
            fontSize: "1rem",
            margin: 0
          }}>No bookings match the selected filter: {filter}</p>
        </div>
      ) : (
        <>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20 
          }}>
            {displayedAppointments.map((apt) => (
              <div key={apt.id} style={{
                background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                borderRadius: 16,
                padding: 18,
                color: "#e5e7eb",
                border: "1px solid rgba(148, 163, 184, 0.4)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>
                    {apt.property_title || apt.properties?.title || "Unknown Property"}
                  </div>
                  <div style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: apt.status === "confirmed" || apt.status === "accepted" ? "rgba(16, 185, 129, 0.2)" : apt.status === "pending" ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)",
                    color: apt.status === "confirmed" || apt.status === "accepted" ? "#6ee7b7" : apt.status === "pending" ? "#fcd34d" : "#fecaca",
                    fontSize: "0.75rem",
                    fontWeight: 600
                  }}>
                    {apt.status ? apt.status.toUpperCase() : "UNKNOWN"}
                  </div>
                </div>
                <div style={{ fontSize: "0.9rem", marginBottom: 6 }}>
                  <span style={{ color: "#9ca3af" }}>Customer:</span> {apt.user_name || apt.name || "N/A"}
                </div>
                <div style={{ fontSize: "0.9rem", marginBottom: 6 }}>
                  <span style={{ color: "#9ca3af" }}>Email:</span> {apt.user_email || apt.email || "N/A"}
                </div>
                <div style={{ fontSize: "0.9rem", marginBottom: 6 }}>
                  <span style={{ color: "#9ca3af" }}>Phone:</span> {apt.mobile_number || "N/A"}
                </div>
                
                {apt.proposed_dates && apt.proposed_dates.length > 0 && (
                  <div style={{ fontSize: "0.9rem", marginBottom: 6 }}>
                    <span style={{ color: "#9ca3af" }}>User's Preferred Dates:</span>
                    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                      {apt.proposed_dates.map((pd, idx) => (
                        <div key={idx} style={{
                          padding: "2px 6px",
                          background: "rgba(102, 126, 234, 0.1)",
                          borderRadius: 4,
                          fontSize: "0.8rem",
                          color: "#a5b4fc"
                        }}>
                          📅 {pd.date}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ fontSize: "0.9rem", marginBottom: 12 }}>
                  <span style={{ color: "#9ca3af" }}>Scheduled Date:</span> {apt.appointment_date || "N/A"}{" "}
                  <span style={{ color: "#9ca3af" }}>Time:</span> {apt.appointment_time || "N/A"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => openDatePicker(apt)}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 999,
                      border: "none",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.85rem"
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus(apt.id, "rejected")}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 999,
                      border: "none",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.85rem"
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 0 }} />
        </>
      )}

      {showDatePicker && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
            borderRadius: 16,
            padding: 24,
            width: "90%",
            maxWidth: 400,
            border: "1px solid rgba(148, 163, 184, 0.4)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)"
          }}>
            <h3 style={{
              color: "#fff",
              margin: "0 0 20px 0",
              fontSize: "1.3rem",
              fontWeight: "600"
            }}>
              Schedule Appointment
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block",
                color: "#9ca3af",
                marginBottom: 8,
                fontSize: "0.9rem",
                fontWeight: "500"
              }}>
                Property:
              </label>
              <div style={{
                color: "#fff",
                fontSize: "1rem",
                fontWeight: "600"
              }}>
                {selectedAppointment?.property_title || selectedAppointment?.properties?.title || "Unknown Property"}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block",
                color: "#9ca3af",
                marginBottom: 8,
                fontSize: "0.9rem",
                fontWeight: "500"
              }}>
                Customer:
              </label>
              <div style={{
                color: "#fff",
                fontSize: "1rem"
              }}>
                {selectedAppointment?.user_name || selectedAppointment?.name || "N/A"}
              </div>
            </div>

            {selectedAppointment?.proposed_dates && selectedAppointment.proposed_dates.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: "block",
                  color: "#9ca3af",
                  marginBottom: 8,
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}>
                  User's Preferred Dates:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedAppointment.proposed_dates.map((pd, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDate(pd.date);
                        setSelectedTime(pd.time || "10:00");
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: selectedDate === pd.date && (selectedTime === pd.time || (!pd.time && selectedTime === "10:00"))
                          ? "2px solid #10b981" 
                          : "1px solid rgba(148, 163, 184, 0.4)",
                        background: selectedDate === pd.date && (selectedTime === pd.time || (!pd.time && selectedTime === "10:00"))
                          ? "rgba(16, 185, 129, 0.1)" 
                          : "rgba(15, 23, 42, 0.9)",
                        color: selectedDate === pd.date && (selectedTime === pd.time || (!pd.time && selectedTime === "10:00")) ? "#10b981" : "#fff",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.3s",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>📅 {pd.date} {pd.time ? `at 🕒 ${pd.time}` : ""}</span>
                      {(selectedDate === pd.date && (selectedTime === pd.time || (!pd.time && selectedTime === "10:00"))) && "✓"}
                    </button>
                  ))}
                </div>
                <div style={{
                  marginTop: 8,
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  fontStyle: "italic"
                }}>
                  Click on a date to select it, or choose a custom date below
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                color: "#9ca3af",
                marginBottom: 8,
                fontSize: "0.9rem",
                fontWeight: "500"
              }}>
                {selectedAppointment?.proposed_dates && selectedAppointment.proposed_dates.length > 0 
                  ? "Or Select Custom Date:" 
                  : "Select Date:"}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(148, 163, 184, 0.4)",
                  background: "rgba(15, 23, 42, 0.9)",
                  color: "#fff",
                  fontSize: "0.95rem"
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: "block",
                color: "#9ca3af",
                marginBottom: 8,
                fontSize: "0.9rem",
                fontWeight: "500"
              }}>
                Select Time:
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(148, 163, 184, 0.4)",
                  background: "rgba(15, 23, 42, 0.9)",
                  color: "#fff",
                  fontSize: "0.95rem"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={confirmWithDate}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  transition: "all 0.3s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 4px 15px rgba(16, 185, 129, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                Confirm & Send
              </button>
              <button
                onClick={closeDatePicker}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: 8,
                  border: "1px solid rgba(148, 163, 184, 0.4)",
                  background: "transparent",
                  color: "#9ca3af",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  transition: "all 0.3s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(148, 163, 184, 0.1)";
                  e.target.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#9ca3af";
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
