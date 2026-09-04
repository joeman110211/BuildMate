# BuildMate production checklist

## Product and legal

- Publish UK privacy notice, cookie policy, marketplace terms, trader subscription terms and cancellation/refund rules.
- Obtain advice on platform liability, consumer contracts, VAT invoicing and whether payment flows create any regulated obligations.
- Define complaints, chargeback, disputed-work, dangerous-work and trader-removal procedures.
- Make the self-certification disclaimer prominent and never market profiles as vetted unless a real vetting process is introduced.

## Security

- Use separate Clerk, Neon, Stripe, Gemini and Resend projects/keys for development and production.
- Rotate any secret ever pasted into chat, source control, tickets or logs.
- Add rate limiting/WAF rules to auth-adjacent, Gemini, quote, invoice and payment endpoints at the hosting layer.
- Restrict production database access, enable point-in-time restore and test a restore.
- Add error reporting with personal-data scrubbing; never log bearer tokens, payment secrets or customer job addresses.
- Run dependency and secret scanning in CI.

## Payments

- Test successful, declined, 3DS, cancelled, duplicate-webhook and refunded payments.
- Test Connect accounts with incomplete verification and disabled charges.
- Test subscription upgrade, downgrade, cancellation, failed renewal and customer portal access.
- Decide who absorbs Stripe fees and document BuildMate’s platform fee.

## App stores and devices

- Replace default identifiers with the final company-owned bundle/package IDs before the first store release.
- Add production icons, splash image, screenshots, privacy labels, support URL and account-deletion route.
- Test at minimum: small Android phone, current Pixel/Samsung size, iPhone SE size, modern iPhone, tablet and desktop web.
- Verify deep links and payment return URLs from cold and warm app states.
- Test offline/poor-network behaviour and screen-reader labels.

## Operations

- Configure domain DNS, HTTPS, transactional email DNS and uptime alerts.
- Establish database retention/deletion rules for unsuccessful applicants and closed accounts.
- Create an admin moderation system before public launch; direct database editing is not a support process.
- Document incident response and assign ownership for Stripe, Clerk, Neon and app-store alerts.
