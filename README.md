# BuildMate

BuildMate is a single-codebase marketplace for UK customers and tradespeople. It runs as a native Android/iOS Expo app and as a web PWA, with an Expo Router server API, Clerk authentication, Neon Postgres through Drizzle, Stripe Billing/Connect, and Gemini job-spec assistance.

## What is implemented

- Public paid-trader directory with featured ordering, self-certified qualifications, public register/social links, galleries and verified reviews.
- Email/password registration with email-code verification, plus mobile phone OTP registration/sign-in.
- Locked customer/trader roles and role-protected routes.
- Three-step trader onboarding, free shareable profiles, £19.99 Basic and £29.99 Featured subscription checkout.
- Stripe Express onboarding, destination payments, platform fees, deposits/balances and idempotent webhook updates.
- Customer job posting with controlled pickers and a four-question Gemini 2.5 Flash job-spec writer.
- Structured quote creation, side-by-side quote comparison and atomic quote acceptance.
- Itemised invoice drafting and sending through Resend.
- Database-enforced verified reviews only after an accepted job has completed and a non-deposit milestone has been paid.

Money is stored as integer pennies throughout. Secret keys are server-only and are never exposed using an `EXPO_PUBLIC_` prefix.

## Project structure

```text
buildmate/
├── app/
│   ├── (auth)/                 sign-in, sign-up and role selection
│   ├── (public)/               directory and public trader profiles
│   ├── (customer)/             dashboard, job posting, job detail, comparisons
│   ├── (trader)/               onboarding, dashboard, plans, quotes, invoices
│   └── api/                    authenticated Expo Router server endpoints
├── components/                 shared cross-platform UI
├── constants/                  palette, trades and controlled options
├── db/
│   ├── schema.ts               Drizzle schema
│   └── migrations/             production SQL migration
├── hooks/                      authenticated app state
├── lib/                        API, validation, money, server auth, Stripe
├── types/                      shared domain types
├── docs/                       production and Stripe notes
├── eas.json                    APK and Play Store build profiles
└── drizzle.config.ts           direct-connection migration config
```

## 1. Local setup

Requirements: Node 22.12+ (Node 24 recommended), npm, Git, an Expo account, and Android Studio for a local Android emulator.

```bash
git clone https://github.com/joeman110211/BuildMate.git
cd BuildMate
npm install
cp .env.example .env
npx expo start
```

For a physical Android phone, Expo Go is enough for most UI work. Stripe’s native module requires a development build for complete payment testing:

```bash
npx eas-cli@latest build --profile development --platform android
```

Native builds must set `EXPO_PUBLIC_API_URL` to the HTTPS origin hosting the Expo Router server routes. A phone cannot call a relative `/api` URL from its installed bundle.

## 2. Clerk authentication

1. Create a Clerk application.
2. In **User & Authentication → Email, Phone, Username**, enable email address, password and email verification code.
3. Enable phone number plus SMS verification code. Clerk phone OTP requires a paid plan for production, though development testing is available.
4. Put the publishable key in `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and the secret key in the server environment as `CLERK_SECRET_KEY`.
5. Add `buildmate://` and the production web origin to allowed redirect/origin settings.

Users are lazily synchronized from Clerk into `users`; the Clerk user ID is the Postgres primary key. The API derives email and phone from Clerk’s server SDK, never from editable client input.

## 3. Neon database and Drizzle

1. Create a Neon project in a region close to the primary audience (for a UK launch, choose an available European region).
2. Copy both Neon connection strings:
   - pooled hostname containing `-pooler` → `DATABASE_URL` for application requests;
   - direct hostname without `-pooler` → `DATABASE_URL_UNPOOLED` for migrations.
3. Apply the checked-in migration:

```bash
npm run db:migrate
```

The migration runner deliberately uses `DATABASE_URL_UNPOOLED` and wraps the checked-in SQL in a transaction. Alternatively run `db/migrations/0000_buildmate_initial.sql` in Neon’s SQL editor. Do one or the other, not both. The migration creates constraints, indexes, the atomic `accept_job_quote` function and the review-eligibility trigger. Use `npm run db:generate` for later Drizzle schema changes and review generated SQL before merging it with the custom functions/triggers.

Recommended release workflow: create a Neon branch for each Git branch, apply migrations there, run tests, inspect the schema diff, and only then migrate production.

## 4. Stripe Billing and Connect

### Subscription products

Create two recurring GBP monthly prices in Stripe:

| Product | Amount | Environment variable |
|---|---:|---|
| Basic Direct Leads | £19.99/month | `STRIPE_BASIC_PRICE_ID` |
| Featured Search + Unlimited Direct Quotes | £29.99/month | `STRIPE_FEATURED_PRICE_ID` |

Enable the Stripe customer portal so traders can update cards and cancel. Put the Stripe publishable key in the Expo public environment and keep `STRIPE_SECRET_KEY` server-only.

### Connect

Enable Stripe Connect Express for the platform’s UK account. BuildMate creates Express accounts and account links server-side. Job payments use destination charges; `PLATFORM_FEE_PERCENT` controls the application fee and defaults to 5%.

Before accepting live payments, complete Stripe’s platform profile, identity checks, bank details, branding, support details and required marketplace agreements.

### Webhook

Create a webhook endpoint at:

```text
https://YOUR_API_ORIGIN/api/stripe/webhook
```

Subscribe to:

- `account.updated`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

Set its signing secret as `STRIPE_WEBHOOK_SECRET`. For local testing:

```bash
stripe listen --forward-to localhost:8081/api/stripe/webhook
```

Never mark a subscription or payment successful from a client redirect. BuildMate updates those states only from signed webhooks.

## 5. Gemini and invoice email

Create a Google AI Studio API key and set `GEMINI_API_KEY` on the server. The key is called only through `/api/ai/job-spec`, behind Clerk authentication and Zod limits. The prompt is low-temperature and explicitly refuses to invent facts; customers still see a warning to check the output.

For invoice delivery, verify a sending domain with Resend and set `RESEND_API_KEY` and `INVOICE_FROM_EMAIL`. With no email credentials, invoices are saved and a delivery warning is returned.

## 6. Deploy the API and web PWA

Expo Router API routes require a server deployment. Deploy the web/server output to an Expo-supported server host, EAS Hosting, or another WinterCG-compatible host. Configure every server secret there, plus the public Clerk/Stripe keys.

```bash
npx expo export --platform web
```

Set `APP_URL` and `EXPO_PUBLIC_API_URL` to the final HTTPS origin, then add that origin to Clerk and Stripe return URLs. Verify these production routes before compiling native builds:

- `/api/traders`
- `/api/me` with a valid Clerk token
- `/api/stripe/webhook` through Stripe’s webhook tester

## 7. Build a standalone Android APK

Install and authenticate EAS CLI, then link/create the Expo project:

```bash
npm install -g eas-cli
eas login
eas init
eas build:configure
```

Create the installable APK using the checked-in `preview` profile:

```bash
eas build --platform android --profile preview
```

The `preview` profile has `android.buildType: apk`. Install the resulting download directly on a device. For Google Play, build the production AAB instead:

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

Set public build variables with `eas env:create`; set server secrets only on the API host. Do not bake `DATABASE_URL`, Clerk secret, Stripe secret, webhook secret or Gemini key into the APK.

## 8. GitHub delivery workflow

```bash
git switch -c feat/my-change
npm run lint && npm run typecheck && npm test
git add .
git commit -m "Describe the BuildMate change"
git push -u origin feat/my-change
```

Open a pull request into `main`; GitHub Actions runs lint, TypeScript, unit tests and a production dependency audit on every pull request. Protect `main`, require the `verify` check, enable Dependabot/security alerts, and never commit `.env`.

## Release gate

Run:

```bash
npm run lint
npm run typecheck
npm test
```

Then complete [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md). Payment and identity systems are integration-tested in test mode before live keys are used.
