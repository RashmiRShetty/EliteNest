import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "./supabase";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import "./Dashboard.css";
import "./MyListingsNew.css";
import PropertyActionMenu from "./components/PropertyActionMenu";
import EditPropertyModal from "./components/EditPropertyModal";
import "./components/PaymentModal.css"; // Import shared payment modal styles
import { Shield, Crown, Sparkles, Check } from "lucide-react";

// Icons
const Icons = {
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Property: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>,
  Clipboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Heart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Message: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
  Edit: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Wallet: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Bed: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>,
  Bath: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-1.5C4.09 2 3 3 3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5l-3-3"></path><line x1="10" y1="19" x2="21" y2="19"></line></svg>,
  Maximize: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>,
  TrendingUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

// Helper to safely parse image arrays/strings
const getArray = (val) => {
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

export default function MyListingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('elitenest:sidebarCollapsed') === '1';
    } catch {
      return true;
    }
  });
  const navigate = useNavigate();
  const location = useLocation();
  
  // Handle deep linking from notifications
  useEffect(() => {
    if (properties.length > 0) {
      if (location.state?.reviewPropertyId) {
        const propertyToReview = properties.find(p => p.id === location.state.reviewPropertyId);
        if (propertyToReview) {
          setReviewProperty(propertyToReview);
        }
      } else if (location.state?.reviewPropertyTitle) {
        // Fallback: Try to find by title if ID is missing (old notifications)
        const propertyToReview = properties.find(p => p.title === location.state.reviewPropertyTitle);
        if (propertyToReview) {
           setReviewProperty(propertyToReview);
        }
      }
    }
  }, [location.state, properties]);
  
  // Filtering & Sorting State
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Stats State
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    totalValue: 0
  });
  
  const [unreadCount, setUnreadCount] = useState(0);

  const [reviewProperty, setReviewProperty] = useState(null);
  const [editProperty, setEditProperty] = useState(null);
  const [hasEditedReview, setHasEditedReview] = useState(false);
  const [repostProperty, setRepostProperty] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [viewDetailsPackage, setViewDetailsPackage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showPackageSelection, setShowPackageSelection] = useState(false);

  const packages = [
    {
      id: 'silver',
      name: 'Silver',
      price: '₹299',
      period: '',
      validityDays: 15,
      features: [
        'Listed for 15 Days',
        '5 Photos Limit',
        'Basic Support'
      ],
      isPopular: false
    },
    {
      id: 'gold',
      name: 'Gold',
      price: '₹499',
      period: '',
      validityDays: 30,
      features: [
        'Featured Badge',
        'Top of Search Results',
        'Listed for 30 Days',
        '10 Photos Limit',
        'Priority Support',
        'Verified Tag'
      ],
      isPopular: true
    },
    {
      id: 'platinum',
      name: 'Platinum',
      price: '₹999',
      period: '',
      validityDays: 45,
      features: [
        'All Gold Features',
        'Listed for 45 Days',
        'Unlimited Photos',
        'Social Media Promotion',
        'Email Blast to Buyers',
        'Dedicated Agent'
      ],
      isPopular: false
    }
  ];

  useEffect(() => {
    const loadUserListings = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate("/loginpage");
          return;
        }

        setUser(currentUser);

        // Fetch properties
        let { data, error } = await supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching properties:", error);
          // Fallback query logic if needed
          const { data: filteredData } = await supabase
            .from("properties")
            .select("*")
            .or(`user_id.eq.${currentUser.id},created_by.eq.${currentUser.id},contact_email.eq.${currentUser.email}`);
          data = filteredData;
        }

        const userProperties = (data || []).filter(property => {
          return (
            property.user_id === currentUser.id ||
            property.created_by === currentUser.id ||
            property.contact_email === currentUser.email
          );
        });

        setProperties(userProperties);
        
        // Calculate Stats
        const totalVal = userProperties.reduce((acc, curr) => acc + (curr.price || 0), 0);
        
        // Helper to check expiry for stats
        const checkExpiry = (p) => {
          if (p.status !== "approved") return false;
          const createdAt = new Date(p.created_at);
          const now = new Date();
          const pkg = (p.package_name || "Silver").toLowerCase();
          let validityDays = 15;
          if (pkg === "gold") validityDays = 30;
          else if (pkg === "platinum") validityDays = 45;
          const expiryDate = new Date(createdAt);
          expiryDate.setDate(createdAt.getDate() + validityDays);
          return now > expiryDate;
        };

        setStats({
          total: userProperties.length,
          active: userProperties.filter(p => p.status === "approved" && !checkExpiry(p)).length,
          pending: userProperties.filter(p => p.status === "pending").length,
          totalValue: totalVal
        });

      } catch (error) {
        console.error("Error loading listings:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserListings();
  }, [navigate]);

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

  const handleDelete = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

      if (error) throw error;

      setProperties(prev => prev.filter(p => p.id !== propertyId));
      alert("Listing deleted successfully!");
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Failed to delete listing. Please try again.");
    }
  };

  const handlePostNow = async (property) => {
    // Fetch fresh data to ensure approval_count is up to date
    try {
      const { data, error } = await supabase
              .from("properties")
              .select("*, approval_count") // Explicitly ask for it
              .eq("id", property.id)
              .single();
        
      if (!error && data) {
        setReviewProperty(data);
      } else {
        setReviewProperty(property); // Fallback
      }
    } catch (e) {
      console.error("Error fetching fresh property:", e);
      setReviewProperty(property); // Fallback
    }
    setHasEditedReview(false);
  };

  const confirmPostNow = async () => {
    if (!reviewProperty) return;
    setShowPackageSelection(true);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const getPackageAmountPaise = (pkg) => {
    const priceStr = pkg?.price || "0";
    const numeric = parseInt(String(priceStr).replace(/[^\d]/g, ""), 10) || 0;
    return numeric * 100;
  };

  const startRazorpayPayment = async (targetProperty, pkg) => {
    if (!pkg || !targetProperty) return;
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_NgwEwXk1hnhpL6";
    setPaymentProcessing(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setPaymentProcessing(false);
      alert("Unable to load Razorpay.");
      return;
    }
    const amount = getPackageAmountPaise(pkg);
    const options = {
      key,
      amount,
      currency: "INR",
      name: "Elite Nest",
      description: `${pkg.name} Listing`,
      handler: function (response) {
        setPaymentProcessing(false);
        setShowPaymentModal(false);
        completePostProcess(targetProperty, pkg);
      },
      prefill: {
        name: targetProperty.contact_name || "",
        email: targetProperty.contact_email || "",
        contact: targetProperty.contact_phone || ""
      },
      theme: { color: "#d97706" }
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function () {
      setPaymentProcessing(false);
      alert("Payment failed.");
    });
    rzp.open();
  };

  const completePostProcess = async (targetProperty, pkg) => {
    const propertyId = targetProperty.id;
    const validityDays = pkg.validityDays;
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(now.getDate() + validityDays);

    try {
      const { error } = await supabase
        .from("properties")
        .update({ 
          status: "approved",
          package_name: pkg.name,
          created_at: now.toISOString() // Reset creation date for visibility
          // expiry_date: expiryDate.toISOString() // TODO: Uncomment after adding column
        })
        .eq("id", propertyId);

      if (error) throw error;

      setProperties(prev => prev.map(p => 
        p.id === propertyId ? { 
          ...p, 
          status: "approved", 
          package_name: pkg.name,
          created_at: now.toISOString()
        } : p
      ));
      
      setStats(prev => ({
        ...prev,
        active: prev.active + 1
      }));
      
      alert(`Property posted successfully with ${pkg.name} package! It is now visible to the public.`);
      closeModals();
    } catch (error) {
      console.error("Error posting property:", error);
      alert("Failed to post property. Please try again.");
    }
  };

  const onConfirmPayment = async () => {
    const targetProperty = reviewProperty || repostProperty;
    if (!targetProperty || !selectedPackage) return;
    await startRazorpayPayment(targetProperty, selectedPackage);
  };

  const handleEditResend = () => {
    if (reviewProperty) {
      setEditProperty(reviewProperty);
      // Do not clear reviewProperty so we can return to it
    }
  };

  const handleEditSave = (updatedProperty) => {
    setEditProperty(null);
    
    // If we have reviewProperty, we are in the Review Flow
    if (reviewProperty) {
        if (updatedProperty) {
            // If property status changed to pending (was reset), close review modal
            if (updatedProperty.status === 'pending') {
                setReviewProperty(null);
                alert("Property sent for re-approval.");
                window.location.reload();
                return;
            }
            setReviewProperty(updatedProperty);
        }
    } else {
        // Not in review flow (e.g. edited from 3-dot menu), force reload
        window.location.reload();
    }
  };

  const handleRepostClick = (property) => {
    setRepostProperty(property);
    setSelectedPackage(null);
    setShowPackageSelection(true);
  };

  const closeModals = () => {
    setReviewProperty(null);
    setRepostProperty(null);
    setSelectedPackage(null);
    setViewDetailsPackage(null);
    setShowPaymentModal(false);
    setShowPackageSelection(false);
  };

  const PackageSelectionModal = ({ targetProperty }) => {
    if (!targetProperty) return null;
    
    return (
      <div className="payment-modal-overlay" onClick={closeModals} style={{ zIndex: 1100 }}>
        <div className="payment-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
          <div className="payment-modal-header">
            <h2>Select a Listing Package</h2>
            <button onClick={closeModals} className="close-btn">&times;</button>
          </div>
          
          <div style={{ padding: '0 32px' }}>
            <p style={{ margin: "20px 0", color: "var(--text-secondary)" }}>
              Choose the best plan to post <strong>{targetProperty.title}</strong>.
            </p>
          </div>

          <div className="payment-plans-container" style={{ padding: '0 32px 32px 32px' }}>
            {packages.map((pkg) => (
              <div 
                key={pkg.id} 
                className={`plan-card ${pkg.id} ${selectedPackage?.id === pkg.id ? 'selected' : ''}`}
                onClick={() => setSelectedPackage(pkg)}
                style={{ cursor: 'pointer' }}
              >
                {pkg.isPopular && <span className="popular-badge">Most Popular</span>}
                
                <div className="plan-header">
                  <div className="plan-icon-wrapper">
                    {pkg.id === 'silver' && <Shield />}
                    {pkg.id === 'gold' && <Crown />}
                    {pkg.id === 'platinum' && <Sparkles />}
                  </div>
                </div>

                <div className="plan-name">{pkg.name}</div>
                
                <div className="plan-price">
                  {pkg.price}
                </div>

                <button 
                  type="button" 
                  className="view-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewDetailsPackage(pkg);
                  }}
                >
                  View Details
                </button>
                
                <button 
                  type="button"
                  className="select-plan-btn"
                >
                  {selectedPackage?.id === pkg.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

          <div className="payment-modal-footer" style={{ padding: '24px 32px', borderTop: '1px solid var(--border-subtle)' }}>
            <button onClick={closeModals} className="btn-secondary" style={{ marginRight: '16px' }}>Cancel</button>
            <button 
              onClick={() => setShowPaymentModal(true)}
              disabled={!selectedPackage}
              className="btn-primary"
              style={{ 
                background: selectedPackage ? "var(--primary-accent)" : "#374151",
                color: selectedPackage ? "#000" : "#9ca3af"
              }}
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PaymentModal = () => {
    const targetProperty = reviewProperty || repostProperty;
    if (!targetProperty || !selectedPackage || !showPaymentModal) return null;

    return (
      <div className="payment-modal-overlay" style={{ zIndex: 1200 }}>
        <div className="payment-modal" style={{ maxWidth: '520px', height: 'auto' }}>
          <div className="payment-modal-header">
            <h2>Payment Required</h2>
            <button onClick={() => setShowPaymentModal(false)} className="close-btn">×</button>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              {selectedPackage.name} Package for {targetProperty.title}
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              marginBottom: '24px',
              color: 'var(--text-primary)'
            }}>
              {selectedPackage.price}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowPaymentModal(false)} className="btn-secondary">Back</button>
              <button onClick={onConfirmPayment} className="btn-primary" disabled={paymentProcessing}>
                {paymentProcessing ? "Processing..." : "Pay & Post Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

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

  const getExpiryRemainingDays = (property) => {
    if (property.status !== "approved") return null;
    const createdAt = new Date(property.created_at);
    const now = new Date();
    const pkg = (property.package_name || "Silver").toLowerCase();
    let validityDays = 15;
    if (pkg === "gold") validityDays = 30;
    else if (pkg === "platinum") validityDays = 45;
    const expiryDate = new Date(createdAt);
    expiryDate.setDate(createdAt.getDate() + validityDays);
    
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredProperties = properties
    .filter(property => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        property.title?.toLowerCase().includes(searchLower) ||
        property.city?.toLowerCase().includes(searchLower) ||
        property.address?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (filter === "all") return true;
      if (filter === "active") return property.status === "approved" && !isPropertyExpired(property);
      if (filter === "pending") return property.status === "pending";
      if (filter === "sold") return property.status === "approved" && isPropertyExpired(property);
      
      return true;
    })
    .sort((a, b) => {
      if (sortOption === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortOption === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sortOption === "price_high") return (b.price || 0) - (a.price || 0);
      if (sortOption === "price_low") return (a.price || 0) - (b.price || 0);
      return 0;
    });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatPrice = (price) => {
    if (!price) return "₹0";
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString()}`;
  };

  const greeting = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  if (loading) {
    return (
      <div className="dashboard-container dark-theme">
         <div className="loading-container">
            <div className="spinner"></div>
            <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading Elite Nest...</p>
         </div>
      </div>
    );
  }

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
          <Link to="/mylistings" className="nav-item active" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Search /></span>
            <span>My Listings</span>
          </Link>
          <Link to="/favorites?tab=appointments" className="nav-item" onClick={closeSidebarOnWeb}>
            <span className="nav-icon"><Icons.Calendar /></span>
            <span>Appointment History</span>
          </Link>
          <Link to="/favorites?tab=saved" className="nav-item" onClick={closeSidebarOnWeb}>
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
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button onClick={() => { handleSignOut(); closeSidebarOnWeb(); }} className="nav-item" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}>
              <span className="nav-icon"><Icons.LogOut /></span>
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <header className="top-header">
          <div className="header-left">
            <button className="header-hamburger" onClick={toggleSidebar} aria-label="Toggle menu">
              <Icons.Menu />
            </button>
            <Link to="/" className="header-brand">
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
          <div className="header-actions">
            <Link to="/seller" className="add-listing-btn" style={{ background: "var(--primary-accent)", color: "#000", fontWeight: "bold", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", marginRight: "16px" }}>
               <Icons.Plus /> <span className="hide-mobile">Add Property</span>
            </Link>

            <div style={{ position: 'relative', marginRight: '12px' }}>
              <button 
                className="icon-btn" 
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
            <button
              className="icon-btn"
              onClick={handleSignOut}
              aria-label="Logout"
              style={{ marginRight: '12px' }}
            >
              <Icons.LogOut />
            </button>
            
            <div
              className="user-profile"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/profile')}
            >
              <div className="user-avatar">
                {greeting.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{greeting}</span>
                <span className="user-role">Landlord</span>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-page-content" style={{ padding: '32px' }}>
          
          {/* Stats Overview */}
          <div className="stats-overview">
            <div className="modern-stat-card">
              <div className="stat-icon-wrapper"><Icons.Home /></div>
              <div className="stat-content">
                <h4>Total Properties</h4>
                <div className="value">{stats.total}</div>
              </div>
            </div>
            <div className="modern-stat-card">
              <div className="stat-icon-wrapper" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)" }}><Icons.TrendingUp /></div>
              <div className="stat-content">
                <h4>Active Listings</h4>
                <div className="value">{stats.active}</div>
              </div>
            </div>
            <div className="modern-stat-card">
              <div className="stat-icon-wrapper" style={{ color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)" }}><Icons.Clipboard /></div>
              <div className="stat-content">
                <h4>Pending Review</h4>
                <div className="value">{stats.pending}</div>
              </div>
            </div>
            <div className="modern-stat-card">
              <div className="stat-icon-wrapper" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.1)" }}><Icons.Wallet /></div>
              <div className="stat-content">
                <h4>Total Value</h4>
                <div className="value">{formatPrice(stats.totalValue)}</div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="listings-toolbar">
            <div className="search-wrapper">
              <Icons.Search className="search-icon" size={18} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search by title, city, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-tabs">
              <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`tab-btn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Active</button>
              <button className={`tab-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
              <button className={`tab-btn ${filter === 'sold' ? 'active' : ''}`} onClick={() => setFilter('sold')}>Expired</button>
            </div>

            <select 
              className="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_high">Price: High to Low</option>
              <option value="price_low">Price: Low to High</option>
            </select>
          </div>

          {/* Listings Grid */}
          {filteredProperties.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ marginBottom: "20px", color: "var(--text-muted)" }}>
                <Icons.Home size={48} />
              </div>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>No properties found</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
                {searchQuery ? "Try adjusting your search or filters." : "Start building your real estate empire today."}
              </p>
              {!searchQuery && (
                <Link to="/seller">
                  <button style={{ padding: "12px 24px", background: "var(--primary-accent)", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                    Create New Listing
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <motion.div 
                className="listings-grid-modern"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <AnimatePresence>
                    {paginatedProperties.map((property) => {
                      const images = getArray(property.image_urls);
                      const photos = getArray(property.photos);
                      const displayImage = images[0] || photos[0] || 'https://via.placeholder.com/400x300?text=No+Image';
                      
                      const isExpired = isPropertyExpired(property);

                      return (
                    <motion.div 
                      key={property.id} 
                      className="listing-card-modern"
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="card-image-wrapper">
                        <img
                          src={displayImage}
                          alt={property.title}
                          className="card-image"
                        />
                        <div className={`status-badge ${
                          isExpired ? 'rejected' :
                          property.status === 'approved' ? 'approved' : 
                          property.status === 'pending' ? 'pending' : 'rejected'
                        }`}>
                          {isExpired ? 'Expired' : (property.status === 'approved' ? 'Active' : property.status)}
                        </div>
                        <div className="price-tag">
                          {formatPrice(property.price)}
                        </div>
                      </div>

                      <div className="card-content">
                        <h3 className="card-title">{property.title}</h3>
                        <div className="card-location">
                          <Icons.MapPin size={14} />
                          {property.city || property.address || "Location N/A"}
                        </div>

                        {/* Expiry Reminder */}
                        {(() => {
                          const remainingDays = getExpiryRemainingDays(property);
                          if (remainingDays !== null && remainingDays <= 3 && remainingDays > 0) {
                            return (
                              <div style={{ 
                                padding: '10px 14px', 
                                backgroundColor: 'rgba(245, 158, 11, 0.15)', 
                                borderRadius: '8px', 
                                border: '1px solid #f59e0b',
                                color: '#f59e0b',
                                fontSize: '0.85rem',
                                marginBottom: '16px',
                                marginTop: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontWeight: '600'
                              }}>
                                <Icons.AlertCircle size={18} />
                                <span>Reminder: Your {property.package_name || 'listing'} expires in {remainingDays} day{remainingDays !== 1 ? 's' : ''}.</span>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {property.status === 'rejected' && property.rejection_reason && (
                          <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                            borderRadius: '6px', 
                            border: '1px solid var(--danger-color)',
                            color: 'var(--danger-color)',
                            fontSize: '0.85rem',
                            marginBottom: '12px',
                            marginTop: '8px'
                          }}>
                            <strong>Rejection Reason:</strong> {property.rejection_reason}
                          </div>
                        )}

                        <div className="card-features">
                          <div className="feature-item" title="Bedrooms">
                            <Icons.Bed size={16} /> 
                            {property.bedrooms || "-"} Beds
                          </div>
                          <div className="feature-item" title="Bathrooms">
                            <Icons.Bath size={16} /> 
                            {property.bathrooms || "-"} Baths
                          </div>
                          <div className="feature-item" title="Area">
                            <Icons.Maximize size={16} /> 
                            {property.area ? `${property.area} sqft` : "-"}
                          </div>
                        </div>

                        <div className="card-footer">
                          {isExpired ? (
                            <button 
                              onClick={() => handleRepostClick(property)}
                              className="view-btn"
                              style={{ 
                                background: "var(--primary-accent)", 
                                color: "#000", 
                                border: "none", 
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                cursor: "pointer"
                              }}
                            >
                              <Icons.TrendingUp size={16} /> Repost
                            </button>
                          ) : property.status === 'accepted' ? (
                            <button 
                              onClick={() => handlePostNow(property)}
                              className="view-btn"
                              style={{ 
                                background: "var(--primary-accent)", 
                                color: "#000", 
                                border: "none", 
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                cursor: "pointer"
                              }}
                            >
                              <Icons.TrendingUp size={16} /> Post Now
                            </button>
                          ) : (
                            <Link 
                              to={`/properties/${property.id}`} 
                              state={{ property }} 
                              className="view-btn"
                            >
                              <Icons.Eye size={16} /> View
                            </Link>
                          )}
                          
                          <div style={{ marginLeft: "auto" }}>
                            <PropertyActionMenu 
                              property={property} 
                              onDelete={handleDelete} 
                              onEdit={(p) => setEditProperty(p)}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <button 
                    className="page-btn" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    &lt;
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    className="page-btn" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Review Modal */}
        {reviewProperty && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ background: "#fff", padding: 30, borderRadius: 12, maxWidth: "700px", width: "90%", maxHeight: "90vh", overflow: "auto", color: "#333", textAlign: "left" }}>
              <h2 style={{ marginBottom: 15, color: "#111", textAlign: "center" }}>Review Property</h2>
              <p style={{ marginBottom: 20, color: "#666", textAlign: "center" }}>
                You are about to post <strong>{reviewProperty.title}</strong>. 
                Please review all details below.
              </p>
              
              <div style={{ background: "#f9fafb", padding: 20, borderRadius: 8, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "0.95rem" }}>
                 <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid #e5e7eb", paddingBottom: "10px", marginBottom: "5px" }}>
                   <p style={{ margin: "5px 0" }}><strong>Title:</strong> {reviewProperty.title}</p>
                   <p style={{ margin: "5px 0" }}><strong>Address:</strong> {reviewProperty.address}, {reviewProperty.city}</p>
                 </div>

                 <div>
                   <p style={{ margin: "5px 0" }}><strong>Price:</strong> {formatPrice(reviewProperty.price)}</p>
                   <p style={{ margin: "5px 0" }}><strong>Type:</strong> {reviewProperty.type}</p>
                   <p style={{ margin: "5px 0" }}><strong>Area:</strong> {reviewProperty.area || "N/A"} sqft</p>
                 </div>

                 <div>
                   <p style={{ margin: "5px 0" }}><strong>Bedrooms:</strong> {reviewProperty.bedrooms || "N/A"}</p>
                   <p style={{ margin: "5px 0" }}><strong>Bathrooms:</strong> {reviewProperty.bathrooms || "N/A"}</p>
                   <p style={{ margin: "5px 0" }}><strong>Furnished:</strong> {reviewProperty.furnished_status || "N/A"}</p>
                 </div>

                 <div>
                   <p style={{ margin: "5px 0" }}><strong>Parking:</strong> {reviewProperty.parking || "N/A"}</p>
                   <p style={{ margin: "5px 0" }}><strong>Balcony:</strong> {reviewProperty.balcony || "N/A"}</p>
                   <p style={{ margin: "5px 0" }}><strong>Deposit:</strong> {reviewProperty.deposit ? `₹${reviewProperty.deposit}` : "N/A"}</p>
                 </div>

                 <div>
                   <p style={{ margin: "5px 0" }}><strong>Contact Name:</strong> {reviewProperty.contact_name || "N/A"}</p>
                   <p style={{ margin: "5px 0" }}><strong>Phone:</strong> {reviewProperty.contact_phone || "N/A"}</p>
                   <p style={{ margin: "5px 0" }}><strong>Email:</strong> {reviewProperty.contact_email || "N/A"}</p>
                 </div>

                 <div style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
                   <p style={{ margin: "5px 0" }}><strong>Description:</strong></p>
                   <p style={{ color: "#555", fontSize: "0.9rem", lineHeight: "1.4", maxHeight: "100px", overflowY: "auto", background: "#fff", padding: "10px", borderRadius: "4px", border: "1px solid #e5e7eb" }}>
                     {reviewProperty.description || "No description provided."}
                   </p>
                 </div>
                 
                 {reviewProperty.nearby_places && (
                   <div style={{ gridColumn: "1 / -1" }}>
                     <p style={{ margin: "5px 0" }}><strong>Nearby Places:</strong></p>
                     <p style={{ color: "#555", fontSize: "0.9rem" }}>{reviewProperty.nearby_places}</p>
                   </div>
                 )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button 
                  onClick={confirmPostNow}
                  style={{ 
                    padding: "12px", 
                    background: "var(--primary-accent)", 
                    color: "#000", 
                    border: "none", 
                    borderRadius: "6px", 
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                  }}
                >
                  <Icons.TrendingUp size={18} /> Post Now
                </button>
                
                {/* DEBUG: Approval Count: {reviewProperty.approval_count} */}
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  Approvals: {reviewProperty.approval_count || 0} / 2
                </div>
                {/* Logic: 0 or 1 approvals -> Allow edit. 2 or more -> Hide. */}
                {((reviewProperty.approval_count === null || reviewProperty.approval_count === undefined ? 0 : reviewProperty.approval_count) < 2) && (
                  <button 
                    onClick={handleEditResend}
                    style={{ 
                      padding: "12px", 
                      background: "#f3f4f6", 
                      color: "#374151", 
                      border: "1px solid #d1d5db", 
                      borderRadius: "6px", 
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                    }}
                  >
                    <Icons.Edit size={18} /> Edit & Resend {reviewProperty.approval_count > 0 ? "(Last Attempt)" : ""}
                  </button>
                )}
                
                <button 
                  onClick={() => setReviewProperty(null)}
                  style={{ 
                    marginTop: "10px",
                    background: "transparent",
                    border: "none",
                    color: "#6b7280",
                    cursor: "pointer",
                    textDecoration: "underline",
                    alignSelf: "center"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editProperty && (
          <EditPropertyModal 
            property={editProperty} 
            onClose={() => setEditProperty(null)} 
            onSave={handleEditSave}
            resetStatus={true} // Always reset status to pending on edit
          />
        )}

        {showPackageSelection && (
          <PackageSelectionModal targetProperty={reviewProperty || repostProperty} />
        )}

        {showPaymentModal && <PaymentModal />}

        {/* Package Details Modal */}
        {viewDetailsPackage && (
          <div className="payment-modal-overlay" style={{ zIndex: 3000 }}>
            <div className="payment-modal" style={{ maxWidth: '500px', height: 'auto', maxHeight: '90vh' }}>
              <div className="payment-modal-header">
                <h2>{viewDetailsPackage.name} Package</h2>
                <button onClick={() => setViewDetailsPackage(null)} className="close-btn">&times;</button>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: 'var(--text-primary, #fff)'
                }}>
                  {viewDetailsPackage.price}
                </div>
                <div style={{ 
                  color: 'var(--text-secondary, #9ca3af)', 
                  marginBottom: '24px' 
                }}>
                  {viewDetailsPackage.period}
                </div>
                
                <ul className="plan-features" style={{ margin: 0 }}>
                  {viewDetailsPackage.features.map((feature, index) => (
                    <li key={index} style={{ marginBottom: '12px' }}>
                      <Check size={20} style={{ marginRight: '12px', color: 'var(--success-color, #10b981)' }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => {
                    setSelectedPackage(viewDetailsPackage);
                    setViewDetailsPackage(null);
                  }}
                  className="select-plan-btn"
                  style={{ 
                    marginTop: '32px',
                    background: 'var(--primary-accent, #d97706)',
                    color: '#000',
                    border: 'none'
                  }}
                >
                  Select This Plan
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
