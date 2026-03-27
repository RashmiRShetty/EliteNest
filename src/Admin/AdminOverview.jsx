import React from "react";
import { supabase } from "../admin-supabase.js";

export default function Overview() {
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
      const [usersRes, propertiesRes, pendingPropsRes, bookingsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("properties").select("id", { count: "exact" }),
        supabase.from("properties").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("bookings").select("id", { count: "exact" })
      ]);

      const totalUsers = usersRes.error ? 0 : (usersRes.count || 0);
      const totalProperties = propertiesRes.error ? 0 : (propertiesRes.count || 0);
      const pendingProperties = pendingPropsRes.error ? 0 : (pendingPropsRes.count || 0);
      const totalAppointments = bookingsRes.error ? 0 : (bookingsRes.count || 0);

      console.log("Overview stats:", { totalUsers, totalProperties, pendingProperties, totalAppointments });

      setOverviewData({
        totalUsers,
        totalProperties,
        totalAppointments,
        pendingProperties
      });
    } catch (error) {
      console.error("Error fetching overview data:", error);
      setOverviewData(prev => ({ ...prev, totalAppointments: 0 }));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOverviewData();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <div style={{
      background: `linear-gradient(135deg, rgba(20, 25, 50, 0.8) 0%, rgba(25, 35, 60, 0.8) 100%)`,
      border: `2px solid ${color}40`,
      borderRadius: 20,
      padding: 32,
      flex: 1,
      minWidth: "220px",
      textAlign: "center",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
      boxShadow: `0 15px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
      position: "relative",
      overflow: "hidden",
      backdropFilter: "blur(10px)"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = `0 30px 70px ${color}30, inset 0 1px 0 rgba(255, 255, 255, 0.2)`;
      e.currentTarget.style.transform = "translateY(-15px) scale(1.08)";
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.background = `linear-gradient(135deg, rgba(30, 35, 60, 0.9) 0%, rgba(35, 45, 70, 0.9) 100%)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = `0 15px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)`;
      e.currentTarget.style.transform = "translateY(0) scale(1)";
      e.currentTarget.style.borderColor = `${color}40`;
      e.currentTarget.style.background = `linear-gradient(135deg, rgba(20, 25, 50, 0.8) 0%, rgba(25, 35, 60, 0.8) 100%)`;
    }}>
      <div style={{
        position: "absolute",
        top: "-50%",
        left: "-50%",
        width: "200%",
        height: "200%",
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        animation: "pulse 3s ease-in-out infinite",
        pointerEvents: "none"
      }}></div>

      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: "52px", marginBottom: 20, display: "inline-block", filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))", animation: "float 3s ease-in-out infinite" }}>{icon}</div>
        <div style={{ color: "#a0aec0", fontSize: "0.95rem", marginBottom: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>{title}</div>
        <div style={{ color: color, fontSize: "48px", fontWeight: "900", textShadow: `0 2px 15px ${color}60`, lineHeight: "1" }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0e27 0%, #1a1a3e 50%, #0f0f23 100%)",
      padding: "50px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)",
        borderRadius: "50%",
        top: "-100px",
        left: "-100px",
        pointerEvents: "none"
      }}></div>
      <div style={{
        position: "absolute",
        width: "300px",
        height: "300px",
        background: "radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)",
        borderRadius: "50%",
        bottom: "-50px",
        right: "-50px",
        pointerEvents: "none"
      }}></div>

      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(20, 25, 50, 0.9) 0%, rgba(25, 30, 60, 0.9) 100%)",
          padding: "50px 40px",
          borderRadius: 24,
          color: "#fff",
          marginBottom: 40,
          boxShadow: "0 30px 100px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(30px)",
          border: "1px solid rgba(102, 126, 234, 0.2)",
          animation: "slideDown 0.6s ease-out"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "30px"
          }}>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <div style={{ fontSize: "3.2rem", marginBottom: "16px", fontWeight: "900" }}>📊</div>
              <h2 style={{ color: "#fff", margin: "0 0 12px 0", fontSize: "2.8rem", fontWeight: "900", background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Dashboard Overview</h2>
              <p style={{ color: "#b0c4de", fontSize: "1.1rem", margin: "0", lineHeight: "1.6" }}>Real-time insights into your platform's performance and key metrics</p>
            </div>
            <button
              onClick={fetchOverviewData}
              disabled={loading}
              style={{
                padding: "14px 32px",
                backgroundColor: loading ? "#4b5563" : "linear-gradient(135deg, #667eea, #764ba2)",
                backgroundImage: !loading ? "linear-gradient(135deg, #667eea, #764ba2)" : undefined,
                color: "#fff",
                border: "none",
                borderRadius: 12,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "1.05rem",
                fontWeight: "700",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: loading ? "0 4px 15px rgba(75, 85, 99, 0.4)" : "0 8px 25px rgba(102, 126, 234, 0.5)",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(-3px) scale(1.05)";
                  e.target.style.boxShadow = "0 15px 40px rgba(102, 126, 234, 0.7)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow = loading ? "0 4px 15px rgba(75, 85, 99, 0.4)" : "0 8px 25px rgba(102, 126, 234, 0.5)";
              }}
            >
              {loading ? "⏳ Refreshing..." : "🔄 Refresh Stats"}
            </button>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 32,
          marginBottom: 40
        }}>
          <StatCard title="Total Users" value={overviewData.totalUsers} icon="👥" color="#667eea" />
          <StatCard title="Total Properties" value={overviewData.totalProperties} icon="🏠" color="#764ba2" />
          <StatCard title="Pending Properties" value={overviewData.pendingProperties} icon="⏳" color="#f59e0b" />
          <StatCard title="Total Appointments" value={overviewData.totalAppointments} icon="📅" color="#ec4899" />
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
          marginTop: 40
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
            border: "1px solid rgba(102, 126, 234, 0.3)",
            borderRadius: 16,
            padding: 24,
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 15px 40px rgba(102, 126, 234, 0.2)";
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.3)";
          }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>📈</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#fff", fontSize: "1.2rem", fontWeight: "700" }}>Platform Growth</h3>
            <p style={{ margin: 0, color: "#b0c4de", fontSize: "0.95rem" }}>Track your platform metrics in real-time</p>
          </div>

          <div style={{
            background: "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)",
            border: "1px solid rgba(236, 72, 153, 0.3)",
            borderRadius: 16,
            padding: 24,
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 15px 40px rgba(236, 72, 153, 0.2)";
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.borderColor = "rgba(236, 72, 153, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "rgba(236, 72, 153, 0.3)";
          }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>🎯</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#fff", fontSize: "1.2rem", fontWeight: "700" }}>Active Listings</h3>
            <p style={{ margin: 0, color: "#b0c4de", fontSize: "0.95rem" }}>Manage and approve property listings</p>
          </div>

          <div style={{
            background: "linear-gradient(135deg, rgba(118, 75, 162, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)",
            border: "1px solid rgba(118, 75, 162, 0.3)",
            borderRadius: 16,
            padding: 24,
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 15px 40px rgba(118, 75, 162, 0.2)";
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.borderColor = "rgba(118, 75, 162, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "rgba(118, 75, 162, 0.3)";
          }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>💼</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#fff", fontSize: "1.2rem", fontWeight: "700" }}>User Management</h3>
            <p style={{ margin: 0, color: "#b0c4de", fontSize: "0.95rem" }}>Monitor and manage user accounts</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.2;
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}

