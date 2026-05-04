# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Mobile App (Quick Quote)

React Native (Expo) app for contractors to create on-site job quotes.

### Key Features
- **First-launch onboarding**: requires name, phone, and zip code before accessing the app; business name, license, and email are optional. Rendered directly in root layout when `settings.onboardingComplete` is false.
- Product search with mock HD/Lowe's data (debounced auto-search)
- Manual material entry with custom supplier name (for suppliers without online catalogs)
- Materials/labor split with labor unit-type picker (per Hour, Sq Ft, Lin Ft, Day, Flat Rate)
- Markup % and contractor store account discount
- Per-quote discount (percent or flat)
- **Automatic tax calculation** by zip code (state-level rates, extracted from job address or settings zip)
- Job-site photos via expo-image-picker
- Customer history/auto-fill from past quotes
- Paper-style quote preview with **4 font options** (Classic/Modern/Elegant/Clean) and **4 template styles** (Typewriter/Professional/Bold/Minimal) — stored per-quote
- Send quotes as **PDF** via native share sheet (generated server-side with pdfkit, matching template/font styles)
- Web fallback: PDF auto-downloads via blob URL
- Quote deletion (long-press from list, trash icon from detail)
- Business logo upload (bottom sheet picker, works on web + native) — converted to base64 data URI for persistence across reloads
- Logo rendered in PDF quotes (centered above business name in header)

### Quote Data Model
- `QuoteFont`: "classic" | "modern" | "elegant" | "clean"
- `QuoteTemplate`: "typewriter" | "professional" | "bold" | "minimal"
- Font/template stored on each Quote object (`quoteFont`, `quoteTemplate` fields)

### Colors
- Primary green: `#2E7D32`
- Dark navy: `#1A3A5C`
- Off-white: `#F7F6F4`
- HD orange: `#F96302`
- Lowe's blue: `#004990`

### App Store / Production
- Bundle ID: `com.joshworks.quickquote`
- EAS config: `artifacts/mobile/eas.json`
- App icon: `artifacts/mobile/assets/images/icon.png` (green QQ)
- Splash: `artifacts/mobile/assets/images/splash.png` (green QQ on cream)
- Adaptive icon: `artifacts/mobile/assets/images/adaptive-icon.png`
- Preferred store filter: "all" | "homedepot" | "lowes" (saved in settings)

### Stripe Payment Collection
- Contractor taps "Request Payment" on sent/accepted quotes → creates Stripe Checkout Session → shares payment link with client
- **Service fee**: 3% + $0.50 per transaction, added as a separate line item in Stripe Checkout so clients see the breakdown
- Payment status tracked per-quote: unpaid → pending → paid
- Stripe webhook at `/api/stripe/webhook` (registered before express.json() for raw body parsing)
- Public success/cancelled pages at `/api/payment-success` and `/api/payment-cancelled` (no auth required)
- Stripe credentials fetched via Replit connectors API (settings keys: `secret`, `publishable`, `account_id`)
- Database: PostgreSQL with `stripe` schema managed by `stripe-replit-sync` (auto-migrations on startup)

### Stripe Connect (Contractor Payouts)
- Contractors connect their own Stripe account via Stripe Connect Express onboarding (Settings → Payments & Payouts)
- When a client pays, the service fee (3% + $0.50) is kept by the platform via `application_fee_amount`, and the rest is transferred to the contractor's connected account via `transfer_data.destination`
- Connected account ID (`stripeAccountId`) stored in ContractorSettings (AsyncStorage)
- API routes: `POST /api/connect/onboard`, `GET /api/connect/status`, `GET /api/connect/dashboard`, `GET /api/connect/balance`
- Public return/refresh pages at `/api/connect/return` and `/api/connect/refresh` (no auth required)
- Settings screen shows balance (available/pending) and link to Stripe Express dashboard for managing payouts
- **Prerequisite**: Stripe Connect must be enabled on the platform Stripe account at https://dashboard.stripe.com/connect
- Dependencies: `stripe`, `stripe-replit-sync` (externalized in esbuild config)

### Important Files
- `artifacts/mobile/context/QuoteContext.tsx` — all state, types, AsyncStorage persistence
- `artifacts/mobile/components/PaperQuoteView.tsx` — themed paper quote with font/template support
- `artifacts/mobile/app/quote/[id].tsx` — quote detail, add items, preview modal with style pickers, payment UI
- `artifacts/mobile/components/SendQuoteModal.tsx` — send flow with paper preview
- `artifacts/mobile/app/(tabs)/settings.tsx` — contractor profile, logo upload, markup/discount defaults
- `artifacts/api-server/src/routes/products.ts` — mock product catalog
- `artifacts/api-server/src/routes/payments.ts` — Stripe checkout session creation + payment status
- `artifacts/api-server/src/stripeClient.ts` — Stripe client + StripeSync via Replit connectors
- `artifacts/api-server/src/webhookHandlers.ts` — Stripe webhook processing
- `artifacts/api-server/src/app.ts` — Express app with webhook route before JSON parsing
