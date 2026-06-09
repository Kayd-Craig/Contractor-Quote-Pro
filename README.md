# Contractor Quote Pro

A full-stack mobile and web application that lets contractors create professional on-site job quotes, collect payments, and manage scheduling — all from their phone.

## Features

- **Quote Builder** — Add material and labor line items with custom markups and automatic tax calculation by zip code
- **Product Search** — Search a mock Home Depot/Lowe's catalog with debounced auto-complete
- **PDF Generation** — Server-side PDF export with 4 template styles and 4 font choices
- **Payment Collection** — Stripe Checkout with a 3% + $0.50 service fee; contractors connect via Stripe Connect for payouts
- **Scheduling** — Set weekly availability and book job time slots when a quote is accepted
- **Business Branding** — Upload a logo that appears in the PDF header
- **Job-Site Photos** — Attach photos to quotes via the device camera
- **Customer Auto-fill** — Previous customer data pre-fills new quotes

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo 54), Expo Router, TanStack Query |
| Backend | Express 5, PostgreSQL, Drizzle ORM, Zod |
| PDF | pdfkit |
| Payments | Stripe Checkout + Connect |
| Language | TypeScript 5.9 |
| Package Manager | pnpm workspaces |
| Runtime | Node 24 |

## Project Structure

```
contractor-quote-pro/
├── artifacts/
│   ├── mobile/          # React Native (Expo) app
│   └── api-server/      # Express API server
├── lib/
│   ├── db/              # PostgreSQL schema (Drizzle)
│   ├── api-zod/         # Zod validation schemas
│   ├── api-spec/        # OpenAPI spec (source for codegen)
│   └── api-client-react/ # Generated API hooks (Orval)
```

## Getting Started

### Prerequisites

- Node 24+
- pnpm
- PostgreSQL database
- Stripe account (for payments)

### Install dependencies

```bash
pnpm install
```

### Environment variables

Create a `.env` file in `artifacts/api-server/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/contractor_quote_pro
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Run the API server

```bash
cd artifacts/api-server
pnpm dev
```

### Run the mobile app

```bash
cd artifacts/mobile
pnpm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

### Regenerate API client

```bash
cd lib/api-spec
pnpm generate
```

## Database

Migrations are managed with Drizzle ORM. To apply migrations:

```bash
cd lib/db
pnpm migrate
```

## Payments

Stripe is used for both payment collection and contractor payouts:

- **Checkout Sessions** — clients pay quotes via a hosted Stripe page
- **Stripe Connect** — contractors onboard to receive payouts directly
- A 3% + $0.50 platform fee is applied to each transaction
