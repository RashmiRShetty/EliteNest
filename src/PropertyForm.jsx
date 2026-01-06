import React, { useState, useEffect } from "react";
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
  const [errors, setErrors] = useState({});

  const isRentOrLease = propertyType === "Rent" || propertyType === "Lease";

  // Auto-fill logged-in user's email
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email && !formData.contactEmail) {
          setFormData((prev) => ({ ...prev, contactEmail: user.email }));
        }
      } catch (error) {
        console.error("Error getting user email:", error);
      }
    };
    getUserEmail();
  }, []);

  // Validation functions
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "title":
        if (!value.trim()) error = "Property title is required";
        else if (!/^[a-zA-Z\s]+$/.test(value.trim())) error = "Title must contain only letters and spaces";
        else if (value.trim().length < 5) error = "Title must be at least 5 characters";
        break;
      case "area":
        if (!value) error = "Area is required";
        else if (isNaN(value) || parseFloat(value) <= 0) error = "Area must be a positive number";
        else if (parseFloat(value) > 999999) error = "Area must be maximum 6 digits";
        break;
      case "bedrooms":
        if (!value) error = "Bedrooms is required";
        else if (isNaN(value) || parseInt(value) < 1) error = "Bedrooms must be at least 1";
        break;
      case "bathrooms":
        if (!value) error = "Bathrooms is required";
        else if (isNaN(value) || parseInt(value) < 1) error = "Bathrooms must be at least 1";
        break;
      case "description":
        if (!value.trim()) error = "Description is required";
        else if (value.trim().length < 10) error = "Description must be at least 10 characters";
        else if (/\d{10,}/.test(value)) error = "Description cannot contain continuous 10 or more digits";
        break;
      case "address":
        if (!value.trim()) error = "Address is required";
        else if (!/^[a-zA-Z0-9\s,.-]+$/.test(value.trim())) error = "Address can only contain letters, numbers, spaces, commas, dots, and hyphens";
        else if (value.trim().length < 10) error = "Address must be at least 10 characters";
        break;
      case "city":
        if (!value.trim()) error = "City is required";
        break;
      case "price":
        if (!value) error = "Price is required";
        else if (isNaN(value) || parseFloat(value) <= 0) error = "Price must be a positive number";
        break;
      case "deposit":
        if (value && (isNaN(value) || parseFloat(value) < 0)) error = "Deposit must be a non-negative number";
        break;
      case "minDuration":
        if (isRentOrLease) {
          if (!value) error = "Minimum duration is required for rent/lease";
          else if (isNaN(value) || parseInt(value) <= 0) error = "Minimum duration must be a positive number";
        }
        break;
      case "contactName":
        if (!value.trim()) error = "Contact name is required";
        else if (value.trim().length < 2) error = "Name must be at least 2 characters";
        break;
      case "contactPhone":
        if (!value) error = "Phone number is required";
        else if (!/^[6-9]\d{9}$/.test(value.replace(/\s+/g, ''))) error = "Enter a valid 10-digit phone number starting with 6-9";
        break;
      case "contactEmail":
        if (!value) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter a valid email address";
        break;
      default:
        break;
    }
    return error;
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};
    const fieldsToValidate = {
      1: ["title", "area", "bedrooms", "bathrooms", "description"],
      2: ["address", "city", "price", ...(isRentOrLease ? ["deposit", "minDuration"] : [])],
      3: ["contactName", "contactPhone", "contactEmail"]
    };

    fieldsToValidate[stepNumber].forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ PRICE LABEL IN RUPEES
  const priceLabel =
    propertyType === "Sell"
      ? "Selling Price (in ₹)"
      : "Monthly Rent (in ₹)";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validate field and update errors
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));

    setPropertyImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
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

    // Validate step 3
    if (!validateStep(3)) {
      return;
    }

    // Validate images
    if (propertyImages.length < 5) {
      alert("Please upload at least 5 images.");
      return;
    }

    setLoading(true);

    try {
      // 0️⃣ Check authentication first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("You must be logged in to submit a property listing");
      }
      const userId = user.id;

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

      // 2️⃣ Insert property
      const { error: insertError } = await supabase
        .from("properties")
        .insert([
          {
            title: formData.title,
            type: formData.type,
            area: Number(formData.area), // Convert to number
            bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
            bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
            description: formData.description,
            address: formData.address,
            city: formData.city,
            price: Number(formData.price), // ₹ stored as number
            property_listing_type: propertyType,
            deposit: formData.deposit ? Number(formData.deposit) : null,
            min_duration: formData.minDuration ? Number(formData.minDuration) : null,
            contact_name: formData.contactName,
            contact_phone: formData.contactPhone,
            contact_email: formData.contactEmail,
            image_urls: imageUrls,
          },
        ]);

      if (insertError) {
        console.error("Insert error details:", insertError);
        throw new Error(`Database error: ${insertError.message || 'Unknown error'}`);
      }

      alert("✅ Property listed successfully!");
      resetForm();
    } catch (error) {
      console.error(error);
      alert(`❌ Failed to submit property: ${error.message || "Unknown error"}`);
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
            {errors.title && <div className="error-message">{errors.title}</div>}

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
              placeholder="Area (max 6 digits sq ft)"
              value={formData.area}
              onChange={handleChange}
              required
            />
            {errors.area && <div className="error-message">{errors.area}</div>}

            <input
              type="number"
              name="bedrooms"
              placeholder="Bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              required
            />
            {errors.bedrooms && <div className="error-message">{errors.bedrooms}</div>}

            <input
              type="number"
              name="bathrooms"
              placeholder="Bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              required
            />
            {errors.bathrooms && <div className="error-message">{errors.bathrooms}</div>}

            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
            {errors.description && <div className="error-message">{errors.description}</div>}
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
            {errors.address && <div className="error-message">{errors.address}</div>}

            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              required
            />
            {errors.city && <div className="error-message">{errors.city}</div>}

            <input
              type="number"
              name="price"
              placeholder={priceLabel}
              value={formData.price}
              onChange={handleChange}
              required
            />
            {errors.price && <div className="error-message">{errors.price}</div>}

            {isRentOrLease && (
              <>
                <input
                  type="number"
                  name="deposit"
                  placeholder="Deposit (₹)"
                  value={formData.deposit}
                  onChange={handleChange}
                />
                {errors.deposit && <div className="error-message">{errors.deposit}</div>}

                <input
                  type="number"
                  name="minDuration"
                  placeholder="Minimum Duration (Months)"
                  value={formData.minDuration}
                  onChange={handleChange}
                  required
                />
                {errors.minDuration && <div className="error-message">{errors.minDuration}</div>}
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
            {errors.contactName && <div className="error-message">{errors.contactName}</div>}

            <input
              type="tel"
              name="contactPhone"
              placeholder="Phone"
              value={formData.contactPhone}
              onChange={handleChange}
              required
            />
            {errors.contactPhone && <div className="error-message">{errors.contactPhone}</div>}

            <input
              type="email"
              name="contactEmail"
              placeholder="Email"
              value={formData.contactEmail}
              onChange={handleChange}
              readOnly
              required
            />
            {errors.contactEmail && <div className="error-message">{errors.contactEmail}</div>}

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
