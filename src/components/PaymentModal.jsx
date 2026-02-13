import React from 'react';
import './PaymentModal.css';
import { Check, X } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, onSelectPackage }) => {
  if (!isOpen) return null;

  const packages = [
    {
      id: 'silver',
      name: 'Silver',
      price: '₹299',
      period: '',
      features: [
        'Standard Listing',
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

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>Boost Your Listing</h2>
          <button className="close-btn" onClick={() => onClose()}>×</button>
        </div>
        
        <div className="payment-plans-container">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`plan-card ${pkg.isPopular ? 'featured' : ''}`}>
              {pkg.isPopular && <span className="popular-badge">Most Popular</span>}
              <div className="plan-name">{pkg.name}</div>
              <div className="plan-price">
                {pkg.price}
                {pkg.period && <span>{pkg.period}</span>}
              </div>
              <ul className="plan-features">
                {pkg.features.map((feature, index) => (
                  <li key={index}>
                    <Check size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                className="select-plan-btn"
                onClick={() => onSelectPackage(pkg)}
              >
                Select {pkg.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
