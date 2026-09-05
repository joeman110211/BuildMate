# BuildPair production checklist

Status reviewed: 5 September 2026.

This is deliberately split into what the repository already provides and what still needs live-environment or operational verification. A green TypeScript build is useful, but it is not a magical certificate that every third-party service behaves itself in production.

## Completed in the repository

- [x] Final public product name is BuildPair in user-facing application configuration and copy.
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
- [x] Health and readiness endpoints exist.
- [x] GitHub Quality CI covers lint, TypeScript, unit tests, web export, Android export, iOS export and production dependency audit.
- [x] Playwright production E2E covers the homeowner → trader → job → quote → acceptance → messaging → completion → payment confirmation → verified review lifecycle.
- [x] No GitHub code-search matches were found for common committed secret prefixes checked during the 5 September audit.

## Required before sharing the latest beta publicly

- [ ] Get the latest `main` commit deployed successfully after the current Vercel build-rate limit clears or hosting is changed.
- [ ] Attach the branded production domain and change remaining runtime origins from the temporary `buildmate-nine.vercel.app` infrastructure URL to the BuildPair domain.
- [ ] Confirm `/api/readiness` returns HTTP 200 with `ready: true` on the latest deployment.
- [ ] Run the production Playwright E2E workflow against that same latest deployment and retain the passing run as launch evidence.
- [ ] Confirm the Android release APK workflow completes and installs on a physical Android phone.
- [ ] Confirm Clerk production redirect/origin settings for email, Google and Facebook on the final web domain and `buildpair://` native callback.
- [ ] Send a real Contact form message and a real test invoice through the production Resend/domain configuration.
- [ ] Upload, display and delete/replace test job and trader photos through the production Cloudinary configuration.
- [ ] Confirm the current database has every checked-in migration applied and take a recovery point / backup before public beta traffic.
- [ ] Confirm database point-in-time restore is enabled and document how to restore it.
- [ ] Add production error reporting with personal-data scrubbing and an uptime alert for the web/API health endpoint.
- [ ] Add hosting-level rate limiting/WAF rules to public/contact, Gemini and authenticated write endpoints that are abuse-sensitive.

## Product / legal checks before wider public launch

- [x] UK privacy notice, cookie policy, marketplace terms and marketplace disclaimer pages are present.
- [x] The current product describes trade credentials as self-certified rather than claiming BuildPair has vetted them.
- [ ] Review the final legal wording before a wider paid launch, especially trader subscriptions, cancellation/refunds, consumer contracts, VAT invoicing, platform liability and payments.
- [ ] Define and document complaints, dangerous-work, disputed-work, chargeback and trader-removal procedures for support/admin use.
- [ ] Add a clear account-deletion workflow and corresponding retention/deletion policy before app-store release.

## Payments

Stripe code exists but Stripe remains intentionally optional for the current beta.

Before enabling paid subscriptions or BuildPair job payments:

- [ ] Test successful, declined, 3DS, cancelled, duplicate-webhook and refunded payments in Stripe test mode.
- [ ] Test Connect accounts with incomplete verification and disabled charges.
- [ ] Test subscription start, upgrade, downgrade, cancellation, failed renewal and billing-portal access.
- [ ] Confirm platform fee policy and who absorbs Stripe processing fees.
- [ ] Verify both platform and Connect webhook destinations/signing secrets in the final production domain.

## App stores and devices

- [x] Final bundle/package identifiers are already configured.
- [x] BuildPair app icons, favicon, splash assets and PWA manifest exist.
- [ ] Produce final store screenshots, privacy labels, support URL and store listing copy.
- [ ] Test at minimum: small Android phone, current Pixel/Samsung size, iPhone SE size, modern iPhone, tablet and desktop web.
- [ ] Verify deep links and auth/payment return URLs from both cold and warm app states.
- [ ] Test poor-network/offline behaviour and screen-reader navigation on physical devices.
- [ ] Complete Play Store signing/release setup and iOS App Store signing/release setup when store launch becomes the target.

## Intentional historical / infrastructure names

The product is BuildPair. A few old strings remain intentionally because changing them casually would risk production infrastructure:

- GitHub repository: `joeman110211/BuildMate`. Rename only as a coordinated GitHub/Vercel/integration change.
- Current Vercel origin: `buildmate-nine.vercel.app`. Replace with the branded BuildPair domain once attached.
- Historical migration `db/migrations/0000_buildmate_initial.sql` and migration ledger table `buildmate_migrations`. The migration runner records filenames, so renaming an already-applied migration would make it look unapplied and could rerun initial schema SQL.

These are not user-facing BuildMate branding and should not be changed just to make a text search aesthetically perfect.
