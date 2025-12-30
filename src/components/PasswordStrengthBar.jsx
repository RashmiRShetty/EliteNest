import React from "react";

function getStrength(password) {
  let score = 0;
  if (!password) return { label: "Too short", score: 0 };
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", score };
  if (score === 2) return { label: "Medium", score };
  return { label: "Strong", score };
}

export default function PasswordStrengthBar({ password }) {
  const { label, score } = getStrength(password);

  const colors = {
    0: "#f87171",
    1: "#f97316",
    2: "#eab308",
    3: "#22c55e",
    4: "#16a34a",
  };

  const activeColor = colors[score] || colors[0];

  const barContainer = {
    marginTop: "6px",
  };

  const bar = {
    height: "6px",
    borderRadius: "999px",
    backgroundColor: "#374151",
    overflow: "hidden",
  };

  const indicator = {
    height: "100%",
    width: `${(score / 4) * 100}%`,
    backgroundColor: activeColor,
    transition: "width 0.3s ease",
  };

  const labelStyle = {
    fontSize: "12px",
    marginTop: "4px",
    color: "#e5e7eb",
  };

  return (
    <div style={barContainer}>
      <div style={bar}>
        <div style={indicator} />
      </div>
      <div style={labelStyle}>Password strength: {label}</div>
    </div>
  );
}




