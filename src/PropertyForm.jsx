import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import "./PropertyForm.css";
import "./Dashboard.css"; // Import Dashboard styles
import Footer from "./components/Footer.jsx";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { CheckCircle, Home, User, Phone, Mail, MapPin, UploadCloud, ArrowRight, ArrowLeft, Building, DollarSign, Check, Shield, Crown, Sparkles, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import SellerTipsAndBenefits from "./components/SellerTipsAndBenefits";


// Icons components for sidebar (copied from Dashboard.jsx for consistency)
const Icons = {
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Property: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>,
  Clipboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Heart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Message: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  ArrowRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
};

const PropertyForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialListingType = location.state?.propertyType || "Sell";

  // Dashboard layout state
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('elitenest:sidebarCollapsed');
      return saved === '0' ? false : true;
    } catch {
      return true;
    }
  });

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationDebounceRef = useRef(null);

  const isRent = formData.listingType === "Rent";
  const isLease = formData.listingType === "Lease";
  const isRentOrLease = isRent || isLease;

  // Auth check and Sidebar logic
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (!error) {
        setUnreadCount(count || 0);
      }
    };
    
    fetchUnreadCount();
    
    // Subscribe to new notifications
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (!error) navigate("/", { replace: true });
  };

  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setLocationQuery(value);
    setSelectedLocation(null);

    setFormData((prev) => ({
      ...prev,
      address: value
    }));

    const error = validateField("address", value);
    setErrors((prev) => ({ ...prev, address: error }));

    if (locationDebounceRef.current) {
      clearTimeout(locationDebounceRef.current);
    }

    if (!value || value.trim().length < 3) {
      setLocationSuggestions([]);
      return;
    }

    locationDebounceRef.current = setTimeout(() => {
      setLocationLoading(true);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&addressdetails=1&limit=5`)
        .then((response) => response.json())
        .then((results) => {
          if (Array.isArray(results)) {
            setLocationSuggestions(results);
          } else {
            setLocationSuggestions([]);
          }
        })
        .catch((error) => {
          console.error("Location search error:", error);
        })
        .finally(() => {
          setLocationLoading(false);
        });
    }, 400);
  };

  const handleLocationSuggestionSelect = (suggestion) => {
    if (!suggestion) return;

    const displayName = suggestion.display_name || "";
    const addr = suggestion.address || {};
    const cityFromSuggestion =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.state_district ||
      addr.state ||
      "";

    setSelectedLocation(displayName);
    setLocationQuery(displayName);
    setLocationSuggestions([]);

    setFormData((prev) => ({
      ...prev,
      address: displayName,
      city: cityFromSuggestion || prev.city
    }));

    setErrors((prev) => ({
      ...prev,
      address: validateField("address", displayName),
      ...(cityFromSuggestion ? { city: validateField("city", cityFromSuggestion) } : {})
    }));
  };

  const closeSidebarOnWeb = () => {
    setSidebarCollapsed(true);
    localStorage.setItem('elitenest:sidebarCollapsed', '1');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('elitenest:sidebarCollapsed', next ? '1' : '0');
      return next;
    });
  };

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
                setLocationQuery(placeName);
                setLocationSuggestions([]);
                setFormData(prev => ({
                  ...prev,
                  address: placeName
                }));
              } else {
                // Fallback to coordinates if geocoding fails
                const locationText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                setSelectedLocation(locationText);
                setLocationQuery(locationText);
                setLocationSuggestions([]);
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
              setLocationQuery(locationText);
              setLocationSuggestions([]);
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
          setLocationQuery(placeName);
          setLocationSuggestions([]);
          setFormData(prev => ({
            ...prev,
            address: placeName
          }));
        } else {
          // Fallback to coordinates if geocoding fails
          const locationText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setSelectedLocation(locationText);
          setLocationQuery(locationText);
          setLocationSuggestions([]);
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
        setLocationQuery(locationText);
        setLocationSuggestions([]);
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
        else if (formData.listingType === "Rent" && value.toString().length > 8) error = "Max 8 digits";
        else if (formData.listingType === "Lease" && value.toString().length > 9) error = "Max 9 digits";
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
      fieldsToValidate = [
        "address",
        "city",
        "price",
        ...(isRent ? ["deposit", "minDuration"] : []),
        ...(isLease ? ["minDuration"] : []),
      ];
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

  const priceLabel =
    formData.listingType === "Sell"
      ? "Selling Price (₹)"
      : formData.listingType === "Lease"
      ? "Lease Amount (₹, one-time)"
      : "Monthly Rent (₹)";

  const handleChange = (e) => {
    const { name, value } = e.target;

    if ((name === "deposit" || (name === "price" && formData.listingType === "Rent")) && value.length > 8) {
      alert("Maximum 8 digits allowed");
      return;
    }

    if (name === "price" && (formData.listingType === "Sell" || formData.listingType === "Lease") && value.length > 9) {
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
    const maxPhotos = 10; // Allow up to 10 photos initially
    const currentCount = propertyImages.length;
    const newFiles = Array.from(e.target.files);
    
    if (currentCount + newFiles.length > maxPhotos) {
      alert(`You can only upload a maximum of ${maxPhotos} photos.`);
      return;
    }

    // Only create previews for the newly selected files
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    
    setPropertyImages(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    // Revoke the URL of the removed image to avoid memory leaks
    if (imagePreviews[index]) {
      URL.revokeObjectURL(imagePreviews[index]);
    }
    
    const newImages = propertyImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setPropertyImages(newImages);
    setImagePreviews(newPreviews);
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

  const submitProperty = async () => {
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
        user_id: user.id,
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
        status: 'pending' // Property is pending until admin approval and payment
      }]);

      if (insertError) throw insertError;
      alert(`✅ Property listed successfully! It will be visible after admin approval and payment.`);
      clearForm();
    } catch (error) {
      console.error(error);
      alert(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    if (propertyImages.length < 3) {
      alert("Please upload at least 3 images.");
      return;
    }
    
    submitProperty();
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

  const greeting = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  return (
    <div className="dashboard-container dark-theme">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">Menu</Link>
          <button onClick={toggleSidebar} className="sidebar-toggle-btn">
            <Icons.Menu />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Home /></span>
            <span>Dashboard</span>
          </Link>
          <Link to="/properties" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Property /></span>
            <span>Properties</span>
          </Link>
          <Link to="/mylistings" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Search /></span>
            <span>My Listings</span>
          </Link>
          <Link to="/favorites" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Calendar /></span>
            <span>Appointment History</span>
          </Link>
          <Link to="/favorites" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Heart /></span>
            <span>Saved Properties</span>
          </Link>
          <Link to="/notifications" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Bell /></span>
            <span>Notifications</span>
          </Link>
          <Link to="/profile" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.User /></span>
            <span>Profile</span>
          </Link>
          <Link to="/settings" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Settings /></span>
            <span>Settings</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => { handleSignOut(); closeSidebarOnWeb(); }} className="nav-item logout-btn">
            <span className="nav-icon"><Icons.LogOut /></span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button onClick={toggleSidebar} className="header-hamburger">
              <Icons.Menu />
            </button>
            <Link to={user ? "/dashboard" : "/"} className="header-brand">
              <img
                src="/elite-nest-logo.png"
                alt="Elite Nest"
                style={{ height: "56px", objectFit: "contain" }}
              />
              <span style={{ marginLeft: "8px", fontWeight: 800 }}>Elite Nest</span>
            </Link>
            <nav className="header-links">
              <Link to="/dashboard" className="header-link">Dashboard</Link>
              <Link to="/properties" className="header-link">Properties</Link>
              <Link to="/contact" className="header-link">Contact</Link>
              <Link to="/about" className="header-link">About Us</Link>
            </nav>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><Icons.Search /></button>
            <div style={{ position: 'relative' }}>
              <button 
                className="icon-btn" 
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                onClick={() => navigate('/notifications')}
                aria-label="Notifications"
              >
                <Icons.Bell />
              </button>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "0px",
                  right: "0px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#ef4444",
                  borderRadius: "50%"
                }}></span>
              )}
            </div>
            <div
              className="user-profile"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/profile')}
            >
              <div className="avatar-circle" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {greeting.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content property-dashboard-content">
          <div className="property-form-container" style={{ paddingTop: "0", height: "100%" }}>
            {/* LEFT SIDE - MARKETING */}
      <div className="form-left-section">
        <div className="marketing-card">
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
                {renderPills("type", ["Apartment", "House", "Villa"])}
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
                      value={locationQuery || formData.address}
                      onChange={handleLocationInputChange}
                      placeholder="Type location name or use the options below"
                      className="location-input"
                    />
                  </div>
                  {locationLoading && (
                    <div className="location-loading-text">Searching locations...</div>
                  )}
                  {locationSuggestions.length > 0 && (
                    <div className="location-suggestions">
                      {locationSuggestions.map((s, index) => {
                        const parts = (s.display_name || "").split(",");
                        const main = parts[0] || "";
                        const sub = parts.slice(1).join(", ").trim();
                        return (
                          <button
                            type="button"
                            key={`${s.place_id || index}`}
                            className="location-suggestion-item"
                            onClick={() => handleLocationSuggestionSelect(s)}
                          >
                            <span className="location-suggestion-main">{main}</span>
                            {sub && (
                              <span className="location-suggestion-sub">{sub}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
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

              {isRent && (
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

              {isLease && (
                <div className="form-group">
                  <label>Min Duration (Months)</label>
                  <input
                    type="number"
                    name="minDuration"
                    value={formData.minDuration}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Upload Photos </label>
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
                      <div key={i} className="preview-item-container">
                        <img src={src} alt="preview" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="remove-image-btn"
                        >
                          <X size={12} />
                        </button>
                      </div>
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
      
      <MapModalContent />
          </div>
        </div>
        <SellerTipsAndBenefits />
        <Footer />
      </main>
    </div>
  );
};

export default PropertyForm;
