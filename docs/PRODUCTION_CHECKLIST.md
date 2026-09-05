# BuildPair production checklist

See `docs/RELEASE_GATES.md` for the enforced order and manual E2E workflow details.

## Beta readiness

- [ ] Configure Clerk, Neon, Gemini, Resend and Cloudinary production environment variables.
- [ ] Confirm `/api/readiness` returns `ready: true` before sharing the beta publicly.
- [ ] Keep `BUILDPAIR_BETA_LEAD_GRACE=true` while paid Stripe billing is intentionally disabled.
- [ ] Set `BUILDPAIR_PREVIEW_DATA_ENABLED=true` only while clearly labelled beta preview content is wanted; set it false for real-data-only operation.
- [ ] Run the manual authenticated homeowner-to-tradesperson E2E workflow on desktop and 360x640 Android.
- [ ] Run deployed Gemini, Cloudinary and Resend smoke tests.

## Product and legal

- [x] Add beta UK privacy notice, cookie notice and marketplace terms pages.
- [ ] Obtain appropriate UK legal/commercial review before a national paid public launch.
- [ ] Finalise operator legal identity/address, trader subscription terms and cancellation/refund rules.
- [ ] Obtain advice on platform liability, consumer contracts, VAT invoicing and whether payment flows create any regulated obligations.
- [ ] Define complaints, chargeback, disputed-work, dangerous-work and trader-removal procedures.
- [x] Make the self-certification disclaimer prominent and do not market profiles as vetted unless a real vetting process is introduced.

## Security and monitoring

- [x] Add production security headers at the hosting layer.
- [x] Return correlation IDs for unexpected API errors and redact common credentials/personal data from structured server error logs.
- [ ] Verify Vercel runtime errors are searchable by `[buildpair-api]` and `errorId` after deployment.
- [ ] Configure production error/uptime alerts in Vercel or the final monitoring provider.
- [ ] Use separate Clerk, Neon, Stripe, Gemini and Resend projects/keys for development and production where practical.
- [ ] Rotate any secret ever pasted into chat, source control, tickets or logs.
- [ ] Add/verify rate limiting or WAF rules to auth-adjacent, Gemini, quote, invoice and payment endpoints at the hosting layer.
- [ ] Restrict production database access, enable point-in-time restore and test a restore.
- [x] Run dependency audit in CI; keep secret scanning enabled at the repository/hosting level.

## Payments

- [x] No-Stripe private-beta payment recording is explicit: BuildPair records a homeowner confirmation but does not claim to move the money.
- [ ] Test successful, declined, 3DS, cancelled, interrupted, duplicate-webhook and refunded payments before enabling paid plans or job payments.
- [ ] Test Connect accounts with incomplete verification and disabled charges.
- [ ] Test subscription start after trial, upgrade, downgrade, cancellation, failed renewal and customer portal access.
- [ ] Decide who absorbs Stripe fees and document BuildPair's platform fee.
- [ ] Only after payment tests pass, configure Stripe and set `BUILDPAIR_BETA_LEAD_GRACE=false`.

## App stores and devices

- [x] Final source identifiers use `uk.co.buildpair.app` for Android and iOS.
- [x] BuildPair app name, slug and URL scheme are configured.
- [x] Add PWA/store icon and splash assets in source.
- [x] Add automated 320px and Pixel 5 public-layout regression checks.
- [x] Add full 360x640 Android authenticated core-flow regression.
- [ ] Complete current Pixel/Samsung, iPhone SE, modern iPhone, tablet and desktop manual device matrix before public store release.
- [ ] Add final store screenshots, privacy labels, support URL and account-deletion route/process.
- [ ] Verify deep links and payment return URLs from cold and warm app states after Stripe is enabled.
- [ ] Test offline/poor-network behaviour and screen-reader labels.

## Operations and domain

- [ ] Attach final `buildpair.co.uk` domain and verify DNS/HTTPS.
- [ ] Update Clerk allowed origins/redirects to the final domain.
- [ ] Verify Resend sending-domain DNS.
- [ ] Configure uptime alerts.
- [ ] Establish database retention/deletion rules for closed accounts and unused beta test data.
- [x] Admin moderation system exists; direct database editing is not the normal support process.
- [ ] Document incident response and assign ownership for Stripe, Clerk, Neon and app-store alerts.

## Infrastructure rename - last

- [ ] Rename GitHub repository from BuildMate to BuildPair only after all dependencies are stable.
- [ ] Rename Vercel project from BuildMate to BuildPair only after all dependencies are stable.
- [ ] Update clone URLs, deployment references, callbacks and documentation after the infrastructure rename.
- [x] Preserve historical database migration filenames, including `db/migrations/0000_buildmate_initial.sql`.
