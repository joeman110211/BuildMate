# BuildMate

BuildMate is a single-codebase marketplace for UK customers and tradespeople. It runs as a native Android/iOS Expo app and as a web PWA, with an Expo Router server API, Clerk authentication, Neon Postgres through Drizzle, Stripe Billing/Connect, Gemini job-spec assistance, job messaging and moderation.

## What is implemented

- Public paid-trader directory with featured ordering, self-certified qualifications, public register/social links, galleries and verified reviews.
- Email/password registration with email-code verification, plus mobile phone OTP registration/sign-in.
- Locked customer/trader roles and role-protected routes.
- Three-step trader onboarding, free shareable profiles, £19.99 Basic and £29.99 Featured subscription checkout.
- Stripe Express onboarding, destination payments, platform fees, deposits/balances and idempotent webhook updates.
- Customer job posting with controlled pickers and a four-question Gemini 2.5 Flash job-spec writer.
- Structured quote creation, side-by-side quote comparison and atomic quote acceptance.
- Job-scoped customer/trader messaging with participant checks, read timestamps and report actions.
- Admin moderation queue with auditable outcomes plus account suspension/restoration.
- Itemised invoice drafting and sending through Resend.
- Database-enforced verified reviews only after an accepted job has completed and a non-deposit milestone has been paid.

Money is stored as integer pennies throughout. Secret keys are server-only and are never exposed using an `EXPO_PUBLIC_` prefix.

## Project structure

```text
buildmate/
├── app/
│   ├── auth/                   sign-in, sign-up and role selection
│   ├── (public)/               directory and public trader profiles
│   ├── customer/               dashboard, job posting, job detail, comparisons, messages
│   ├── trader/                 onboarding, dashboard, plans, quotes, invoices, messages
│   ├── admin/                  moderation queue
│   └── api/                    authenticated Expo Router server endpoints
├── components/                 shared cross-platform UI
├── constants/                  palette, trades and controlled options
├── db/
│   ├── schema.ts               Drizzle schema
│   └── migrations/             ordered production SQL migrations
├── hooks/                      authenticated app state
├── lib/                        API, validation, money, server auth, Stripe
├── types/                      shared domain types
├── docs/                       production and Stripe notes
├── eas.json                    APK and Play Store build profiles
└── drizzle.config.ts           direct-connection migration config
```

## 1. Local setup

Requirements: Node 22.12+ (Node 24 recommended), npm, Git, an Expo account, and Android Studio for native Android emulator/device work.

```bash
git clone https://github.com/joeman110211/BuildMate.git
cd BuildMate
npm install
cp .env.example .env
npx expo start
```

Android Studio is useful for emulator testing, Logcat, Gradle/native debugging and validating installable Android builds against the same GitHub source. For most UI work Expo Go is enough; Stripe’s native module requires a development build for complete payment testing:

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
3. Apply the checked-in migrations:

```bash
npm run db:migrate
```

The migration runner uses `DATABASE_URL_UNPOOLED`, tracks applied migrations and executes new numbered SQL files in order inside a transaction. The initial migration creates constraints, indexes, the atomic `accept_job_quote` function and the review-eligibility trigger. Later migrations add messaging and moderation state. Use `npm run db:generate` for later Drizzle schema changes and review generated SQL before merging it with custom functions/triggers.

Recommended release workflow: create a Neon branch for each Git branch, apply migrations there, run tests, inspect the schema diff, and only then migrate production.

## 4. Media storage

BuildMate uses Cloudinary for production media. Current media folders are separated into trader galleries and job photos. Upload signatures must be generated server-side so the Cloudinary API secret is never embedded in the Android/iOS/web client.
