// src/utils/properties.js
import { supabase } from "../supabase";

// Function to get coordinates for specific known addresses
function getCoordinatesForAddress(address, city) {
  // Known location mappings with precise coordinates
  const knownLocations = {
    "bengaluru city university": { lat: 12.9762, lng: 77.6033 },
    "bangalore city university": { lat: 12.9762, lng: 77.6033 },
    "bengaluru central": { lat: 12.9762, lng: 77.6033 },
    "bangalore central": { lat: 12.9762, lng: 77.6033 },
    "sampangirama nagar": { lat: 12.9762, lng: 77.6033 },
    "sheshadri road": { lat: 12.9762, lng: 77.6033 },
    "bengaluru urban": { lat: 12.9762, lng: 77.6033 },
    "bangalore urban": { lat: 12.9762, lng: 77.6033 },
    "karnataka": { lat: 12.9762, lng: 77.6033 }
  };

  const addressLower = (address || "").toLowerCase();
  const cityLower = (city || "").toLowerCase();

  console.log("Geocoding address:", address, "city:", city);

  // Check for known locations - prioritize more specific matches
  if (addressLower.includes("bengaluru city university") || addressLower.includes("bangalore city university")) {
    console.log("Found Bengaluru City University - using precise coords");
    return { lat: 12.9762, lng: 77.6033 };
  }
  
  if (addressLower.includes("sampangirama nagar")) {
    console.log("Found Sampangirama Nagar");
    return { lat: 12.9762, lng: 77.6033 };
  }

  if (addressLower.includes("sheshadri road")) {
    console.log("Found Sheshadri Road");
    return { lat: 12.9762, lng: 77.6033 };
  }

  // Check for known locations
  for (const [key, coords] of Object.entries(knownLocations)) {
    if (addressLower.includes(key) || cityLower.includes(key)) {
      console.log("Found known location:", key, "coords:", coords);
      return coords;
    }
  }

  // Default to Bengaluru center if no specific location found
  console.log("Using default Bengaluru coordinates");
  return { lat: 12.9762, lng: 77.6033 };
}

// Helper to safely parse image arrays/strings
export const getArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    // Try JSON parse
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Ignore error
    }
    // Try postgres array syntax {url1,url2}
    if (val.startsWith('{') && val.endsWith('}')) {
      return val.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    }
    // Assume single URL
    if (val.startsWith('http')) return [val];
  }
  return [];
};

/**
 * Fetch all properties from Supabase
 * Maps database fields to the format expected by the frontend
 */
export async function fetchProperties() {
  try {
    // Fetch all properties first, then filter client-side for visibility
    // Properties become visible after approval
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error);
      return [];
    }

    // Helper to check if property is expired
    const isPropertyExpired = (property) => {
      if (property.status !== "approved") return false;
      
      const createdAt = new Date(property.created_at);
      const now = new Date();
      const pkg = (property.package_name || "Silver").toLowerCase();
      
      let validityDays = 15;
      if (pkg === "gold") validityDays = 30;
      else if (pkg === "platinum") validityDays = 45;
      
      const expiryDate = new Date(createdAt);
      expiryDate.setDate(createdAt.getDate() + validityDays);
      
      return now > expiryDate;
    };

    // Helper to normalize listing type coming from DB
    const normalizeListingType = (rawType) => {
      const t = (rawType || "").toLowerCase().trim();
      if (t === "sell") return "sale";
      if (t === "sale") return "sale";
      if (t === "lease") return "lease";
      if (t === "rent") return "rent";
      return t || "rent";
    };

    // Filter to show ONLY properties that have status "approved" AND are NOT expired
    // This ensures only active, approved properties are visible to all users
    const visibleProperties = (data || []).filter(property => 
      property.status === "approved" && !isPropertyExpired(property)
    );

    // Map database fields to frontend format
    return visibleProperties.map((property) => {
      const coords = getCoordinatesForAddress(property.address, property.city);
      const images = getArray(property.image_urls);
      const photos = getArray(property.photos);
      const displayImage = images[0] || photos[0] || "https://via.placeholder.com/400";
      const allPhotos = images.length > 0 ? images : (photos.length > 0 ? photos : [displayImage]);
      const listingType = normalizeListingType(property.property_listing_type);

      return {
        id: property.id,
        title: property.title || "Untitled Property",
        price: property.price || 0,
        location: property.city || property.address || "Unknown",
        address: property.address || "",
        city: property.city || "",
        img: displayImage,
        photos: allPhotos,
        bedrooms: property.bedrooms || "N/A",
        bathrooms: property.bathrooms || "N/A",
        type: listingType,
        ownerType: property.owner_type || "owner",
        bachelorFriendly: property.bachelor_friendly || "family",
        furnished: property.furnished || "non",
        deposit: property.deposit || 0,
        balcony: property.balcony || false,
        parking: property.parking || false,
        parkingFee: property.parking_fee || 0,
        lat: property.latitude || property.lat || coords.lat,
        lng: property.longitude || property.lng || coords.lng,
        contact: property.contact_phone || property.contact_name || "N/A",
      contactName: property.contact_name || "",
      contactEmail: property.contact_email || "",
      contactPhone: property.contact_phone || "",
      description: property.description || "",
      verified: property.verified || property.status === "approved" || false,
      area: property.area || "",
      minDuration: property.min_duration || "",
      nearbyPlaces: property.nearby_places || "",
      createdAt: property.created_at,
      packageName: property.package_name || "Silver",
      };
    });
  } catch (error) {
    console.error("Error in fetchProperties:", error);
    return [];
  }
}

/**
 * Fetch a single property by ID
 */
export async function fetchPropertyById(id) {
  try {
    console.log("fetchPropertyById called with ID:", id, "Type:", typeof id);
    
    // Handle both UUID strings and numeric IDs
    // First try with the ID as provided (works for both UUIDs and numbers)
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase error fetching property:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // If property not found, try to get all properties to see what IDs exist
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        console.log("Property not found. Checking available properties...");
        const { data: allProps } = await supabase.from("properties").select("id, title").limit(10);
        console.log("Available property IDs:", allProps?.map(p => ({ id: p.id, title: p.title })) || "No properties in database");
      }
      
      return null;
    }

    console.log("Raw property data from Supabase:", data);

    if (!data) {
      console.warn("No data returned from Supabase for ID:", id);
      // Try to get all properties to see what IDs exist
      const { data: allProps } = await supabase.from("properties").select("id, title").limit(10);
      console.log("Available property IDs:", allProps?.map(p => ({ id: p.id, title: p.title })) || "No properties in database");
      return null;
    }

    // Get coordinates based on address
    const coords = getCoordinatesForAddress(data.address, data.city);
    const images = getArray(data.image_urls);
    const photos = getArray(data.photos);
    const displayImage = images[0] || photos[0] || "https://via.placeholder.com/400";
    const allPhotos = images.length > 0 ? images : (photos.length > 0 ? photos : [displayImage]);
    const listingType = normalizeListingType(data.property_listing_type);

    // Map to frontend format
    return {
      id: data.id,
      title: data.title || "Untitled Property",
      price: data.price || 0,
      location: data.city || data.address || "Unknown",
      address: data.address || "",
      city: data.city || "",
      img: displayImage,
      photos: allPhotos,
      bedrooms: data.bedrooms || "N/A",
      bathrooms: data.bathrooms || "N/A",
      type: listingType,
      ownerType: data.owner_type || "owner",
      bachelorFriendly: data.bachelor_friendly || "family",
      furnished: data.furnished || "non",
      deposit: data.deposit || 0,
      balcony: data.balcony || false,
      parking: data.parking || false,
      parkingFee: data.parking_fee || 0,
      lat: data.latitude || data.lat || coords.lat,
      lng: data.longitude || data.lng || coords.lng,
      contact: data.contact_phone || data.contact_name || "N/A",
      contactName: data.contact_name || "",
      contactEmail: data.contact_email || "",
      contactPhone: data.contact_phone || "",
      description: data.description || "",
      verified: data.verified || data.status === "approved" || false,
      area: data.area || "",
      minDuration: data.min_duration || "",
      nearbyPlaces: data.nearby_places || "",
      createdAt: data.created_at,
      packageName: data.package_name || "Silver", // Default to Silver if not specified
      user_id: data.user_id || data.created_by,
      created_by: data.created_by
    };
  } catch (error) {
    console.error("Error in fetchPropertyById:", error);
    return null;
  }
}

