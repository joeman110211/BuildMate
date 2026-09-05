# Security policy

Report suspected vulnerabilities privately to the security contact configured for the production service. Do not open public GitHub issues containing customer data, credentials or exploit details.

BuildPair’s client is untrusted. Authorization, monetary totals, quote acceptance, review eligibility, subscription state and payment state are enforced by the API/database or verified provider webhooks.

No secret should use the `EXPO_PUBLIC_` prefix. If a secret is exposed, revoke and rotate it immediately; deleting it from Git history alone is not enough.
