# Salon Pro - Barbershop Management System

## Overview
A complete barbershop management system with a public landing page, admin dashboard, POS system, booking management, inventory tracking, financial reports, and barber commission tracking.

## Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Shadcn UI, Wouter routing, TanStack Query
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: Vite

## Architecture
- `client/src/pages/landing.tsx` - Public landing page with hero, services, booking, gallery, contact
- `client/src/pages/admin/` - Admin dashboard pages
  - `layout.tsx` - Sidebar layout for admin
  - `dashboard.tsx` - Overview stats
  - `bookings.tsx` - Booking management
  - `pos.tsx` - Point of Sale (tablet-optimized)
  - `services-page.tsx` - Service CRUD
  - `barbers.tsx` - Barber CRUD with commission
  - `products-page.tsx` - Product/inventory management
  - `expenses.tsx` - Expense tracking
  - `reports.tsx` - Financial reports
  - `gallery-page.tsx` - Gallery image management
- `server/routes.ts` - API routes
- `server/storage.ts` - Database storage layer
- `server/db.ts` - Database connection
- `server/seed.ts` - Seed data
- `shared/schema.ts` - Drizzle schemas and types

## Database Tables
- services, barbers, bookings, products
- transactions, transaction_items, transaction_products
- expenses, gallery_images

## Key Features
1. Landing page with online booking
2. Available time slot calculation based on service duration
3. POS system for walk-in customers (tablet-optimized)
4. Barber commission tracking (services only, not products)
5. Product inventory with auto stock decrement
6. Expense tracking by category
7. Financial reports with date range filtering
8. Gallery management

## Theme
- Warm amber/gold primary color (#C48A0A equivalent)
- Plus Jakarta Sans font
- Dark/light mode support
