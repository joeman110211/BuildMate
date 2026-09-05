# BuildPair release gates

This document defines the order for moving BuildPair from private beta to paid marketplace. It intentionally keeps the existing GitHub/Vercel BuildMate infrastructure names until the final infrastructure rename.

## Gate 1: code quality

Required on every pull request:

- lint
- TypeScript typecheck
- unit tests
- web export
- Android bundle export
- iOS bundle export
- production dependency audit
- 320px Android and Pixel 5 public-layout regression tests

Do not merge a release-hardening change with a known failing quality check.

## Gate 2: controlled beta behaviour

Private-beta production must set:

```text
BUILDPAIR_BETA_LEAD_GRACE=true
BUILDPAIR_PREVIEW_DATA_ENABLED=true
```

`BUILDPAIR_BETA_LEAD_GRACE=true` means an otherwise-active tradesperson is not silently cut off after the advertised 14-day trial while paid Stripe billing is intentionally disabled.

`BUILDPAIR_PREVIEW_DATA_ENABLED=true` enables clearly labelled, non-interactive example profiles and jobs. Set it to `false` to remove all preview marketplace content without changing database data, application code or migration history.

The readiness endpoint exposes these feature states without exposing secrets.

## Gate 3: authenticated core workflow

Run the `E2E Regression` GitHub Actions workflow manually with `run_authenticated_core=true` against an approved E2E/staging environment.

Required GitHub Actions secrets:

```text
E2E_BASE_URL
E2E_CLERK_SECRET_KEY
E2E_CUSTOMER_EMAIL
E2E_TRADER_EMAIL
```

The test deliberately mutates data and therefore must never run automatically against production. It covers the complete loop on desktop and a 360x640 small-Android viewport:

1. tradesperson profile setup
2. homeowner finds the real test trader
3. homeowner posts a direct job request
4. homeowner/trader job conversation
5. tradesperson submits an itemised quote
6. homeowner compares and accepts the quote
7. tradesperson marks the work complete
8. homeowner records the beta direct payment
9. homeowner leaves a verified review

## Gate 4: deployed provider smoke tests

Run `E2E Regression` manually with `run_production_services=true` only after the intended deployment has the production configuration.

Additional secret:

```text
E2E_RESEND_SINK_EMAIL
```

The smoke suite verifies:

- `/api/readiness` reports ready
- Gemini produces a real job specification through the deployed API
- the deployed Cloudinary signing endpoint produces a signature that successfully uploads an image to the configured Cloudinary account
- Resend accepts and sends a real BuildPair invoice to the controlled sink mailbox

The smoke invoice is marked as an automated test and must not represent a real debt.

## Gate 5: production monitoring and security

Before inviting beta users:

- verify Vercel runtime errors are visible and searchable by the `[buildpair-api]` log prefix and returned `errorId`
- configure production error/uptime alerting in the hosting account
- verify HSTS, nosniff, frame, referrer and permissions headers on the production origin
- enable provider-side alerts for Clerk, Neon and Stripe where available
- keep production secrets out of client-prefixed environment variables
- rotate any secret that has ever been pasted into chat, a ticket, a repository or an unsecured log

## Gate 6: Stripe launch

Do not enable Stripe merely because the code exists.

Before enabling paid plans and job payments, test at minimum:

- successful card payment
- declined card
- 3DS/SCA completion and abandonment
- duplicate payment requests and duplicate webhooks
- payment retry after network interruption
- refund
- chargeback/dispute record handling
- Connect account incomplete verification
- Connect charges disabled
- subscription start after trial
- upgrade/downgrade
- cancellation
- failed renewal
- customer billing portal
- webhook replay/idempotency

Only after those checks:

1. configure client and server Stripe keys/price IDs/webhook secrets
2. verify `/api/readiness` reports both Stripe client and server configuration as intended
3. set `BUILDPAIR_BETA_LEAD_GRACE=false`
4. confirm the UI clearly states paid prices, renewal/cancellation terms and platform fees
5. run the complete authenticated E2E workflow again with the Stripe-specific payment path

## Gate 7: legal, domain and stores

The application includes beta privacy, cookie and marketplace terms pages. Before a national paid public launch, obtain an appropriate UK legal/commercial review, particularly for:

- operator/business legal identity and contact address
- consumer cancellation and refund rights
- trader subscription cancellation terms
- VAT/invoice requirements
- marketplace/platform liability language
- Stripe Connect and payment-dispute responsibilities
- prohibited work and safeguarding rules

Then complete:

- `buildpair.co.uk` DNS and production attachment
- Clerk redirect/origin updates for the final domain
- Resend domain/DNS verification
- production support and privacy URLs
- Play Store/App Store screenshots, descriptions and privacy declarations
- account deletion route/process
- signed store builds and store review metadata

The app identifiers are already reserved in source as `uk.co.buildpair.app` for Android and iOS.

## Gate 8: infrastructure rename last

Only after the production domain, deployment, authentication redirects, CI, provider callbacks and store builds are stable:

- rename the GitHub repository from BuildMate to BuildPair
- rename the Vercel project from BuildMate to BuildPair
- update clone URLs, deployment references and CI variables
- update any remaining external callback URLs
- verify old redirects/aliases where supported

Do **not** rename historical database migration files merely for branding. `db/migrations/0000_buildmate_initial.sql` is migration history and should remain stable.
