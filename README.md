# Elite Nest - House Rent and PG Management Platform

A comprehensive rental and property management platform inspired by Nestaway.com, built with React, Vite, and Supabase.

## Features

### 🏠 Property Management
- **Advanced Search & Filters**: Search by location, budget, BHK, rent/sale, owner/builder type
- **Map-Based Search**: Interactive map view for location-based property discovery
- **Property Types**: Support for apartments, houses, PGs, co-living spaces
- **Detailed Listings**: High-quality photo uploads, verified properties, amenities details

### 👥 User Roles
- **Tenants**: Browse properties, book visits, pay rent, submit maintenance requests
- **Property Owners**: List properties, manage listings, track bookings, handle maintenance
- **Administrators**: Platform management and oversight

### 📅 Booking & Scheduling
- **Visit Bookings**: Real-time calendar for scheduling property visits
- **Appointment Fees**: Secure payment for booking confirmations
- **Digital Agreements**: Online rental agreements and contracts

### 💳 Payments & Transactions
- **Online Rent Payments**: Secure rent collection system
- **Booking Fees**: Payment integration for visit bookings
- **Transaction History**: Complete payment tracking

### 🔧 Maintenance Management
- **Request System**: Tenants can submit maintenance requests
- **Tracking**: Real-time status updates and resolution tracking
- **Owner Dashboard**: Centralized maintenance management

### 📊 Dashboards
- **Tenant Dashboard**: Saved properties, rent status, maintenance requests
- **Owner Dashboard**: Listing analytics, booking management, revenue tracking
- **Admin Dashboard**: Platform-wide statistics and management

### 🎯 Advanced Features
- **Location-Based Recommendations**: Personalized property suggestions
- **Bachelor-Friendly Filtering**: Categories for family, boys, girls, shared
- **Furnishing Options**: Fully, semi, non-furnished properties
- **Amenities**: Balcony, parking, deposit details
- **Verification System**: Trusted property listings

## Tech Stack

- **Frontend**: React 19, Vite, React Router
- **Styling**: CSS Modules, Framer Motion
- **Backend**: Supabase (Database, Auth, Storage)
- **Maps**: React Leaflet
- **Payments**: Stripe integration (planned)
- **Calendar**: React Calendar
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd elitenest
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project
   - Update `src/supabase.js` with your project URL and anon key
   - Create the necessary database tables (properties, users, bookings, etc.)

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5174](http://localhost:5174) in your browser

## Database Schema

### Properties Table
- id, title, type, location, price, deposit, bedrooms, bathrooms
- furnished, bachelor_friendly, balcony, parking, parking_fee
- owner_type, verified, images, contact_info

### Users Table
- id, email, role (tenant/owner/admin), profile_info

### Bookings Table
- id, property_id, user_id, date, time, status, payment_status

### Maintenance Requests Table
- id, property_id, user_id, description, status, priority

## Key Components

- `App.jsx`: Main application with routing
- `PropertiesPage.jsx`: Property search and filtering
- `PropertyDetailsPage.jsx`: Detailed property view with booking
- `PropertyForm.jsx`: Property listing form for owners
- `Dashboard.jsx`: Tenant dashboard

- `LoginPage.jsx`: Authentication
- `HomePage.jsx`: Landing page with featured properties

## API Integration

- **Supabase Auth**: User authentication and authorization
- **Supabase Database**: CRUD operations for properties, users, bookings
- **Supabase Storage**: File uploads for property images
- **Stripe**: Payment processing (to be implemented)
- **Leaflet Maps**: Location services

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to your preferred hosting service (Vercel, Netlify, etc.)

3. Set up environment variables for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@elitenest.com or create an issue in the repository.

---

Built with ❤️ for seamless rental experiences