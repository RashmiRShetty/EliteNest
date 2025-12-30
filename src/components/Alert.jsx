import React from "react";

export default function Alert({ type = "info", message }) {
  if (!message) return null;

  const baseStyle = {
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "10px",
    textAlign: "left",
  };

  const variants = {
    info: {
      backgroundColor: "rgba(59,130,246,0.15)",
      color: "#bfdbfe",
      border: "1px solid rgba(59,130,246,0.4)",
    },
    success: {
      backgroundColor: "rgba(16,185,129,0.15)",
      color: "#bbf7d0",
      border: "1px solid rgba(16,185,129,0.4)",
    },
    error: {
      backgroundColor: "rgba(248,113,113,0.15)",
      color: "#fecaca",
      border: "1px solid rgba(248,113,113,0.4)",
    },
  };

  const style = { ...baseStyle, ...(variants[type] || variants.info) };

  return <div style={style}>{message}</div>;
}




