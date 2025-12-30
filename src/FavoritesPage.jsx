import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "./supabase";
import "./App.css";

export default function AppointmentsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate("/loginpage");
          return;
        }

        setUser(currentUser);

        // Try appointments table first, then bookings table
        let data = null;
        let error = null;

        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (appointmentsError) {
          // Try bookings table as fallback
          const { data: bookingsData, error: bookingsError } = await supabase
            .from("bookings")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false });

          if (bookingsError) {
            console.warn("Appointments/bookings table may not exist:", bookingsError);
            data = [];
          } else {
            data = bookingsData;
          }
        } else {
          data = appointmentsData;
        }

        setAppointments(data || []);
      } catch (error) {
        console.error("Error loading appointments:", error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [navigate]);

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      // Try appointments table first
      let error = null;
      const { error: appointmentsError } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (appointmentsError) {
        // Try bookings table
        const { error: bookingsError } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", appointmentId);

        if (bookingsError) throw bookingsError;
      }

      setAppointments(prev =>
        prev.map(apt => apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt)
      );
      alert("Appointment cancelled successfully!");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return { bg: "#fef3c7", color: "#92400e" };
      case "confirmed":
      case "accepted":
        return { bg: "#d1fae5", color: "#065f46" };
      case "cancelled":
      case "rejected":
        return { bg: "#fee2e2", color: "#991b1b" };
      default:
        return { bg: "#f3f4f6", color: "#374151" };
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "100px", textAlign: "center" }}>
        <p>Loading appointment history...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ marginBottom: "30px" }}>Booked Appointment History</h1>

          {appointments.length === 0 ? (
            <div style={{
              backgroundColor: "#fff",
              padding: "60px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <p style={{ fontSize: "1.2rem", color: "#6b7280", marginBottom: "20px" }}>
                You haven't booked any appointments yet.
              </p>
              <Link to="/properties">
                <button style={{
                  padding: "12px 24px",
                  backgroundColor: "#1e40af",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}>
                  Browse Properties
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "20px" }}>
              {appointments.map((appointment) => {
                const statusStyle = getStatusColor(appointment.status);
                const appointmentDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
                const isPast = appointmentDate < new Date();
                
                return (
                  <div
                    key={appointment.id}
                    style={{
                      backgroundColor: "#fff",
                      padding: "20px",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      borderLeft: `4px solid ${statusStyle.color}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: "0 0 10px 0", fontSize: "1.3rem" }}>
                          {appointment.property_title || "Property Appointment"}
                        </h3>
                        <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "500", color: "#374151" }}>📅 Date:</span>
                            <span style={{ color: "#6b7280" }}>
                              {appointmentDate.toLocaleDateString("en-US", { 
                                weekday: "long", 
                                year: "numeric", 
                                month: "long", 
                                day: "numeric" 
                              })}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "500", color: "#374151" }}>🕐 Time:</span>
                            <span style={{ color: "#6b7280" }}>
                              {appointmentDate.toLocaleTimeString("en-US", { 
                                hour: "2-digit", 
                                minute: "2-digit" 
                              })}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "500", color: "#374151" }}>📞 Mobile:</span>
                            <span style={{ color: "#6b7280" }}>{appointment.mobile_number}</span>
                          </div>
                          {appointment.property_id && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: "500", color: "#374151" }}>🏠 Property ID:</span>
                              <Link 
                                to={`/properties/${appointment.property_id}`}
                                style={{ color: "#1e40af", textDecoration: "none" }}
                              >
                                View Property
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                        <span style={{
                          padding: "6px 12px",
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          borderRadius: "20px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          textTransform: "capitalize"
                        }}>
                          {appointment.status || "pending"}
                        </span>
                        {isPast && (
                          <span style={{
                            padding: "4px 10px",
                            backgroundColor: "#f3f4f6",
                            color: "#6b7280",
                            borderRadius: "12px",
                            fontSize: "0.75rem"
                          }}>
                            Past
                          </span>
                        )}
                        {appointment.status !== "cancelled" && !isPast && (
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#dc2626",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.9rem"
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{
                      marginTop: "15px",
                      paddingTop: "15px",
                      borderTop: "1px solid #e5e7eb",
                      fontSize: "0.9rem",
                      color: "#6b7280"
                    }}>
                      Booked on: {new Date(appointment.created_at).toLocaleString("en-US")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

