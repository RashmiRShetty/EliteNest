import React, { useState } from "react";
import { supabase } from "../supabase";

export default function EditPropertyModal({ property, onClose, onSave, resetStatus = false }) {
  const [formData, setFormData] = useState({
    title: property.title || "",
    type: property.type || "",
    area: property.area || "",
    bedrooms: property.bedrooms || "",
    bathrooms: property.bathrooms || "",
    address: property.address || "",
    city: property.city || "",
    price: property.price || "",
    description: property.description || "",
    contact_name: property.contact_name || "",
    contact_phone: property.contact_phone || "",
    contact_email: property.contact_email || "",
    deposit: property.deposit || "",
    min_duration: property.min_duration || "",
    parking: property.parking || "",
    furnished_status: property.furnished_status || "",
    balcony: property.balcony || "",
    nearby_places: property.nearby_places || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "price") {
      const lt = property.property_listing_type;
      if ((lt === "Rent" || lt === "Lease") && value.length > 8) {
        alert("Maximum 8 digits allowed");
        return;
      }
      if (lt === "Sell" && value.length > 9) {
        alert("Maximum 9 digits allowed");
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updates = {
        title: formData.title,
        type: formData.type,
        area: formData.area,
        bedrooms: formData.bedrooms || null,
        bathrooms: formData.bathrooms || null,
        address: formData.address,
        city: formData.city,
        price: Number(formData.price),
        description: formData.description,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        deposit: formData.deposit || null,
        min_duration: formData.min_duration || null,
        parking: formData.parking,
        furnished_status: formData.furnished_status,
        balcony: formData.balcony,
        nearby_places: formData.nearby_places,
      };

      // If resetStatus is true, set status to 'pending'
      if (resetStatus) {
        updates.status = 'pending';
        // We DO NOT reset approval_count here. It should persist.
      }

      const { error } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", property.id);

      if (error) throw error;

      alert(resetStatus ? "Property updated and sent for approval!" : "Property updated successfully!");
      onSave({ ...property, ...updates }); // Pass updated data back
    } catch (error) {
      console.error("Error updating property:", error);
      alert("Error updating property: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", padding: 30, borderRadius: 12, maxWidth: "600px", width: "90%", maxHeight: "90vh", overflow: "auto", color: "#333" }}>
        <h2 style={{ marginBottom: 20, color: "#111" }}>{resetStatus ? "Edit & Resend for Approval" : "Edit Property"}</h2>
        
        {property.status === 'rejected' && property.rejection_reason && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: '8px', 
            border: '1px solid #ef4444',
            color: '#ef4444',
            fontSize: '0.9rem',
            marginBottom: '20px'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Admin Rejection Reason:</strong>
            {property.rejection_reason}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Type</label>
              <input type="text" name="type" value={formData.type} onChange={handleChange} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Area</label>
                <input type="text" name="area" value={formData.area} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Price</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Bedrooms</label>
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Bathrooms</label>
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Parking</label>
                <input type="text" name="parking" value={formData.parking} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Furnished</label>
                <input type="text" name="furnished_status" value={formData.furnished_status} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Balcony</label>
                <input type="text" name="balcony" value={formData.balcony} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Nearby Places</label>
              <textarea name="nearby_places" value={formData.nearby_places} onChange={handleChange} rows="2" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Contact Name</label>
                <input type="text" name="contact_name" value={formData.contact_name} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Contact Phone</label>
                <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Contact Email</label>
              <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Deposit</label>
                <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Min Duration</label>
                <input type="text" name="min_duration" value={formData.min_duration} onChange={handleChange} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", backgroundColor: "#6b7280", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: "10px 20px", backgroundColor: saving ? "#9ca3af" : "#1e40af", color: "#fff", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : (resetStatus ? "Save & Resend" : "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
