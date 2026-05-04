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
- Product search with mock HD/Lowe's data (debounced auto-search)
- Materials/labor split with labor unit-type picker (per Hour, Sq Ft, Lin Ft, Day, Flat Rate)
- Markup % and contractor store account discount
- Per-quote discount (percent or flat)
- Job-site photos via expo-image-picker
- Customer history/auto-fill from past quotes
- Paper-style quote preview with **4 font options** (Classic/Modern/Elegant/Clean) and **4 template styles** (Typewriter/Professional/Bold/Minimal) — stored per-quote
- Send quotes via native share sheet
- Quote deletion (long-press from list, trash icon from detail)
- Business logo upload (bottom sheet picker, works on web + native)

### Quote Data Model
- `QuoteFont`: "classic" | "modern" | "elegant" | "clean"
- `QuoteTemplate`: "typewriter" | "professional" | "bold" | "minimal"
- Font/template stored on each Quote object (`quoteFont`, `quoteTemplate` fields)

### Colors
- Primary orange: `#E87722`
- Dark navy: `#1A3A5C`
- Off-white: `#F7F6F4`

### Important Files
- `artifacts/mobile/context/QuoteContext.tsx` — all state, types, AsyncStorage persistence
- `artifacts/mobile/components/PaperQuoteView.tsx` — themed paper quote with font/template support
- `artifacts/mobile/app/quote/[id].tsx` — quote detail, add items, preview modal with style pickers
- `artifacts/mobile/components/SendQuoteModal.tsx` — send flow with paper preview
- `artifacts/mobile/app/(tabs)/settings.tsx` — contractor profile, logo upload, markup/discount defaults
- `artifacts/api-server/src/routes/products.ts` — mock product catalog
