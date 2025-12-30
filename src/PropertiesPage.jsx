import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProperties } from "./utils/properties";
import { supabase } from "./supabase";
import "./App.css";
import { MapPin, Filter, Search } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ------------------ PROPERTIES PAGE ------------------
function PropertiesPage() {
  // 1. Initialize useNavigate
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    type: '',
    ownerType: '',
    bachelorFriendly: '',
    furnished: '',
    balcony: '',
    parking: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

  // Fetch properties from database
  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      const data = await fetchProperties();
      setProperties(data);
      setFilteredProperties(data);
      setLoading(false);
    };
    loadProperties();
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = properties.filter(property => {
      if (filters.location && !property.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.minPrice && property.price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && property.price > parseInt(filters.maxPrice)) return false;
      if (filters.bedrooms && property.bedrooms !== filters.bedrooms) return false;
      if (filters.type && property.type !== filters.type) return false;
      if (filters.ownerType && property.ownerType !== filters.ownerType) return false;
      if (filters.bachelorFriendly && property.bachelorFriendly !== filters.bachelorFriendly) return false;
      if (filters.furnished && property.furnished !== filters.furnished) return false;
      if (filters.balcony && property.balcony !== (filters.balcony === 'true')) return false;
      if (filters.parking && property.parking !== (filters.parking === 'true')) return false;
      return true;
    });
    setFilteredProperties(filtered);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 2. Define the click handler - no auth check needed since page is protected
  const handleViewDetailsClick = (propertyId) => {
    // Since PropertiesPage is wrapped in ProtectedRoute, user is already authenticated
    // Just navigate directly to the property details page
    navigate(`/properties/${propertyId}`);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '18px'
      }}>
        Loading properties...
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2>No properties found</h2>
        <p>There are no properties available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="properties-page" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Filter Sidebar */}
      <div style={{
        width: showFilters ? '300px' : '0',
        overflow: 'hidden',
        transition: 'width 0.3s',
        backgroundColor: '#f8f9fa',
        padding: showFilters ? '20px' : '0',
        borderRight: '1px solid #ddd'
      }}>
        <h3>Filters</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={filters.location}
            onChange={handleFilterChange}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              name="minPrice"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={handleFilterChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
            />
            <input
              type="number"
              name="maxPrice"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
            />
          </div>
          <select name="bedrooms" value={filters.bedrooms} onChange={handleFilterChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">All BHK</option>
            <option value="1 BHK">1 BHK</option>
            <option value="2 BHK">2 BHK</option>
            <option value="3 BHK">3 BHK</option>
            <option value="4 BHK">4 BHK</option>
            <option value="Shared">Shared</option>
          </select>
          <select name="type" value={filters.type} onChange={handleFilterChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">All Types</option>
            <option value="rent">Rent</option>
            <option value="sale">Sale</option>
            <option value="pg">PG/Co-living</option>
          </select>
          <select name="ownerType" value={filters.ownerType} onChange={handleFilterChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">All Owners</option>
            <option value="owner">Owner</option>
            <option value="builder">Builder</option>
          </select>
          <select name="bachelorFriendly" value={filters.bachelorFriendly} onChange={handleFilterChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">All Categories</option>
            <option value="family">Family</option>
            <option value="boys">Boys</option>
            <option value="girls">Girls</option>
            <option value="shared">Shared</option>
          </select>
          <select name="furnished" value={filters.furnished} onChange={handleFilterChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">All Furnishing</option>
            <option value="fully">Fully Furnished</option>
            <option value="semi">Semi Furnished</option>
            <option value="non">Non Furnished</option>
          </select>
          <select name="balcony" value={filters.balcony} onChange={handleFilterChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">Balcony</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          <select name="parking" value={filters.parking} onChange={handleFilterChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">Parking</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        <header style={{
          padding: "20px",
          paddingTop: "100px",
          textAlign: "center",
          color: "#333",
          backgroundColor: "#fff",
          borderBottom: "1px solid #ddd"
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>All Properties</h1>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setViewMode('grid')} style={{ padding: '10px', backgroundColor: viewMode === 'grid' ? '#1e40af' : '#ddd', color: viewMode === 'grid' ? '#fff' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Grid View
              </button>
              <button onClick={() => setViewMode('map')} style={{ padding: '10px', backgroundColor: viewMode === 'map' ? '#1e40af' : '#ddd', color: viewMode === 'map' ? '#fff' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Map View
              </button>
              <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '10px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                <Filter size={20} /> Filters
              </button>
            </div>
          </div>
          <p>Browse through all available properties</p>
        </header>

        {/* Properties Content */}
        {viewMode === 'grid' ? (
          <section className="properties-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            padding: "20px",
          }}>
            {filteredProperties.map((property) => (
              <div key={property.id} className="property-card" style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
              }}>
                <img src={property.img} alt={property.title} style={{ width: "100%", height: "200px", objectFit: "cover", cursor: "pointer" }} onClick={() => handleViewDetailsClick(property.id)} />
                <div style={{ padding: "10px" }}>
                  <h3>{property.title}</h3>
                  <p>₹{property.price.toLocaleString()}{property.type === 'sale' ? '' : '/month'} • {property.location}</p>
                  <p>{property.bedrooms} • {property.furnished} • {property.bachelorFriendly}</p>
                  {property.verified && <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Verified</span>}
                  
                  <button 
                    onClick={() => handleViewDetailsClick(property.id)}
                    style={{
                      marginTop: "10px",
                      padding: "8px 12px",
                      backgroundColor: "#1e40af",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = "#2563eb"}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = "#1e40af"}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredProperties.map((property) => (
                <Marker key={property.id} position={[property.lat, property.lng]}>
                  <Popup>
                    <div>
                      <h3>{property.title}</h3>
                      <p>₹{property.price.toLocaleString()}{property.type === 'sale' ? '' : '/month'}</p>
                      <p>{property.location}</p>
                      <button 
                        onClick={() => handleViewDetailsClick(property.id)}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "#1e40af",
                          color: "#fff",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer"
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertiesPage;