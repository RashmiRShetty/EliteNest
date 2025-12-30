import React, { useState } from "react";
import { supabase } from "./supabase.js";
import "./PropertyForm.css";
import { useLocation } from "react-router-dom";
const PropertyForm = () => {
 
  const location = useLocation();
  const propertyType = location.state?.propertyType || "Sell";

  const [formData, setFormData] = useState({
    title: "",
    type: "Apartment",
    area: "",
    bedrooms: "",
    bathrooms: "",
    address: "",
    city: "",
    price: "",
    description: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    deposit: "",
    minDuration: "",
  });

  const [propertyImages, setPropertyImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const isRentOrLease = propertyType === "Rent" || propertyType === "Lease";
  const priceLabel =
    propertyType === "Sell"
      ? "Selling Price (in USD)"
      : "Monthly Rent (in USD)";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));

    setPropertyImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title || !formData.area || !formData.description) {
        alert("Please fill all required property details.");
        return;
      }
    }

    if (step === 2) {
      if (
        !formData.address ||
        !formData.city ||
        !formData.price ||
        (isRentOrLease && !formData.minDuration)
      ) {
        alert("Please fill all required location & pricing details.");
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const handlePrevious = () => setStep((prev) => prev - 1);

  const resetForm = () => {
    setFormData({
      title: "",
      type: "Apartment",
      area: "",
      bedrooms: "",
      bathrooms: "",
      address: "",
      city: "",
      price: "",
      description: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      deposit: "",
      minDuration: "",
    });

    setPropertyImages([]);
    setImagePreviews([]);
    setStep(1);
  };

  const handleCancel = () => {
    if (!window.confirm("Cancel listing? All data will be lost.")) return;
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (propertyImages.length < 5) {
      alert("Please upload at least 5 images.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Upload images
      const imageUrls = [];

      for (const file of propertyImages) {
        const ext = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const filePath = `properties/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("property_bucket")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("property_bucket")
          .getPublicUrl(filePath);

        imageUrls.push(data.publicUrl);
      }

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // 2️⃣ Insert property
      const { error: insertError } = await supabase
        .from("properties")
        .insert([
          {
            title: formData.title,
            type: formData.type,
            area: formData.area,
            bedrooms: formData.bedrooms || null,
            bathrooms: formData.bathrooms || null,
            description: formData.description,
            address: formData.address,
            city: formData.city,
            price: Number(formData.price),
            property_listing_type: propertyType,
            deposit: formData.deposit || null,
            min_duration: formData.minDuration || null,
            contact_name: formData.contactName,
            contact_phone: formData.contactPhone,
            contact_email: formData.contactEmail,
            image_urls: imageUrls,
            user_id: userId, // Store user ID for notifications
            created_by: userId, // Also store in created_by for compatibility
          },
        ]);

      if (insertError) throw insertError;

      alert("✅ Property listed successfully!");
      resetForm();
    } catch (error) {
      console.error(error);
      alert("❌ Failed to submit property.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="property-form-container">
      <h2 className="form-header">List Property for {propertyType}</h2>

      <form onSubmit={handleSubmit} className="property-form">
        {/* STEP 1 */}
        {step === 1 && (
          <fieldset>
            <legend>Property Details</legend>

            <input
              type="text"
              name="title"
              placeholder="Property Title"
              value={formData.title}
              onChange={handleChange}
              required
            />

            <select name="type" value={formData.type} onChange={handleChange}>
              <option>Apartment</option>
              <option>House</option>
              <option>Villa</option>
              <option>Land</option>
              <option>Commercial</option>
            </select>

            <input
              type="text"
              name="area"
              placeholder="Area"
              value={formData.area}
              onChange={handleChange}
              required
            />

            <input
              type="number"
              name="bedrooms"
              placeholder="Bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
            />

            <input
              type="number"
              name="bathrooms"
              placeholder="Bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
            />

            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </fieldset>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <fieldset>
            <legend>Location & Pricing</legend>

            <input
              type="text"
              name="address"
              placeholder="Full Address"
              value={formData.address}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              required
            />

            <input
              type="number"
              name="price"
              placeholder={priceLabel}
              value={formData.price}
              onChange={handleChange}
              required
            />

            {isRentOrLease && (
              <>
                <input
                  type="number"
                  name="deposit"
                  placeholder="Deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                />
                <input
                  type="number"
                  name="minDuration"
                  placeholder="Minimum Duration (Months)"
                  value={formData.minDuration}
                  onChange={handleChange}
                  required
                />
              </>
            )}
          </fieldset>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <fieldset>
            <legend>Contact & Images</legend>

            <input
              type="text"
              name="contactName"
              placeholder="Full Name"
              value={formData.contactName}
              onChange={handleChange}
              required
            />

            <input
              type="tel"
              name="contactPhone"
              placeholder="Phone"
              value={formData.contactPhone}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="contactEmail"
              placeholder="Email"
              value={formData.contactEmail}
              onChange={handleChange}
              required
            />

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />

            {imagePreviews.length > 0 && (
              <div className="image-grid">
                {imagePreviews.map((src, i) => (
                  <img key={i} src={src} alt="preview" />
                ))}
              </div>
            )}
          </fieldset>
        )}

        {/* NAVIGATION */}
        <div className="form-navigation">
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>

          {step > 1 && (
            <button type="button" onClick={handlePrevious}>
              Previous
            </button>
          )}

          {step < 3 && (
            <button type="button" onClick={handleNext}>
              Next
            </button>
          )}

          {step === 3 && (
            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;