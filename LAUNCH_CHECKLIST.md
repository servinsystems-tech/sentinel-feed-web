# SentinelFeed website handoff

This is a static website: no build subscription or new hosting platform required. Relative links support GitHub Pages project paths and a future custom domain.

## Owner decisions needed before publishing
- Fill operator legal name and support email in terms.html, privacy.html and refund.html. Existing placeholders intentionally remain visible in draft policies; no identity/contact address was invented.
- Approve existing refund eligibility rule (7 days; no more than one briefing accessed/received) or specify a replacement. This redesign does not invent a new refund commitment.
- Review legal drafts for actual operating entity, privacy practices, retention and applicable obligations.
- Confirm how up to five Teams recipients are enrolled; current backend has no self-service team membership. Arrange onboarding before charging for this tier.
- Confirm Enterprise HTTPS endpoint onboarding and successful delivery.
- Add a real Kokoro sample if desired; the page explicitly labels the current excerpt as a fictional editorial sample.
- Verify production Paddle approval, live client-side token, live monthly USD prices (99 / 349 / 999) and matching backend price map. Current retained IDs and token are sandbox; amounts cannot be verified from public credentials.
- Test checkout in sandbox and test backend enrollment separately. Browser checkout completion never grants entitlements itself.
- Replace sandbox configuration in index.html only after approval; remove the pre-launch notice and draft-policy banners only after all launch checks pass.
- Connect domain and HTTPS, confirm email sender authentication and working support inbox.
- Verify audio publication/email delivery in production; the site cannot guarantee backend delivery.

## Implementation
- Original supplied logo preserved in assets/logo-original.jpg; CSS framing displays its shield without modifying the image.
- Paddle SDK loads only when a plan is selected. Explicit sandbox selection, public-token/environment validation, per-plan mapping and user-readable error states.
- No email collection form without a working destination, no fabricated testimonials, certification badges or outcome guarantees.
- Sample JSON is illustrative and includes null for unavailable EPSS.
- Source links describe data provenance, not vendor endorsement.
- Existing policies restyled. Trial promises corrected to checkout-dependent terms; obsolete email provider removed.
- This PR includes the sandbox environment correction from the separate existing web PR #1; review overlap before merging both.

## Preview
Run `python -m http.server 8000` in this directory and open http://localhost:8000.
