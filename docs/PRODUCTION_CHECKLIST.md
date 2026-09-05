# BuildPair production checklist

Status reviewed: 5 September 2026.

This checklist separates the current private-test stage from the later public-production stage. A green build proves the code compiles and tests pass; it does not magically make third-party services, app stores, payments and legal obligations disappear.

## Completed in the repository

- [x] Final public product name is BuildPair in user-facing application configuration and copy.
- [x] GitHub repository is `joeman110211/BuildPair`.
- [x] Final native identifiers use `uk.co.buildpair.app` and the `buildpair://` URL scheme.
- [x] Public BuildPair landing page, directory, public jobs and public trader profiles exist.
- [x] Public About, How It Works, Homeowner, Tradesperson, Download and Contact pages exist.
- [x] Public Terms, Privacy, Cookie and Marketplace Disclaimer pages exist.
- [x] One Clerk login can enable separate Homeowner and Tradesperson modes.
- [x] Email/password + verification code auth is implemented.
- [x] Google and Facebook SSO flows are implemented.
- [x] Phone OTP is not required for the current beta.
- [x] Trader onboarding has four steps, a visible 50-character bio minimum, visible skill-selection ticks and Save & Publish routing.
- [x] New trader profiles use a 14-day trial; previously granted longer stored beta trials remain honoured.
- [x] Smart related-term trade search and 50+ trade categories are implemented.
- [x] Postcode geocoding and privacy-safe outward-code public job locations are implemented.
- [x] Homeowner job creation, quote comparison and atomic quote acceptance are implemented.
- [x] Job-scoped messaging and participant checks are implemented.
- [x] Completion, milestone state and external-payment confirmation are implemented for the Stripe-disabled beta path.
- [x] Verified-review enforcement exists at both API and database-trigger level.
- [x] Trade invoices and Resend delivery code are implemented.
- [x] Cloudinary signed-upload code is implemented.
- [x] Admin moderation, reporting, suspension and restoration flows are implemented.
- [x] Account deletion API/UI exists.
- [x] Health and readiness endpoints exist.
- [x] GitHub Quality CI covers lint, TypeScript, unit tests, web export, Android export, iOS export and production dependency audit.
- [x] Playwright E2E covers the homeowner → trader → job → quote → acceptance → messaging → completion → payment confirmation → verified review lifecycle.
- [x] GitHub Actions Android release APK build exists as a manual target-environment build.
- [x] Zero-cost Chromebook test hosting is supported through the real Node server plus Cloudflare Quick Tunnel.
- [x] Portable Docker/Caddy production infrastructure is retained for the later public-hosting move.

## Current private-test phase

- [ ] Complete the Chromebook Linux setup in `docs/CHROMEBOOK_TEST_HOST.md`.
- [ ] Start the Chromebook test host and confirm `/api/health` returns HTTP 200.
- [ ] Confirm `/api/readiness` returns HTTP 200 with `ready: true` using the intended test credentials.
- [ ] Test email/password registration and email verification through the temporary tunnel URL.
- [ ] Test Google and Facebook login against the temporary test origin if those providers are enabled for the test environment.
- [ ] Run a complete homeowner → trader workflow with the small tester group.
- [ ] Send a Contact form message and test invoice through the intended Resend test/domain configuration.
- [ ] Upload, display and replace/delete test job and trader photos through Cloudinary.
- [ ] Run the manual Playwright E2E workflow against the current temporary tunnel URL when the test Clerk configuration is ready.
- [ ] Produce and install an Android APK only when a sufficiently stable API URL is available for that test build.

## Required before wider public launch

- [ ] Move from temporary Chromebook hosting to proper always-on UK/scalable hosting.
- [ ] Point `buildpair.co.uk` / `www.buildpair.co.uk` at the public production environment.
- [ ] Confirm `/api/health` and `/api/readiness` on the final public deployment.
- [ ] Run the full Playwright E2E workflow against that exact public deployment and retain the passing run as launch evidence.
- [ ] Confirm the Android release APK/AAB build installs on a physical Android phone.
- [ ] Confirm Clerk production redirect/origin settings for email, Google and Facebook on the final web domain and `buildpair://` native callback.
- [ ] Confirm the current database has every checked-in migration applied and take a recovery point / backup before public traffic.
- [ ] Confirm database point-in-time restore is enabled and document how to restore it.
- [ ] Add production error reporting with personal-data scrubbing and an external uptime alert for the web/API health endpoint.
- [ ] Add hosting-level rate limiting/WAF rules to public/contact, Gemini and authenticated write endpoints that are abuse-sensitive.
- [ ] Remove the quiet-launch `noindex, nofollow` header only when BuildPair is deliberately ready for search-engine discovery.

## Product / legal checks before wider public launch

- [x] UK privacy notice, cookie policy, marketplace terms and marketplace disclaimer pages are present.
- [x] The current product describes trade credentials as self-certified rather than claiming BuildPair has vetted them.
- [x] Account deletion workflow exists.
- [ ] Review final legal wording before a wider paid launch, especially trader subscriptions, cancellation/refunds, consumer contracts, VAT invoicing, platform liability and payments.
- [ ] Define and document complaints, dangerous-work, disputed-work, chargeback and trader-removal procedures for support/admin use.
- [ ] Finalise the retention/deletion policy before app-store release.

## Payments

Stripe code exists but Stripe remains intentionally optional for the current beta.

Before enabling paid subscriptions or BuildPair job payments:

- [ ] Test successful, declined, 3DS, cancelled, duplicate-webhook and refunded payments in Stripe test mode.
- [ ] Test Connect accounts with incomplete verification and disabled charges.
- [ ] Test subscription start, upgrade, downgrade, cancellation, failed renewal and billing-portal access.
- [ ] Confirm platform fee policy and who absorbs Stripe processing fees.
- [ ] Verify both platform and Connect webhook destinations/signing secrets on the final production domain.

## App stores and devices

- [x] Final bundle/package identifiers are configured.
- [x] BuildPair app icons, favicon, splash assets and PWA manifest exist.
- [ ] Produce final store screenshots, privacy labels, support URL and store listing copy.
- [ ] Test at minimum: small Android phone, current Pixel/Samsung size, iPhone SE size, modern iPhone, tablet and desktop web.
- [ ] Verify deep links and auth/payment return URLs from both cold and warm app states.
- [ ] Test poor-network/offline behaviour and screen-reader navigation on physical devices.
- [ ] Complete Play Store signing/release setup and iOS App Store signing/release setup when store launch becomes the target.

## Intentional historical internal names

The product and repository are BuildPair. Two legacy strings remain intentionally inside the migration system because changing them casually could corrupt migration tracking:

- `db/migrations/0000_buildmate_initial.sql`
- migration ledger table `buildmate_migrations`

The migration runner records applied filenames. Renaming the already-applied initial migration could make it look new and attempt to replay schema SQL. These are internal historical identifiers, not user-facing branding.
