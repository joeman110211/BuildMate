# BuildPair

BuildPair is a UK-focused homeowner and tradesperson marketplace built from one Expo / React Native codebase for Android, iOS and web.

The product uses Expo Router, Clerk authentication, Neon Postgres with Drizzle, Cloudinary media, Resend email, Google Gemini assistance and Stripe code paths for subscriptions / marketplace payments.

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
- Playwright production E2E coverage for the homeowner → job → trader → quote → acceptance → messaging → completion → payment confirmation → review lifecycle.
- GitHub Actions Android release APK build.

## Trial policy

`TRADER_TRIAL_DAYS` is the product source of truth and is currently **14 days**.

Existing beta profiles that were previously granted a longer stored trial keep that existing end date. Editing a profile does not restart its trial.

## Local development

Requirements:
- Node 22.12+ (Node 24 recommended)
- npm
- Git
- Expo account for native cloud builds
- Android Studio when local Android emulator / Gradle debugging is needed

```bash
npm install
cp .env.example .env
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

Copy `.env.example` and configure the services needed by the environment.

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

The migration runner records applied filenames so historical migration files must not be casually renamed after production has applied them.

## Authentication configuration

For the current beta, configure Clerk for:
- email address
- password
- email verification code
- Google OAuth
- Facebook OAuth

Add the BuildPair production web origin and the `buildpair://` native callback scheme to the relevant Clerk / OAuth redirect configuration.

Phone OTP can be added later if the production Clerk plan and UK SMS setup make it worthwhile, but it is not a dependency for launch.

## Payments

Stripe integration code exists for subscriptions, billing portal access, Connect onboarding and job PaymentIntents. The beta is deliberately able to operate with Stripe client configuration disabled.

Before enabling live payments, complete end-to-end Stripe test-mode verification for subscription start / cancel, webhook handling, Connect onboarding, deposits, balances, refunds, failures and idempotency.

## Release rule

A change is not considered release-ready merely because it renders. Before production promotion it should pass the GitHub Quality workflow, relevant native build checks and the production Playwright lifecycle test once the production deployment is available.

See `docs/PRODUCTION_CHECKLIST.md` for the remaining operational and store-launch checks.
