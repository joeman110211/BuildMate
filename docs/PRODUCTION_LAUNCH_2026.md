# BuildPair production launch plan

Current launch target: `https://www.buildpair.co.uk`

This document is the working production gate for the public UK launch. It does not replace automated tests. A build is launchable only when the relevant web, Android, iOS, payments, infrastructure, security and operational gates below are satisfied.

## Current product decisions

- Canonical product: BuildPair.
- Canonical web origin: `https://www.buildpair.co.uk`.
- Root `https://buildpair.co.uk` redirects to `www`.
- Native scheme: `buildpair://`.
- Android package: `uk.co.buildpair.app`.
- iOS bundle identifier: `uk.co.buildpair.app`.
- Starter Free: £0, 2 main trade categories, 0 open-marketplace offers.
- BuildPair Plus: £19.99/month, 4 main trade categories, 15 open-marketplace offers/month.
- BuildPair Pro: £29.99/month, 6 main trade categories, 35 open-marketplace offers/month.
- No free trial in the current commercial model.
- Direct quote requests do not consume open-marketplace offer allowance.
- Marketplace job-payment platform fee is currently configured at 5% unless commercial policy is deliberately changed.
- Production must run with `BUILDPAIR_PREVIEW_DATA_ENABLED=false`.

## Live Stripe catalogue already created

These IDs are public configuration identifiers, not secret keys.

- Plus product: `prod_VDGhEUrdPFzGAm`
- Plus monthly price: `price_1UCqAM8bTbZf5Cph1OFqiYPT` (£19.99 GBP/month)
- Pro product: `prod_VDGj402saoOUUx`
- Pro monthly price: `price_1UCqC88bTbZf5CphvqAmDTnC` (£29.99 GBP/month)

Production server mapping:

```env
STRIPE_BASIC_PRICE_ID=price_1UCqAM8bTbZf5Cph1OFqiYPT
STRIPE_FEATURED_PRICE_ID=price_1UCqC88bTbZf5CphvqAmDTnC
PLATFORM_FEE_PERCENT=5
```

Never commit or paste `sk_live_...`, Clerk secret keys, database credentials, Cloudinary secrets, Resend secrets, Gemini keys, webhook signing secrets or other server credentials into GitHub or chat.

## Web production gate

- Deploy the Docker/Caddy production stack to an always-on Linux host rather than the Chromebook.
- Set production DNS and TLS for `www.buildpair.co.uk`, with the root domain redirecting to `www`.
- Keep the app/API same-origin on web.
- Apply every checked-in database migration and create a recoverable database backup before public traffic.
- Confirm `/api/health` and `/api/readiness` return healthy production results.
- Configure production Clerk origins/redirects and verify email/password plus intended social providers.
- Configure Resend production domain/sender and verify contact and invoice delivery.
- Configure Cloudinary production upload credentials and verify upload/display/replacement/deletion.
- Configure live Stripe Billing, Billing Portal, platform webhook and Connect webhook on the production origin.
- Exercise subscription start, upgrade, downgrade, cancellation, failed renewal and portal access.
- Exercise marketplace payment success, decline, 3DS, cancellation, duplicate webhook and refund behaviour.
- Exercise Connect onboarding including incomplete verification and disabled-payment states.
- Configure external uptime/error/log/payment-webhook monitoring and alerts.
- Keep search indexing deliberately controlled until the launch owner explicitly removes the quiet-launch noindex rule.
- Remove or clearly isolate all preview/demo marketplace data from production.
- Run the full non-destructive production smoke suite against the exact deployed SHA before launch.

## Android production gate

- EAS production builds must use the EAS `production` environment.
- Production public client values include `EXPO_PUBLIC_API_URL=https://www.buildpair.co.uk`, the production Clerk publishable key and live Stripe publishable key.
- Server-only secrets must never be bundled into Android.
- Produce a signed production AAB for Google Play and an internal/test APK only for device QA.
- Verify `buildpair://` auth/payment returns from both cold and warm app states.
- Test sign-up/sign-in, account mode switching, trader onboarding, post-a-job, messaging, quotes, payments, uploads and account deletion on physical Android devices.
- Test at least one small Android phone and one current Pixel/Samsung-sized phone.
- Complete Google Play Console signing, store listing, screenshots, privacy/data-safety declarations, support URL and release-track setup.

## iOS production gate

- EAS production builds must use the EAS `production` environment.
- Production public client values point to `https://www.buildpair.co.uk` and production Clerk/Stripe public configuration.
- Server-only secrets must never be bundled into iOS.
- Configure Apple signing, App Store Connect application record and TestFlight.
- Verify `buildpair://` auth/payment returns from cold and warm app states.
- Test sign-up/sign-in, account mode switching, trader onboarding, post-a-job, messaging, quotes, payments, uploads and account deletion on iPhone-sized devices.
- Test at least a compact iPhone size and a current full-size iPhone; verify iPad layout because tablet support is enabled.
- Complete App Store screenshots, privacy labels, support/privacy URLs, age/category metadata and review submission configuration.

## Current automated-test rule

The product security/entitlement rules are the source of truth. Tests must be updated when a previous beta assumption becomes obsolete; production security must not be weakened merely to make an old test green.

Examples already identified in the older E2E suite:

- Starter traders are not paid/searchable lead recipients, so a test must not expect an inactive free trader to accept a paid direct-lead journey.
- Starter currently has a 2-category limit, not the older 3-category beta expectation.
- The current web auth UI uses Clerk's web components, while native uses BuildPair's custom Clerk screens. Browser tests must target the actual web flow rather than native-only button copy.
- Current canonical trade categories must be used in tests and deterministic AI fallbacks.

## Human/account-owner tasks that code cannot complete by itself

- Create/maintain the production VPS/cloud account and billing method.
- Control production DNS at the domain provider.
- Maintain the live Stripe account, bank/payout and regulatory/business details.
- Maintain the Apple Developer/App Store Connect account and accept Apple agreements.
- Maintain the Google Play Console developer account and accept Google agreements.
- Confirm BuildPair's actual UK VAT registration status before enabling VAT collection or making VAT claims on customer documents.
- Approve final legal wording and operational policies for subscriptions, refunds, chargebacks, disputes, complaints, dangerous work, trader removal and data retention.

## Launch evidence required

Do not mark BuildPair launched merely because a commit exists. Retain evidence of:

1. the exact production Git SHA,
2. green Quality CI,
3. passing production-safe browser smoke/E2E evidence,
4. a successful real low-value live subscription/payment smoke test followed by appropriate refund/cancellation where applicable,
5. Android signed-build installation and device QA,
6. iOS TestFlight/App Store build QA,
7. database backup/restore readiness,
8. production monitoring and alert delivery.
