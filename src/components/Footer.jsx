import React, { useState, useEffect } from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";

export default function Footer() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  const [feedbackData, setFeedbackData] = useState([
    {
      id: 1,
      name: "Anita K",
      rating: 5,
      text: "Great service — sold my flat in 2 weeks! The team was professional and handled everything smoothly.",
      date: "28/1/2026",
    },
    {
      id: 2,
      name: "Rahul M",
      rating: 5,
      text: "I found my dream home through Elite Nest. The verification process gave me peace of mind.",
      date: "27/1/2026",
    },
    {
      id: 3,
      name: "Sarah J",
      rating: 4,
      text: "Excellent support team. They helped me negotiate a great deal for my new apartment.",
      date: "25/1/2026",
    },
  ]);

  useEffect(() => {
    fetchFeedback();
    getUser();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
      if (fullName) setName(fullName);
    }
  };

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching feedback:", error);
        return;
      }

      if (data && data.length > 0) {
        const formatted = data.map(item => ({
          id: item.id,
          name: item.name,
          rating: item.rating,
          text: item.message,
          date: new Date(item.created_at).toLocaleDateString()
        }));
        setFeedbackData(formatted);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim() || rating === 0) {
      alert("Please fill in your name, message and rating.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert([
        {
          name: name,
          message: message,
          rating: rating,
          user_id: user?.id || null
        }
      ]);

      if (error) throw error;

      alert("Thank you for your feedback!");
      setMessage("");
      setRating(0);
      // Keep name if user is logged in, but maybe clear if it was manually entered? 
      // Actually, better to keep it if it was pre-filled. 
      // I'll just clear message and rating.
      
      fetchFeedback(); // Refresh the list
      // Reset slide to 0 to show the new feedback
      setCurrentSlide(0);
    } catch (err) {
      alert("Error submitting feedback: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % feedbackData.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + feedbackData.length) % feedbackData.length);
  };

  return (
    <footer className="footer-container">
      {/* Customer Feedback Section */}
      <div className="feedback-section">
        
        {/* Carousel Column */}
        <div className="feedback-column">
          <h2 className="feedback-title">Customer Feedback</h2>
          <div className="feedback-carousel">
            <button className="carousel-nav-btn" onClick={prevSlide} disabled={feedbackData.length <= 1}>
              &lt;
            </button>
            
            <div className="carousel-viewport">
              <div 
                className="carousel-track" 
                style={{ transform: `translateX(-${currentSlide * 100}%)`, gap: '0' }}
              >
                {feedbackData.map((item) => (
                  <div key={item.id} className="feedback-card">
                    <h3 className="user-name">{item.name}</h3>
                    <div className="star-rating">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ color: i < item.rating ? 'var(--footer-gold-light)' : '#444' }}>★</span>
                      ))}
                    </div>
                    <p className="review-text">{item.text}</p>
                    <span className="review-date">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="carousel-nav-btn" onClick={nextSlide} disabled={feedbackData.length <= 1}>
              &gt;
            </button>
          </div>
          <div className="carousel-dots">
            {feedbackData.map((_, idx) => (
              <div 
                key={idx} 
                className={`dot ${currentSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              ></div>
            ))}
          </div>
        </div>

        {/* Send Feedback Column */}
        <div className="feedback-column">
          <h2 className="feedback-title">Send Feedback</h2>
          <form className="feedback-form" onSubmit={handleSubmit}>
            <input 
              type="text" 
              className="form-input"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            
            <textarea 
              className="form-textarea" 
              placeholder="Tell us about your experience"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
            
            <div className="rating-input-group">
              <label className="rating-label">Rating</label>
              <div className="interactive-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`interactive-star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className="send-btn" disabled={submitting}>
              {submitting ? "Sending..." : "Send Feedback"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Links Section */}
      <div className="footer-links-container">
        {/* About Column */}
        <div className="footer-col">
          <h3>About Elite Nest</h3>
          <p className="footer-text">
            About Elite Nest is a highest brand for properties, anti-investment commercial revenue and compartite home.
          </p>
          <div className="badges">
            <span className="badge">Verified Listings</span>
            <span className="badge">24/7 Support</span>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-col">
          <h3>Quick Links</h3>
          <ul className="footer-links-list">
            <li><Link to="/properties">Properties</Link></li>
            <li><Link to="/seller">Sell Property</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/about">About Us</Link></li>
          </ul>
        </div>

        {/* Contact Column */}
        <div className="footer-col">
          <h3>Contact</h3>
          <div className="contact-info">
            <p><strong>Elite Nest Pvt. Ltd.</strong></p>
            <p>Poornaprajna Institute Of Management Udupi</p>
            <p>elitenest07@gmail.com</p>
            <p>+91 8970431369<br />+91 80505 62765</p>
          </div>
        </div>
      </div>
    </footer>
  );
}