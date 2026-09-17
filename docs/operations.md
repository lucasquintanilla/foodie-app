# Fixora MVP operations

## Launch state

The current deployment is a private staging pilot. Keep live Stripe mode and `services.creativeclub.ie` disabled until Lucas supplies verified trader/contact details, confirms VAT treatment with an accountant, activates Stripe live payments and bank details, approves the legal text, finishes Google OAuth, and replaces or licenses the temporary catalogue.

## Supabase

Project: `ltwhgdieituhchunjeyv` (Ireland).

1. Apply `supabase/migrations/20260914124249_fixora_booking_accounts_mvp.sql`.
2. Create a publishable key and a separate server secret key. Put only the publishable key in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Put the secret key in `SUPABASE_SECRET_KEY` as a Cloudflare secret. Never use `service_role` or a secret key in browser code.
4. Keep email confirmation enabled. Configure Site URL and allowed redirects for `http://localhost:3001`, the Access-protected staging URL, and `https://services.creativeclub.ie`.
5. Run Security and Performance Advisors after migrations. Execute `supabase/tests/rls-verification.sql` with two disposable users before launch.
6. Use signed URLs for the private `job-photos` bucket. Delete objects whose matching `order_photos.delete_after` has passed.

## Google OAuth for Lucas

1. Create a Google Cloud project owned by Lucas.
2. Configure an external consent screen with app name Fixora, Lucas's support email, `creativeclub.ie`, and the final Privacy and Terms URLs.
3. Request only `openid`, `email`, and `profile`.
4. Create a Web Application OAuth client.
5. Add exactly `https://ltwhgdieituhchunjeyv.supabase.co/auth/v1/callback` as the redirect URI.
6. Add `https://services.creativeclub.ie` and `http://localhost:3001` as authorised origins.
7. Enter the Google client ID and secret in Supabase Authentication → Sign In / Providers → Google. Never commit the secret.
8. Keep Supabase standard confirmation/reset emails for the pilot.

## Stripe sandbox and live rollout

1. Use the existing Lucas Handyman standard account; do not enable Connect.
2. In the sandbox, create one one-time EUR Price for exactly €10 named “Fixora booking fee”. Save its ID as `STRIPE_BOOKING_FEE_PRICE_ID`.
3. Create a restricted test key with only the Checkout Session read/write, Refund read/write, and required read permissions. Save it as `STRIPE_RESTRICTED_KEY` in Cloudflare secrets.
4. Register `/api/stripe/webhook` and subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, and `refund.updated`. Save the signing secret as `STRIPE_WEBHOOK_SECRET`.
5. Test success, 3DS, decline, abandonment, delayed payment, duplicate/out-of-order events, cancellation, and refunds. The webhook is the only payment source of truth.
6. Do not enable automatic tax. After the accountant confirms VAT treatment and Stripe live activation is complete, create a separate live €10 Price and least-privilege live key.

## Cloudflare Workers

1. Set up Workers Builds from the private GitHub repository with `npm run deploy:staging` for preview and staging.
2. Keep `nodejs_compat` and observability enabled as configured in `wrangler.jsonc`.
3. Set public staging variables separately from production. Store Supabase and Stripe secrets with Cloudflare Worker secrets, never plain variables.
4. Protect `fixora-services-staging.lucasjavierquintanilla.workers.dev` with Cloudflare Access and allow only Lucas's approved identity.
5. Add the production custom domain only after all launch gates pass.
6. Verify authenticated responses include `Cache-Control: private, no-store` and `Vary: Cookie` at the edge.

## Encrypted backups and restore tests

Create a private R2 bucket dedicated to backups. Configure an R2 lifecycle rule to delete `weekly/` objects after 84 days (12 weeks). Add repository secrets `SUPABASE_DB_URL`, `BACKUP_AGE_PUBLIC_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, and `R2_BUCKET` for `.github/workflows/supabase-backup.yml`.

The age private key must remain offline and must not be added to GitHub. Every quarter:

1. Download a recent encrypted object into an isolated machine.
2. Decrypt it with the offline age key.
3. Restore into a disposable PostgreSQL/Supabase environment with `pg_restore --clean --if-exists --no-owner`.
4. Confirm row counts for services, profiles, orders and order items; verify a sample booking and RLS policies.
5. Destroy the disposable environment and plaintext dump.
6. Record the date, backup object, operator, result and corrective action in the client operations log.
