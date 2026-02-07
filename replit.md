# Family Data Management System

## Overview

This is a **Family Data Management System** — a full-stack web application designed to manage records of children, breastfeeding mothers, and pregnant women in camp/humanitarian settings. It digitizes paper-based records, providing CRUD operations, role-based access, dashboard statistics, and record lookup functionality.

The app is built with a React frontend and Express backend, using PostgreSQL for data storage, with Replit Auth for authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State Management / Data Fetching**: TanStack React Query for server state, with custom hooks per entity (`use-children`, `use-pregnant-women`, `use-camps`, `use-stats`, `use-auth`)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives, styled with Tailwind CSS
- **Charts**: Recharts for dashboard visualizations (bar charts, pie charts)
- **Build Tool**: Vite with React plugin
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Language/Direction**: HTML is set to Arabic RTL (`lang="ar" dir="rtl"`), but the app uses LTR-friendly structure with Arabic text in the public-facing pages
- **Fonts**: Plus Jakarta Sans (display), Inter (body) via Google Fonts

### Backend
- **Framework**: Express.js running on Node with TypeScript (tsx for dev, esbuild for production)
- **API Design**: RESTful JSON API under `/api/` prefix. Route definitions are shared between client and server via `shared/routes.ts` using Zod schemas for validation
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js. Sessions stored in PostgreSQL via `connect-pg-simple`. Auth middleware lives in `server/replit_integrations/auth/`
- **Protected Routes**: Server routes use `isAuthenticated` middleware; client uses a `ProtectedRoute` wrapper component that redirects to `/login`

### Shared Code (`shared/`)
- **Schema**: `shared/schema.ts` defines all Drizzle ORM table schemas (camps, children, pregnant_women, users, sessions)
- **Routes**: `shared/routes.ts` defines API contract with Zod schemas for inputs/outputs, used by both client hooks and server route handlers
- **Models**: `shared/models/auth.ts` defines users and sessions tables (required for Replit Auth)

### Database
- **Database**: PostgreSQL (required, uses `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod conversion
- **Migrations**: Drizzle Kit with `drizzle-kit push` command (`npm run db:push`)
- **Tables**:
  - `camps` — id, name, location
  - `children` — id, full_name, id_number, date_of_birth, gender, health_status, father/mother info, is_breastfeeding, health_notes, camp_id, created_at
  - `pregnant_women` — id, full_name, id_number, health_status, pregnancy_month, spouse info, health_notes, camp_id, created_at
  - `users` — id (UUID), email, first_name, last_name, profile_image_url, role, timestamps (Replit Auth managed)
  - `sessions` — sid, sess, expire (Replit Auth session store)

### Storage Pattern
- `server/storage.ts` implements `IStorage` interface with `DatabaseStorage` class, providing a clean abstraction over database operations for all entities

### Build & Development
- **Dev**: `npm run dev` — runs tsx with Vite dev server middleware (HMR enabled)
- **Build**: `npm run build` — Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Production**: `npm start` — serves built assets with Express static middleware
- **Type Check**: `npm run check`
- **DB Push**: `npm run db:push` — pushes schema to database

### Key Pages
- `/` — Public home page with record lookup (search by parent/spouse ID without login)
- `/login` — Admin login page
- `/dashboard` — Protected dashboard with statistics cards and charts
- `/children` — Protected CRUD list for children/breastfeeding records
- `/pregnant-women` — Protected CRUD list for pregnant women records
- `/camps` — Protected camp management

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required. Connection via `DATABASE_URL` environment variable. Used for all data storage and session management
- **Replit Auth (OpenID Connect)**: Authentication provider. Uses `ISSUER_URL` (defaults to `https://replit.com/oidc`), `REPL_ID`, and `SESSION_SECRET` environment variables

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit**: ORM and migration tooling for PostgreSQL
- **express** + **express-session**: HTTP server and session management
- **passport** + **openid-client**: Authentication via Replit's OIDC provider
- **connect-pg-simple**: PostgreSQL session store
- **zod** + **drizzle-zod**: Schema validation shared between client and server
- **@tanstack/react-query**: Server state management on the client
- **recharts**: Dashboard chart visualizations
- **date-fns**: Date formatting and manipulation
- **shadcn/ui ecosystem**: Radix UI primitives, Tailwind CSS, class-variance-authority, lucide-react icons

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Secret for session encryption
- `REPL_ID` — Replit environment identifier (auto-set on Replit)
- `ISSUER_URL` — OIDC issuer URL (optional, defaults to Replit's)