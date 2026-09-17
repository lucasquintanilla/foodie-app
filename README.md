# Fixora booking MVP

Private staging MVP for Lucas Handyman: public service browsing, persistent tray, Supabase accounts and booking records, optional private job photos, a €10 Stripe-hosted booking fee, customer booking history, and a small staff admin workflow.

## Local setup

1. Copy `.env.example` to `.env.local` and add the staging values. Never commit this file.
2. Run `npm install`.
3. Run `npm run dev -- --port 3001`.
4. Open `http://localhost:3001`.

Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run preview` for the Cloudflare runtime.

Database changes live in `supabase/migrations`. Platform and launch instructions are in `docs/operations.md`.

## Safety status

This is not ready for public launch. The catalogue content and legal trader details are temporary, Google OAuth is not configured, tax treatment is unverified, and only Stripe sandbox payments may be enabled. See the launch gates in `docs/operations.md`.
