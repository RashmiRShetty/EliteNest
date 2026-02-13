import React, { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import "./PropertyForm.css";
import { useLocation } from "react-router-dom";
import { CheckCircle, Home, User, Phone, Mail, MapPin, UploadCloud, ArrowRight, ArrowLeft, Building, DollarSign } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const PropertyForm = () => {
  const location = useLocation();
  const initialListingType = location.state?.propertyType || "Sell";

  const [formData, setFormData] = useState({
    listingType: initialListingType,
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
    parking: "No",
    furnished: "Unfurnished",
    balcony: "No",
    nearby: "",
  });

  const [propertyImages, setPropertyImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeField, setActiveField] = useState(null); // Track which input field is active
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const isRentOrLease = formData.listingType === "Rent" || formData.listingType === "Lease";

  // Load Leaflet (no API key needed)
  useEffect(() => {
    // Leaflet is already imported, no need to load external scripts
    console.log('Leaflet ready for use');
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Use Nominatim for reverse geocoding (free service)
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => {
              if (data && data.display_name) {
                const placeName = data.display_name;
                setSelectedLocation(placeName);
                setFormData(prev => ({
                  ...prev,
                  address: placeName
                }));
              } else {
                // Fallback to coordinates if geocoding fails
                const locationText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                setSelectedLocation(locationText);
                setFormData(prev => ({
                  ...prev,
                  address: locationText
                }));
              }
            })
            .catch(error => {
              console.error('Reverse geocoding error:', error);
              // Fallback to coordinates
              const locationText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              setSelectedLocation(locationText);
              setFormData(prev => ({
                ...prev,
                address: locationText
              }));
            });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Handle map location selection
  const handleMapLocationSelect = (lat, lng) => {
    // Use Nominatim for reverse geocoding
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          const placeName = data.display_name;
          setSelectedLocation(placeName);
          setFormData(prev => ({
            ...prev,
            address: placeName
          }));
        } else {
          // Fallback to coordinates if geocoding fails
          const locationText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setSelectedLocation(locationText);
          setFormData(prev => ({
            ...prev,
            address: locationText
          }));
        }
      })
      .catch(error => {
        console.error('Reverse geocoding error:', error);
        // Fallback to coordinates
        const locationText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setSelectedLocation(locationText);
        setFormData(prev => ({
          ...prev,
          address: locationText
        }));
      });
    setShowMapModal(false);
  };

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
        else if (value.trim().length < 5) error = "Title must be at least 5 characters";
        break;
      case "area":
        if (!value) error = "Area is required";
        else if (isNaN(value) || parseFloat(value) <= 0) error = "Must be positive";
        else if (parseFloat(value) < 100) error = "Min area is 100 sq ft";
        else if (parseFloat(value) > 500000) error = "Max area is 500,000 sq ft";
        break;
      case "bedrooms":
        if (!value) error = "Required";
        else if (Number(value) > 100) error = "Max 100 bedrooms";
        break;
      case "bathrooms":
        if (!value) error = "Required";
        else if (Number(value) > 100) error = "Max 100 bathrooms";
        break;
      case "deposit":
        if (value && value.toString().length > 8) error = "Max 8 digits";
        break;
      case "minDuration":
        if (value && value.toString().length > 2) error = "Max 2 digits";
        break;
      case "description":
        if (!value.trim()) error = "Description is required";
        else if (value.trim().length < 10) error = "Must be at least 10 chars";
        break;
      case "address":
        if (!value.trim()) error = "Address is required";
        break;
      case "city":
        if (!value.trim()) error = "City is required";
        break;
      case "price":
        if (!value) error = "Price is required";
        else if (isNaN(value) || parseFloat(value) <= 0) error = "Must be positive";
        else if ((formData.listingType === "Rent" || formData.listingType === "Lease") && value.toString().length > 8) error = "Max 8 digits";
        else if (formData.listingType === "Sell" && value.toString().length > 9) error = "Max 9 digits";
        break;
      case "contactName":
        if (!value.trim()) error = "Name is required";
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = "Name must contain only alphabets";
        break;
      case "contactPhone":
        if (!value) error = "Phone is required";
        else if (!/^[6-9]\d{9}$/.test(value.replace(/\s+/g, ''))) error = "Invalid phone number";
        break;
      case "contactEmail":
        if (!value) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email";
        break;
      default:
        break;
    }
    return error;
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};
    let fieldsToValidate = [];

    if (stepNumber === 1) {
      fieldsToValidate = ["title", "type", "description", "contactName", "contactPhone", "contactEmail"];
    } else if (stepNumber === 2) {
      fieldsToValidate = ["area", "bedrooms", "bathrooms"];
    } else if (stepNumber === 3) {
      fieldsToValidate = ["address", "city", "price", ...(isRentOrLease ? ["deposit", "minDuration"] : [])];
    }

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (stepNumber === 2) {
      const areaValue = parseFloat(formData.area);
      if (!isNaN(areaValue) && areaValue < 100) {
        alert("Minimum area is 100 sq ft");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const priceLabel = formData.listingType === "Sell" ? "Selling Price (₹)" : "Monthly Rent (₹)";

  const handleChange = (e) => {
    const { name, value } = e.target;

    if ((name === "deposit" || (name === "price" && (formData.listingType === "Rent" || formData.listingType === "Lease"))) && value.length > 8) {
      alert("Maximum 8 digits allowed");
      return;
    }

    if (name === "price" && formData.listingType === "Sell" && value.length > 9) {
      alert("Maximum 9 digits allowed");
      return;
    }

    if (name === "minDuration" && value.length > 2) {
      alert("Maximum 2 digits allowed for Min Duration");
      return;
    }

    if (name === "area" && parseFloat(value) > 500000) {
      alert("Maximum area is 500,000 sq ft");
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handlePillChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (validateStep(step)) setStep((prev) => prev + 1);
  };

  const handlePrevious = () => setStep((prev) => prev - 1);

  // Clear form function
  const clearForm = () => {
    setFormData({
      listingType: initialListingType,
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
      parking: "No",
      furnished: "Unfurnished",
      balcony: "No",
      nearby: "",
    });
    setPropertyImages([]);
    setImagePreviews([]);
    setSelectedLocation(null);
    setStep(1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    if (propertyImages.length < 3) {
      alert("Please upload at least 3 images.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be logged in.");

      const imageUrls = [];
      for (const file of propertyImages) {
        const ext = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const filePath = `properties/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("property_bucket").upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("property_bucket").getPublicUrl(filePath);
        imageUrls.push(data.publicUrl);
      }

      const { error: insertError } = await supabase.from("properties").insert([{
        title: formData.title,
        type: formData.type,
        area: Number(formData.area),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        description: formData.description,
        address: formData.address,
        city: formData.city,
        price: Number(formData.price),
        property_listing_type: formData.listingType,
        deposit: formData.deposit ? Number(formData.deposit) : null,
        min_duration: formData.minDuration ? Number(formData.minDuration) : null,
        contact_name: formData.contactName,
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail,
        image_urls: imageUrls,
        parking: formData.parking,
        furnished_status: formData.furnished,
        balcony: formData.balcony,
        nearby_places: formData.nearby,
      }]);

      if (insertError) throw insertError;
      alert("✅ Property listed successfully!");
      clearForm(); // Clear form after successful submission
    } catch (error) {
      console.error(error);
      alert(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper for rendering pills
  const renderPills = (name, options) => {
    const isActive = (opt) => {
      if (name === "bedrooms" && opt === "5+" && (formData.bedrooms === "5+" || Number(formData.bedrooms) >= 5)) return true;
      if (name === "bathrooms" && opt === "4+" && (formData.bathrooms === "4+" || Number(formData.bathrooms) >= 4)) return true;
      return formData[name] == opt;
    };

    return (
      <div className="pill-group">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`pill-option ${isActive(opt) ? "active" : ""}`}
            onClick={() => handlePillChange(name, opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  };

  // React-Leaflet Map Modal Component
  const MapModalContent = () => {
    const [position, setPosition] = useState({ lat: 12.9716, lng: 77.5946 });

    const handleMapClick = (event) => {
      const newPos = event.latlng;
      setPosition(newPos);
      handleMapLocationSelect(newPos.lat, newPos.lng);
    };

    const handleMarkerDrag = (event) => {
      const newPos = event.target.getLatLng();
      setPosition(newPos);
      handleMapLocationSelect(newPos.lat, newPos.lng);
    };

    if (!showMapModal) return null;

    return (
      <div className="map-modal-overlay">
        <div className="map-modal">
          <div className="map-modal-header">
            <h3>Select Location on Map</h3>
            <button onClick={() => setShowMapModal(false)} className="close-btn">×</button>
          </div>
          <div 
            style={{ 
              height: '400px', 
              width: '100%',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              zIndex: 1
            }}
          >
            <MapContainer 
              center={[position.lat, position.lng]} 
              zoom={15} 
              style={{ height: '100%', width: '100%' }}
              whenClicked={handleMapClick}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker 
                position={[position.lat, position.lng]} 
                draggable={true}
                eventHandlers={{
                  dragend: handleMarkerDrag
                }}
              />
            </MapContainer>
          </div>
          <div className="map-modal-footer">
            <button onClick={() => setShowMapModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => setShowMapModal(false)} className="btn-primary">Confirm Location</button>
          </div>
        </div>
      </div>
    );
  };

  const MapModal = MapModalContent;

  return (
    <div className="property-form-container" style={{ paddingTop: "40px" }}>
      {/* LEFT SIDE - MARKETING */}
      <div className="form-left-section">
        <div className="marketing-content">
          <h1 className="marketing-title">List Your Property <br /> in 3 Simple Steps</h1>
          
          <div className="marketing-stats">
            <div className="stat-item">
              <span className="stat-number">10k+</span>
              <span className="stat-label">Active Listings</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">5k+</span>
              <span className="stat-label">Verified Buyers</span>
            </div>
          </div>

          <div className="steps-indicator">
            <div className={`step-item ${step >= 1 ? "active" : ""}`}>
              <div className="step-circle">1</div>
              <div className="step-text">Basic Details</div>
            </div>
            <div className={`step-line ${step >= 2 ? "active" : ""}`}></div>
            <div className={`step-item ${step >= 2 ? "active" : ""}`}>
              <div className="step-circle">2</div>
              <div className="step-text">Property Info</div>
            </div>
            <div className={`step-line ${step >= 3 ? "active" : ""}`}></div>
            <div className={`step-item ${step >= 3 ? "active" : ""}`}>
              <div className="step-circle">3</div>
              <div className="step-text">Location & Photos</div>
            </div>
          </div>

          <div className="trust-badges">
            <div className="trust-badge"><CheckCircle size={16} /> Verified Listings</div>
            <div className="trust-badge"><CheckCircle size={16} /> Secure Process</div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="form-right-section">
        <form onSubmit={handleSubmit} className="property-form-card">
          <div className="form-header-mobile">List Property</div>
          
          {step === 1 && (
            <div className="form-step fade-in">
              <h3 className="step-title">Let's start with the basics</h3>
              
              <div className="form-group">
                <label>Property Title *</label>
                <div className="input-wrapper">
                  <Home size={18} className="input-icon" />
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Luxury 3BHK in Indiranagar"
                  />
                </div>
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label>Property Type</label>
                {renderPills("type", ["Apartment", "House", "Villa", "Land", "Commercial"])}
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us more about the property..."
                  rows={3}
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>

              <div className="section-divider">Contact Details</div>

              <div className="form-row">
                <div className="form-group">
                  <label>Your Name *</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      placeholder="Full Name"
                    />
                  </div>
                  {errors.contactName && <span className="error-text">{errors.contactName}</span>}
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <div className="input-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="9876543210"
                    />
                  </div>
                  {errors.contactPhone && <span className="error-text">{errors.contactPhone}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    readOnly
                    className="readonly-input"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step fade-in">
              <h3 className="step-title">Property Specifications</h3>

              <div className="form-group">
                <label>Carpet Area (sq ft) *</label>
                <div className="input-wrapper">
                  <Building size={18} className="input-icon" />
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="e.g. 1200"
                  />
                </div>
                {errors.area && <span className="error-text">{errors.area}</span>}
              </div>

              <div className="form-group">
                <label>Bedrooms (BHK)</label>
                {renderPills("bedrooms", [1, 2, 3, 4, "5+"])}
                {(formData.bedrooms === "5+" || (Number(formData.bedrooms) >= 5) || activeField === "bedrooms") && (
                  <div className="input-wrapper" style={{ marginTop: "10px" }}>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms === "5+" ? "" : formData.bedrooms}
                      onFocus={() => setActiveField("bedrooms")}
                      onBlur={() => setActiveField(null)}
                      onChange={(e) => {
                         const val = e.target.value;
                         if (val === "" || (Number(val) <= 100 && Number(val) >= 0)) {
                             handleChange({ target: { name: "bedrooms", value: val } });
                         }
                      }}
                      placeholder="Enter number of bedrooms"
                    />
                  </div>
                )}
                {errors.bedrooms && <span className="error-text">{errors.bedrooms}</span>}
              </div>

              <div className="form-group">
                <label>Bathrooms</label>
                {renderPills("bathrooms", [1, 2, 3, "4+"])}
                {(formData.bathrooms === "4+" || (Number(formData.bathrooms) >= 4) || activeField === "bathrooms") && (
                  <div className="input-wrapper" style={{ marginTop: "10px" }}>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms === "4+" ? "" : formData.bathrooms}
                      onFocus={() => setActiveField("bathrooms")}
                      onBlur={() => setActiveField(null)}
                      onChange={(e) => {
                         const val = e.target.value;
                         if (val === "" || (Number(val) <= 100 && Number(val) >= 0)) {
                             handleChange({ target: { name: "bathrooms", value: val } });
                         }
                      }}
                      placeholder="Enter number of bathrooms"
                    />
                  </div>
                )}
                {errors.bathrooms && <span className="error-text">{errors.bathrooms}</span>}
              </div>

              <div className="form-group">
                <label>Furnishing Status</label>
                {renderPills("furnished", ["Unfurnished", "Semi-Furnished", "Fully Furnished"])}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Parking</label>
                  {renderPills("parking", ["Yes", "No"])}
                </div>
                <div className="form-group">
                  <label>Balcony</label>
                  {renderPills("balcony", ["Yes", "No"])}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step fade-in">
              <h3 className="step-title">Location & Pricing</h3>

              <div className="form-group">
                <label>Location *</label>
                <div className="location-field-wrapper">
                  <div className="input-wrapper">
                    <MapPin size={18} className="input-icon" />
                    <input
                      type="text"
                      name="address"
                      value={selectedLocation || formData.address}
                      onChange={handleChange}
                      placeholder="Selected location will appear here"
                      readOnly
                      className="location-input"
                    />
                  </div>
                  <div className="location-buttons">
                    <button 
                      type="button" 
                      onClick={getCurrentLocation}
                      className="location-option-btn current-btn"
                    >
                      📍 Current Location
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowMapModal(true)}
                      className="location-option-btn map-btn"
                    >
                      🗺️ Select on Map
                    </button>
                  </div>
                  {selectedLocation && (
                    <div className="selected-location-display">
                      <span className="location-text">📍 {selectedLocation}</span>
                    </div>
                  )}
                </div>
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Bangalore"
                />
                {errors.city && <span className="error-text">{errors.city}</span>}
              </div>

              <div className="form-group">
                <label>Nearby Places / Landmarks</label>
                <textarea
                  name="nearby"
                  value={formData.nearby}
                  onChange={handleChange}
                  placeholder="e.g. Near Metro Station, Opposite City Park..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>{priceLabel} *</label>
                <div className="input-wrapper">
                  <DollarSign size={18} className="input-icon" />
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Amount"
                  />
                </div>
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>

              {isRentOrLease && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Deposit (₹)</label>
                    <input
                      type="number"
                      name="deposit"
                      value={formData.deposit}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Min Duration (Months)</label>
                    <input
                      type="number"
                      name="minDuration"
                      value={formData.minDuration}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Upload Photos (Min 3)</label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    id="file-upload"
                    className="hidden-file-input"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <UploadCloud size={24} />
                    <span>Click to upload images</span>
                  </label>
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="preview-grid">
                    {imagePreviews.map((src, i) => (
                      <img key={i} src={src} alt="preview" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            {step > 1 ? (
              <button type="button" onClick={handlePrevious} className="btn-secondary">
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div /> // Spacer
            )}

            {step < 3 ? (
              <button type="button" onClick={handleNext} className="btn-primary">
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Listing..." : "Submit Property"}
              </button>
            )}
          </div>
        </form>
      </div>
      
      <MapModal />
    </div>
  );
};

export default PropertyForm;
