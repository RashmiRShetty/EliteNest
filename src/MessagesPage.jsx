import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import "./App.css";

export default function MessagesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate("/loginpage");
          return;
        }

        setUser(currentUser);

        // Fetch messages from messages table
        // Note: You may need to create a 'messages' table
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Messages table may not exist:", error);
          setMessages([]);
        } else {
          setMessages(data || []);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ padding: "100px", textAlign: "center" }}>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h1 style={{ marginBottom: "30px" }}>Messages</h1>

          {messages.length === 0 ? (
            <div style={{
              backgroundColor: "#fff",
              padding: "60px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <p style={{ fontSize: "1.2rem", color: "#6b7280", marginBottom: "20px" }}>
                No messages yet.
              </p>
              <p style={{ color: "#9ca3af" }}>
                When you contact property owners or receive inquiries, they will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "15px" }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    backgroundColor: "#fff",
                    padding: "20px",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    borderLeft: "4px solid #1e40af"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{message.subject || "No Subject"}</h3>
                    <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                      {new Date(message.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: "#374151", margin: "5px 0" }}>{message.message || message.content}</p>
                  {message.from_email && (
                    <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "5px 0" }}>
                      From: {message.from_email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

