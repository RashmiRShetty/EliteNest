import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import '../Dashboard_Popup.css';

const PropertyActionMenu = ({ property, onDelete, onEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsOpen(!isOpen);
  };

  return (
    <div className="action-menu-container" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button 
        className={`action-menu-trigger ${isOpen ? 'active' : ''}`} 
        onClick={toggleMenu}
        type="button"
        title="More options"
      >
        <Icons.MoreVertical size={20} />
      </button>
      
      <div className={`action-popup ${isOpen ? 'visible' : ''}`}>
        <button className="action-item">
           <Icons.Edit size={16} /> Edit Listing
        </button>
        
        <button 
          className="action-item delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(property.id);
            setIsOpen(false);
          }}
        >
           <Icons.Trash size={16} /> Delete Listing
        </button>
      </div>
    </div>
  );
};

export default PropertyActionMenu;
