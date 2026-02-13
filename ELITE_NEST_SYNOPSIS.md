# ELITE NEST - HOUSE RENT AND PG MANAGEMENT PLATFORM

## CHAPTER - 1
## SYNOPSIS

---

## Page 1

# Elite Nest - House Rent and PG Management Platform

## 1. SYNOPSIS

### 1.1 Title of the Project

**"Elite Nest - House Rent and PG Management Platform"**

A comprehensive web-based digital marketplace platform designed to revolutionize the rental property experience by connecting property owners with potential tenants through advanced search, verified listings, secure transactions, and innovative property management features.

---

### 1.2 Objective of the Project

- **Streamline Property Discovery**: Enable tenants to easily discover and search for rental properties using advanced filters like location, budget, BHK, amenities, furnishing status, and personal preferences (bachelor-friendly, family, shared accommodations).

- **Facilitate Property Management**: Provide property owners with comprehensive tools to list, manage, update, and monitor their rental properties from a single unified platform with analytics and revenue tracking.

- **Support Secure Online Transactions**: Implement secure online payment systems for rent collection, booking fees, appointment confirmations, and maintenance-related services with complete transaction history.

- **Ensure Platform Credibility**: Build user trust through property verification systems, quality assurance checks, and trusted owner/tenant profiles with role-based access control.

- **Provide Role-Based Interface**: Create a simple, intuitive, role-based interface catering to three main user types (tenants, property owners, administrators) with built-in maintenance request tracking and real-time notifications.

- **Enable Location-Based Recommendations**: Implement map-based property discovery using interactive maps and location-based property recommendations for enhanced user experience.

- **Support Maintenance Management**: Enable efficient handling of maintenance requests from tenants with real-time status tracking and priority management for property owners.

---

### 1.3 Project Category

**Web-based Application** / Single Page Application (SPA)

---

### 1.4 Software and Hardware Requirements

#### 1.4.1 Software Requirements

| Component | Details |
|-----------|---------|
| **Operating System** | Windows 10/11, macOS 10.14+, Linux (Ubuntu 18.04+) |
| **Frontend Framework** | React 19, Vite (Build Tool) |
| **Programming Language** | JavaScript (ES6+) |
| **Backend & Database** | Supabase (PostgreSQL database with built-in authentication) |
| **Maps Service** | React Leaflet (OpenStreetMap) / Google Maps API |
| **Payment Gateway** | Stripe for secure payment processing |
| **Email Service** | EmailJS for email notifications |
| **UI Libraries** | Lucide React (Icons), Framer Motion (Animations), React Calendar |
| **IDE** | VS Code (Recommended) |
| **Version Control** | Git/GitHub |
| **Package Manager** | npm / yarn |
| **Browser** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |

#### 1.4.2 Hardware Requirements

| Component | Details |
|-----------|---------|
| **Processor** | Intel Core i3 or higher / AMD equivalent (2GHz+ recommended) |
| **Memory (RAM)** | Minimum 4GB / Recommended 8GB+ |
| **Storage Space** | Minimum 10GB free space for development environment |
| **Display Resolution** | 1366x768 pixels or higher |
| **Internet Connection** | Minimum 2 Mbps (stable connection required) |

---

## Page 2

### 1.5 Structure of the Program

#### 1.5.1 Analysis

**Elite Nest** serves as a comprehensive digital marketplace platform connecting property owners with potential tenants. The platform facilitates the complete rental lifecycle from property discovery to booking confirmation and ongoing maintenance management.

**Key Activities:**

- Property owners listing rental properties with comprehensive details (location, price, amenities, photos, verification status)
- Tenants browsing, filtering, and discovering properties using advanced search criteria
- Booking property visits with real-time calendar integration and appointment confirmation
- Secure payment processing for booking fees, rent, and maintenance services
- Location-based property recommendations using map integration
- Maintenance request submission, tracking, and resolution management
- Real-time notifications for bookings, approvals, and updates
- User authentication with role-based access control (RBAC)
- Admin oversight for property verification, user management, and platform analytics

---

#### 1.5.2 Data Structures

**Elite Nest** utilizes Supabase (PostgreSQL) for data management with the following core tables:

---

**1) Properties Table**
- Property ID (UUID - Primary Key)
- Title
- Type (Apartment, House, PG, Co-living, Villa, etc.)
- Location (Address, City, Area)
- Price (Monthly Rent)
- Deposit Amount
- Bedrooms (BHK)
- Bathrooms
- Furnished Status (Fully/Semi/Non-furnished)
- Bachelor Friendly Flag
- Amenities (Balcony, Parking, Parking Fee, etc.)
- Images (Multiple URLs/References)
- Owner Information (Contact, Owner Type)
- Verified Status (Boolean)
- Contact Information
- Created At / Updated At (Timestamps)

---

**2) Users Table**
- User ID (UUID - Primary Key)
- Email (Unique)
- Password (Encrypted)
- Role (Tenant/Owner/Admin)
- Profile Information (Name, Phone, Avatar)
- Verification Status
- KYC Status
- Created At / Updated At (Timestamps)

---

**3) Bookings Table**
- Booking ID (UUID - Primary Key)
- Property ID (Foreign Key)
- User ID (Foreign Key - Tenant)
- Property Title
- Property Location
- Property Image
- Appointment Date
- Appointment Time
- User Name
- User Email
- Mobile Number
- Proposed Dates (JSONB for multiple date options)
- Message / Special Requests
- Status (Pending, Confirmed, Rejected, Cancelled)
- Cancellation/Rejection Reason
- Created At (Timestamp)

---

**4) Maintenance Requests Table**
- Request ID (UUID - Primary Key)
- Property ID (Foreign Key)
- User ID (Foreign Key - Tenant)
- Description
- Category (Plumbing, Electrical, Cleaning, etc.)
- Priority (Low, Medium, High, Urgent)
- Status (Submitted, In-Progress, Completed, Rejected)
- Created At / Updated At (Timestamps)

---

**5) Notifications Table**
- Notification ID (UUID - Primary Key)
- User ID (Foreign Key)
- Type (Property Approved, Booking Confirmed, Request Status, etc.)
- Title
- Message
- Read Status (Boolean)
- Created At (Timestamp)

---

**6) Messages Table**
- Message ID (UUID - Primary Key)
- User ID (Foreign Key)
- Subject
- Message Content
- From Email
- Read Status (Boolean)
- Created At (Timestamp)

---

## Page 3

### 1.5.3 Module Description

#### **1) Tenant Module**

Comprehensive features enabling tenants to discover, book, and manage rental properties:

- **Property Discovery**
  - Browse and search properties with real-time filtering
  - Advanced filtering options (location, budget range, BHK, furnishing, amenities)
  - Map-based property discovery with interactive OpenStreetMap/Google Maps
  - Bachelor-friendly property categories (Family, Boys Only, Girls Only, Shared)
  - Sort by price, newest, most viewed

- **Booking & Scheduling**
  - Book property visits with calendar integration
  - Multiple date proposal system for flexible scheduling
  - Real-time appointment confirmation
  - Booking history and status tracking
  - Add special requests/notes during booking

- **Payment System**
  - Secure online payment for booking fees using Stripe
  - Transaction history and receipts
  - Payment status tracking
  - Digital payment records

- **Saved Properties**
  - Favorite/bookmark properties for later viewing
  - Manage wish list with quick access
  - Compare properties side-by-side

- **Maintenance Management**
  - Submit maintenance requests for rental issues
  - Track request status in real-time
  - Priority-based request categorization
  - Communication with property owners

- **Dashboard Features**
  - Tenant dashboard with:
    - Saved/bookmarked properties
    - Booking history
    - Active maintenance requests
    - Payment history
    - Profile management and settings

- **Notifications**
  - Real-time notifications for booking confirmations
  - Maintenance request updates
  - Property owner messages
  - Special deals and recommendations

---

#### **2) Property Owner Module**

Comprehensive tools for property owners to manage rental listings and bookings:

- **Property Listing Management**
  - Add new rental property listings with detailed information
  - Edit and update existing property information
  - Delete property listings
  - Bulk manage multiple properties
  - Mark properties as verified/unverified

- **Image Management**
  - Upload multiple high-quality property images
  - Organize property photos in galleries
  - Set featured/thumbnail images
  - Image compression and optimization

- **Booking Management**
  - View all booking requests for properties
  - Accept or reject booking requests
  - Propose alternative dates for appointments
  - View tenant details and contact information
  - Cancel appointments with reasons

- **Maintenance Request Handling**
  - View all maintenance requests from tenants
  - Prioritize requests by urgency
  - Update request status (In-Progress, Completed, Rejected)
  - Communicate with tenants about maintenance issues
  - Track maintenance history

- **Analytics & Reporting**
  - Track revenue and earnings
  - View property performance metrics
  - Monitor booking trends
  - Property verification status
  - Popular properties analytics

- **Dashboard Features**
  - Owner dashboard with:
    - Active listings summary
    - Recent bookings and requests
    - Maintenance queue
    - Revenue tracker
    - Analytics and insights
    - Property management tools

---

#### **3) Authentication & Security Module**

Robust security features protecting user data and transactions:

- **User Registration & Authentication**
  - Email-based registration with verification
  - Secure login with encrypted passwords
  - Password reset functionality via email
  - Email verification before account activation
  - Session management and logout

- **Role-Based Access Control (RBAC)**
  - Three distinct user roles: Tenant, Owner, Admin
  - Route protection based on user role
  - Feature access restrictions per role
  - Protected routes preventing unauthorized access

- **Security Measures**
  - Supabase built-in authentication (JWT tokens)
  - Row-Level Security (RLS) policies on database tables
  - Encrypted password storage
  - Secure payment processing via Stripe with PCI compliance
  - HTTPS/SSL encryption for all data in transit
  - CORS protection and security headers

- **Data Encryption & Privacy**
  - User profile data protection
  - Payment information encryption
  - Sensitive data masking (phone numbers, email)
  - GDPR-compliant data handling
  - Data retention policies

- **Email Verification & Notifications**
  - Automated email notifications for bookings
  - Password reset email confirmations
  - Booking status updates via email
  - Built-in email service (EmailJS integration)

---

#### **4) Admin Module**

Platform-wide management and oversight capabilities:

- **User Management**
  - View all users (tenants, owners, admins)
  - Verify user identities and KYC compliance
  - Suspend or deactivate user accounts
  - View user statistics and demographics
  - User role assignment and modification

- **Property Management**
  - Verify new property listings
  - Review property details and images
  - Approve or reject property listings
  - Flag suspicious or fraudulent listings
  - Monitor property verification status

- **System Statistics & Analytics**
  - Dashboard with platform-wide metrics:
    - Total users, properties, bookings
    - Revenue statistics
    - Monthly growth trends
    - Popular properties and locations
    - User activity analytics

- **Maintenance Management**
  - Monitor all maintenance requests across platform
  - Escalate urgent issues
  - Track maintenance completion rates
  - Generate maintenance reports

- **Content Management**
  - Manage notifications and announcements
  - Create system-wide messages
  - Email broadcast capabilities
  - FAQs and help content management

- **Admin Dashboard**
  - Comprehensive platform overview
  - Real-time statistics and metrics
  - User and property management
  - Booking and maintenance tracking
  - System health monitoring
  - Access control and settings

---

## Page 4

### 1.6 Limitations

**Current Version Limitations:**

- **Internet Dependency**: Requires stable internet connection for optimal platform performance. Offline functionality not currently supported.

- **Property Verification Process**: Manual verification process for new property listings may require time for validation and approval before becoming visible to tenants.

- **Payment Gateway Dependency**: Payment processing depends on third-party Stripe service availability and their service uptime.

- **Mobile App Support**: Native mobile applications (iOS/Android) not yet implemented. Currently accessible only through web browsers.

- **Real-time Limitations**: Real-time features depend on Supabase Realtime subscription and may have latency during peak usage.

- **Geographic Restrictions**: Currently optimized primarily for location-based services using OpenStreetMap/Google Maps integration.

- **File Upload Limits**: Property image uploads have size restrictions based on Supabase storage quotas.

- **Scalability**: May require optimization and load balancing at very high traffic volumes.

- **Browser Compatibility**: Requires modern browsers with JavaScript support. Legacy browser support not guaranteed.

- **Data Backup**: Regular data backups depend on Supabase infrastructure and policies.

---

### 1.7 Future Scope of the Project

**Planned Enhancements & Expansion:**

- **Mobile Applications**
  - Development of native iOS application for Apple devices
  - Development of native Android application for mobile phones
  - Progressive Web App (PWA) for offline functionality

- **Advanced Features**
  - AI-powered property recommendation engine based on user preferences and behavior
  - Machine learning for fraud detection and prevention
  - Automated rent payment reminders and tracking
  - Digital rental agreements with e-signature capability
  - Smart contract integration for secure transactions

- **Virtual & Augmented Reality**
  - 360-degree property virtual tours
  - 3D property walkthroughs
  - Virtual reality (VR) property viewing
  - Augmented reality (AR) furniture placement preview

- **Expanded Property Types**
  - Commercial property rentals (offices, shops, warehouses)
  - Co-working spaces management
  - Parking space rentals
  - Storage unit rentals

- **Tenant Verification**
  - Tenant credit scoring system
  - Background check integration
  - Employment verification
  - Reference checking system
  - Rental payment history tracking

- **Financial Features**
  - Automated rent collection and reminders
  - GST/Tax calculation for property owners
  - Rent receipt generation
  - Financial reports and statements
  - Integration with accounting software

- **Internationalization**
  - Multi-language support (Spanish, Hindi, Mandarin, etc.)
  - Multi-currency support for international users
  - Localized content and regulations
  - Regional property categories

- **Smart Home Integration**
  - Smart lock access for property viewings
  - IoT device control for properties
  - Smart thermostat integration
  - Connected security systems
  - Energy monitoring dashboards

- **Community Features**
  - Neighborhood ratings and reviews
  - Tenant community forums
  - Property owner networking
  - Local service provider directory
  - Moving assistance services

- **Advanced Analytics**
  - Price trend analysis for market insights
  - Rental demand forecasting
  - Investment return calculations
  - Competitor property analysis
  - Market research reports

- **API & Integration**
  - Third-party API access for integrations
  - CRM system integration
  - Accounting software integration
  - Video conferencing integration for virtual tours
  - Social media integration

---

## Page 5

### 1.8 Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19.2.0 |
| **Build Tool** | Vite | 7.2.4 |
| **Routing** | React Router DOM | 7.9.6 |
| **State Management** | React Hooks | Native |
| **Styling** | CSS Modules / CSS3 | Latest |
| **Animations** | Framer Motion | 12.23.25 |
| **Maps** | React Leaflet | 5.0.0 |
| **Calendar** | React Calendar | 6.0.0 |
| **Icons** | Lucide React | 0.555.0 |
| **Backend** | Supabase | 2.86.0 |
| **Database** | PostgreSQL | Supabase managed |
| **Authentication** | Supabase Auth | JWT based |
| **Storage** | Supabase Storage | Cloud based |
| **Payment** | Stripe | 8.6.0 |
| **Email Service** | EmailJS | 4.4.1 |
| **Development** | Node.js | 16+ |
| **Package Manager** | npm / yarn | Latest |

---

### 1.9 Project Structure

```
elite-nest/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Alert.jsx
│   │   ├── Footer.jsx
│   │   ├── PaymentModal.jsx
│   │   ├── PropertyActionMenu.jsx
│   │   ├── EditPropertyModal.jsx
│   │   └── ...
│   │
│   ├── pages/              # Page components (routes)
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegistrationPage.jsx
│   │   ├── PropertiesPage.jsx
│   │   ├── PropertyDetailsPage.jsx
│   │   ├── PropertyForm.jsx
│   │   ├── Dashboard.jsx
│   │   ├── MyListingsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── FavoritesPage.jsx
│   │   ├── MessagesPage.jsx
│   │   ├── ContactPage.jsx
│   │   └── ...
│   │
│   ├── Admin/              # Admin module
│   │   ├── AdminDashboard.jsx
│   │   └── AdminLanding.jsx
│   │
│   ├── utils/              # Utility functions
│   │   └── properties.js
│   │
│   ├── supabase.js         # Supabase configuration
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── styles/             # Global styles
│
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── eslint.config.js        # ESLint configuration
└── supabase_schema.sql     # Database schema
```

---

### 1.10 Key Features Implementation Status

| Feature | Status | Description |
|---------|--------|-------------|
| Property Listing | ✅ Completed | Full property listing and management |
| User Authentication | ✅ Completed | Email/password with role-based access |
| Property Search & Filter | ✅ Completed | Advanced filtering with multiple criteria |
| Map Integration | ✅ Completed | Location-based property discovery |
| Booking System | ✅ Completed | Property visit bookings with calendar |
| Payment Integration | ✅ Completed | Stripe payment processing |
| User Dashboard | ✅ Completed | Tenant, Owner, and Admin dashboards |
| Maintenance Requests | ✅ Completed | Request submission and tracking |
| Notifications | ✅ Completed | Real-time notifications system |
| Email Notifications | ✅ Completed | EmailJS integration for alerts |
| Admin Panel | ✅ Completed | Platform management tools |
| Responsive Design | ✅ Completed | Mobile-friendly interface |

---

## Conclusion

**Elite Nest** represents a comprehensive, production-ready platform for rental property management. Built with modern technologies (React 19, Vite, and Supabase), the platform provides a seamless experience for all stakeholders - tenants, property owners, and administrators. With robust security measures, secure payment processing, and intuitive user interfaces, Elite Nest is positioned to revolutionize the rental property discovery and management industry.

The platform's scalable architecture and clear roadmap for future enhancements ensure long-term viability and market competitiveness.

---

**Document Version**: 1.0  
**Last Updated**: February 13, 2026  
**Status**: Active Development