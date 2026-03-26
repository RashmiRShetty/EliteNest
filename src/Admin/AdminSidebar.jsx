import React from "react";

export default function Sidebar({ activeTab, setActiveTab, handleLogout }) {
  const items = [
    ["overview", "📊 Overview"],
    ["users", "👥 Users"],
    ["properties", "🏠 Properties"],
    ["sellers", "🛍️ Sellers"],
    ["leases", "📋 Leases"],
    ["rentals", "🔑 Rentals"],
    ["appointments", "📅 Appointments"],
    ["payments", "💰 Payments"],
    ["reminders", "🔔 Reminders"],
    ["feedback", "💬 Feedback"],
  ];

  return (
    <aside
      style={{
        width: 260,
        background: "#020617",
        color: "#e5e7eb",
        padding: "28px 20px",
        position: "fixed",
        height: "100vh",
        borderRight: "1px solid rgba(148, 163, 184, 0.35)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        boxShadow: "0 0 40px rgba(15, 23, 42, 0.9)",
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img
          src="/elite-nest-logo 1.png"
          alt="Elite Nest Logo"
          style={{
            width: 60,
            height: 60,
            borderRadius: "999px",
            objectFit: "cover",
            backgroundColor: "#020617",
          }}
        />
        <div>
          <div
            style={{
              fontSize: 15,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#9ca3af",
            }}
          >
            Elite Nest
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#6b7280",
            }}
          >
            Admin Console
          </div>
        </div>
      </div>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginTop: 18,
          flex: 1,
        }}
      >
        {items.map(([id, label]) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                backgroundColor: "#020617",
                color: isActive ? "#facc15" : "#e5e7eb",
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                textAlign: "left",
                borderLeft: isActive ? "3px solid #f97316" : "3px solid transparent",
                transition: "all 0.18s ease-out",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "#020617";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "#020617";
              }}
            >
              <span>{label}</span>
              {isActive && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "999px",
                    backgroundColor: "#facc15",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          cursor: "pointer",
          background: "transparent",
          color: "#fca5a5",
          border: "1px solid rgba(248, 113, 113, 0.6)",
          fontWeight: 600,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <span>⏏</span>
        <span>Logout</span>
      </button>
    </aside>
  );
}
