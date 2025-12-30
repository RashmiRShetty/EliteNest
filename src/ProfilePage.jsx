import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import "./App.css";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate("/loginpage");
          return;
        }

        setUser(currentUser);
        setProfileData({
          fullName: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "",
          email: currentUser.email || "",
          phone: currentUser.user_metadata?.phone || "",
          address: currentUser.user_metadata?.address || "",
        });

        // Try to fetch from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profile) {
          setProfileData({
            fullName: profile.full_name || profileData.fullName,
            email: profile.email || profileData.email,
            phone: profile.phone_number || profileData.phone,
            address: profile.address || profileData.address,
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.fullName,
          phone: profileData.phone,
          address: profileData.address,
        }
      });

      if (updateError) throw updateError;

      // Try to update/insert in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: profileData.email,
          full_name: profileData.fullName,
          phone_number: profileData.phone,
          address: profileData.address,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn("Could not update profiles table:", profileError);
      }

      alert("Profile updated successfully!");
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "100px", textAlign: "center" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ marginBottom: "30px" }}>My Profile</h1>

          <div style={{
            backgroundColor: "#fff",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h2>Profile Information</h2>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#1e40af",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  Edit Profile
                </button>
              ) : (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      // Reload original data
                      window.location.reload();
                    }}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#6b7280",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: saving ? "#9ca3af" : "#059669",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: saving ? "not-allowed" : "pointer"
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
                  Full Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }}
                  />
                ) : (
                  <p style={{ padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px", margin: 0 }}>
                    {profileData.fullName || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
                  Email
                </label>
                <p style={{ padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px", margin: 0 }}>
                  {profileData.email}
                </p>
                <small style={{ color: "#6b7280" }}>Email cannot be changed</small>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
                  Phone Number
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }}
                  />
                ) : (
                  <p style={{ padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px", margin: 0 }}>
                    {profileData.phone || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
                  Address
                </label>
                {editMode ? (
                  <textarea
                    name="address"
                    value={profileData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    rows="3"
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      resize: "vertical"
                    }}
                  />
                ) : (
                  <p style={{ padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px", margin: 0 }}>
                    {profileData.address || "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

