# AboutTrain 🚆

AI-assisted railway journey decision-support platform for analyzing train availability, confirmation probability, alternatives, and travel options in India.

## Project Overview

**AboutTrain** is a modern decision-support tool designed to help users navigate the complexities of the Indian railway ticketing system. Rather than being a booking portal, it focuses entirely on **probability, analysis, and trip planning**, helping users make informed decisions before attempting to book a ticket elsewhere.

### Problem Statement
Indian railway tickets frequently end up on Waitlists (WL) or Reservation Against Cancellation (RAC). Passengers often have no clear way to gauge whether their ticket will ultimately clear, leading to travel anxiety and poor decision-making. 

### Solution & Core Features
AboutTrain provides:
- **Station Search & Route Planning**: Find trains connecting any two stations using a robust, debounced API.
- **Availability Snapshots**: View exact waitlist numbers, RAC counts, and available seats.
- **Confirmation Probability**: Get an estimated chance of a waitlisted ticket clearing.
- **Travel Insights**: Discover historical patterns, the best classes to book, and clearance rates.
- **Saved Journeys**: Authenticated users can save and monitor upcoming trips.

> **Disclaimer**: AboutTrain is a decision-support tool. It does NOT implement automated railway booking, CAPTCHA bypass, or unauthorized scraping. All predictions are estimates and are never presented as guarantees. 

---

## Architecture & How It Works

### Prediction System (Heuristic v0.2)
Currently, AboutTrain utilizes a deterministic **Heuristic Engine** to calculate waitlist clearance probability. 

**This is NOT a machine learning model yet.**

The heuristic factors in:
1. **Waitlist Position Bounds**: Stricter penalties for higher waitlist numbers.
2. **Quota Reality Checks**: Mathematically caps maximum probabilities for highly restrictive quotas (e.g., Tatkal/PT).
3. **Class Historical Clearances**: Weights different classes based on typical cancellation volumes.
4. **Days to Journey**: Probabilities scale based on the remaining booking window.
5. **Historical Blending**: If a route has 10+ samples in the database, the engine blends the heuristic probability with actual ground-truth clearance rates.
6. **Anti-Fake-Precision**: All probabilities are rounded to the nearest 5% to prevent misleading illusions of certainty.

### RailwayDataProvider Architecture
The application uses a strict Factory Pattern (`RailwayDataProvider`) to decouple UI components from data sources. 
- **Demo Mode**: If database credentials are missing, the app defaults to `MockRailwayDataProvider`, loading illustrative mock data. 
- **Live Mode**: When connected, `SupabaseRailwayDataProvider` executes strict, typed queries to fetch real stations, schedules, and live availability snapshots.

*(Note: If you run this repository without connecting a database, it will display mock demo data).*

### Supabase & Authentication
- **Authentication**: Secured via Supabase Server-Side Rendering (SSR). Session refreshes are handled in Next.js middleware.
- **RLS/Security**: Row Level Security is strictly enforced.
  - Reference data (Stations, Trains) is publicly readable.
  - User profiles and saved trips are strictly scoped to the authenticated user.
  - Write operations are locked out from the client.

### Data Ingestion Architecture
Since the app does not scrape data itself, it relies on an external worker pushing authorized data to a secure endpoint:
- `/api/admin/ingest` validates a static `Bearer` token and uses the Supabase `service_role` key to bypass RLS and upsert live schedules and availability snapshots.

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- A Supabase Project (optional, for live data)

### Installation
```bash
git clone https://github.com/yourusername/AboutTrain.git
cd AboutTrain
npm install
```

### Environment Variables
Copy the example environment file:
```bash
cp .env.local.example .env.local
```
Fill in your Supabase credentials in `.env.local` to exit Demo Mode. Do NOT commit this file.

### Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npx tsc --noEmit # Run TypeCheck
```

---

## Project Structure

```
├── app/                  # Next.js App Router pages & API routes
│   ├── api/              # API endpoints (search, secure ingestion)
│   ├── auth/             # Auth callback routes
│   ├── compare/          # Compare multiple trains (Coming soon)
│   ├── insights/         # Historical analytics dashboard
│   ├── login/            # Sign in / Sign up
│   ├── planner/          # Journey planner form
│   ├── profile/          # User profile and saved trips
│   └── trains/           # Search results and detail views
├── components/           # Reusable UI components (shadcn/ui + custom)
├── lib/                  # Core business logic
│   ├── auth/             # Server actions for Supabase Auth
│   ├── prediction/       # Heuristic engine logic
│   ├── railway/          # Provider factory and Mock/Live implementations
│   └── supabase/         # Supabase client instantiation
├── supabase/migrations/  # Database schema and RLS policies
└── types/                # TypeScript interfaces and auto-generated DB types
```

---

## Current Limitations & Future ML Roadmap
- **No Direct Booking**: Users cannot book tickets through this app.
- **Heuristic-Only**: The current prediction engine relies on hardcoded rules blended with basic historical averages.
- **Future ML Roadmap**: The architecture is prepared for a true Machine Learning pipeline. The `historical_outcomes` table will serve as the training dataset for a random forest or gradient boosting model to replace the heuristic in v1.0.

## License
MIT License. See [LICENSE](LICENSE) for details.
