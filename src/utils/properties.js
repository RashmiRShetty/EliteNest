// src/utils/properties.js
import { supabase } from "../supabase";

/**
 * Fetch all properties from Supabase
 * Maps database fields to the format expected by the frontend
 */
export async function fetchProperties() {
  try {
    // Fetch all properties first, then filter client-side for visibility
    // Properties become visible after payment is completed (payment_status="paid")
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error);
      return [];
    }

    // Filter to show ONLY properties that have successful payment
    // Check status = "approved" (which is set after payment)
    // Also check payment_status = "paid" if column exists
    // This ensures only paid properties are visible to all users
    const visibleProperties = (data || []).filter(property => 
      property.status === "approved" || property.payment_status === "paid"
    );

    // Map database fields to frontend format
    return visibleProperties.map((property) => ({
      id: property.id,
      title: property.title || "Untitled Property",
      price: property.price || 0,
      location: property.city || property.address || "Unknown",
      address: property.address || "",
      city: property.city || "",
      img: property.image_urls?.[0] || "https://via.placeholder.com/400",
      photos: property.image_urls || [property.image_urls?.[0] || "https://via.placeholder.com/400"],
      bedrooms: property.bedrooms || "N/A",
      bathrooms: property.bathrooms || "N/A",
      type: property.property_listing_type?.toLowerCase() || "rent", // Lease, Sell, Rent -> rent, sale, rent
      ownerType: property.owner_type || "owner",
      bachelorFriendly: property.bachelor_friendly || "family",
      furnished: property.furnished || "non",
      deposit: property.deposit || 0,
      balcony: property.balcony || false,
      parking: property.parking || false,
      parkingFee: property.parking_fee || 0,
      lat: property.latitude || property.lat || 20.5937, // Default to India center
      lng: property.longitude || property.lng || 78.9629,
      contact: property.contact_phone || property.contact_name || "N/A",
      contactName: property.contact_name || "",
      contactEmail: property.contact_email || "",
      contactPhone: property.contact_phone || "",
      description: property.description || "",
      verified: property.verified || property.status === "approved" || false,
      area: property.area || "",
      minDuration: property.min_duration || "",
      createdAt: property.created_at,
    }));
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

    // Map to frontend format
    return {
      id: data.id,
      title: data.title || "Untitled Property",
      price: data.price || 0,
      location: data.city || data.address || "Unknown",
      address: data.address || "",
      city: data.city || "",
      img: data.image_urls?.[0] || "https://via.placeholder.com/400",
      photos: data.image_urls || [data.image_urls?.[0] || "https://via.placeholder.com/400"],
      bedrooms: data.bedrooms || "N/A",
      bathrooms: data.bathrooms || "N/A",
      type: data.property_listing_type?.toLowerCase() || "rent",
      ownerType: data.owner_type || "owner",
      bachelorFriendly: data.bachelor_friendly || "family",
      furnished: data.furnished || "non",
      deposit: data.deposit || 0,
      balcony: data.balcony || false,
      parking: data.parking || false,
      parkingFee: data.parking_fee || 0,
      lat: data.latitude || data.lat || 20.5937,
      lng: data.longitude || data.lng || 78.9629,
      contact: data.contact_phone || data.contact_name || "N/A",
      contactName: data.contact_name || "",
      contactEmail: data.contact_email || "",
      contactPhone: data.contact_phone || "",
      description: data.description || "",
      verified: data.verified || data.status === "approved" || false,
      area: data.area || "",
      minDuration: data.min_duration || "",
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error("Error in fetchPropertyById:", error);
    return null;
  }
}

