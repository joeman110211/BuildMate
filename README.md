# BuildPair

BuildPair is a UK-focused homeowner and tradesperson marketplace built from one Expo / React Native codebase for Android, iOS and web.

The product uses Expo Router, Clerk authentication, Neon Postgres with Drizzle, Cloudinary media, Resend email, Google Gemini assistance and Stripe code paths for subscriptions / marketplace payments.

Repository: `joeman110211/BuildPair`

## Current hosting phase

BuildPair is currently in a **private test phase**. The web app and API can be run directly from the Chromebook Linux environment and exposed to a small group of testers through a free Cloudflare Quick Tunnel.

```bash
cd ~/buildpair
git pull --ff-only origin main
npm ci
bash scripts/start-chromebook-test.sh
```

See `docs/CHROMEBOOK_TEST_HOST.md` for the one-time Chromebook setup and operating commands.

The Docker/Caddy files under `infra/production/` are intentionally retained for the later public-production move. The Chromebook test host is not intended to be the final public infrastructure.

## Current beta product

### Public marketplace
- Public BuildPair landing site with responsive navigation and legal / information pages.
- Smart trade search that understands related job terms rather than requiring an exact trade name.
- 50+ trade categories with specialist skills.
- Public tradesperson directory and detailed profiles.
- Public job browsing with privacy-safe location information.
- Contact form delivered through Resend.
- PWA manifest, icons and installable web experience.

### Accounts and authentication
- Email + password registration with email-code verification.
- Google and Facebook social sign-in through Clerk.
- Phone OTP is intentionally not required for the current beta.
- One Clerk login identity can enable a Homeowner profile, a Tradesperson profile, or both.
- Users can switch between enabled account modes instead of maintaining unrelated logins.
- Suspended accounts are rejected by protected server routes.

### Homeowners
- Create and manage jobs.
- Add job photos and postcode-based location data.
- Use Gemini to help turn a rough description into a clearer job specification.
- Contact tradespeople directly from appropriate listings.
- Receive and compare quotes.
- Accept one quote atomically.
- Message the selected tradesperson in a job-scoped conversation.
- Confirm external milestone payments while Stripe marketplace payments remain optional during beta.
- Leave verified reviews only after qualifying completed work.

### Tradespeople
- Four-step profile onboarding.
- Minimum 50-character business bio.
- Primary trade, specialist skills, service radius and service areas.
- Cover image, profile image, logo, work gallery and before / after projects.
- Qualifications, register links and social links.
- 14-day free Basic lead-access period for new profiles without requiring Stripe during onboarding.
- Job board, quote creation, messaging, job management and invoices.
- Subscription and Stripe Express screens remain available but are disabled when Stripe client configuration is not enabled.

### Operations
- Admin moderation queue and account suspension / restoration.
- User reporting flows.
- Resend invoice email support.
- Readiness and health endpoints.
- Database migrations tracked and applied in order.
- GitHub Actions quality checks for lint, TypeScript, unit tests, web export, Android export, iOS export and production dependency audit.
- Playwright E2E coverage for the homeowner → job → trader → quote → acceptance → messaging → completion → payment confirmation → review lifecycle.
- Manual GitHub Actions Android APK build for a chosen test/public API URL.

## Trial policy

`TRADER_TRIAL_DAYS` is the product source of truth and is currently **14 days**.

Existing beta profiles that were previously granted a longer stored trial keep that existing end date. Editing a profile does not restart its trial.

## Local development

Requirements:
- Node 22.12+
- npm
- Git
- Expo account only when native cloud builds are needed
- Android Studio only when local Android emulator / Gradle debugging is needed

```bash
git clone https://github.com/joeman110211/BuildPair.git buildpair
cd buildpair
npm ci
cp .env.example .env.local
npx expo start
```

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build:web
```

Native installed apps require `EXPO_PUBLIC_API_URL` to point at the HTTPS deployment that hosts the Expo Router server API. Relative `/api` URLs only work when the web client and server share an origin.

## Environment

Copy `.env.example` to a local ignored environment file and configure the services needed by the environment.

### Required for the core connected beta
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED` for migrations

### Feature-specific
- Gemini: `GEMINI_API_KEY`
- Resend: `RESEND_API_KEY`, `INVOICE_FROM_EMAIL`, `SUPPORT_EMAIL`
- Cloudinary: `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Stripe when payments are enabled: publishable key, secret key, price IDs and webhook secrets

Never put a server secret into an `EXPO_PUBLIC_` variable.

## Database

Apply checked-in migrations using the direct / unpooled Neon connection:

```bash
npm run db:migrate
```

The migration runner records applied filenames. The historical initial migration filename and migration-ledger table therefore remain unchanged internally even though the product and repository are BuildPair. Renaming those after they have been applied could make migrations run incorrectly.

## Authentication configuration

For the current beta, configure Clerk for:
- email address
- password
- email verification code
- Google OAuth
- Facebook OAuth

For temporary Chromebook testing, use development/test Clerk configuration where practical. For the eventual public deployment, add the BuildPair production web origin and the `buildpair://` native callback scheme to the relevant Clerk / OAuth redirect configuration.

Phone OTP can be added later if the production Clerk plan and UK SMS setup make it worthwhile, but it is not a dependency for launch.

## Payments

Stripe integration code exists for subscriptions, billing portal access, Connect onboarding and job PaymentIntents. The beta is deliberately able to operate with Stripe client configuration disabled.

Before enabling live payments, complete end-to-end Stripe test-mode verification for subscription start / cancel, webhook handling, Connect onboarding, deposits, balances, refunds, failures and idempotency.

## Release rule

A change is not considered release-ready merely because it renders. Before promotion it should pass the GitHub Quality workflow and the relevant test/build checks for the target environment.

See `docs/PRODUCTION_CHECKLIST.md` for the later public-launch checks.
