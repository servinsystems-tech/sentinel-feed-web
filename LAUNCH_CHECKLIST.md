# SentinelFeed launch checklist

The static site is prepared for `https://getsentinelfeed.com/` and GitHub Pages. No paid hosting platform or build service is required.

## Completed in this PR

- Original supplied logo retained and its visible shield centered consistently with CSS.
- The legal operator identity is disclosed only in the body of the Terms page, not in global components or metadata.
- Public support address set to `support@getsentinelfeed.com`; the private destination mailbox is deliberately not committed.
- Terms, Privacy Notice and Refund Policy completed and linked from the purchase page.
- Canonical URLs, Open Graph URL, structured business data, `CNAME`, `robots.txt` and `sitemap.xml` added for the new domain.
- Paddle SDK loads only when a plan is selected. The live public client-side token, production environment and per-plan Price ID mapping are configured without a private API key.
- Prices, plan deliverables, recurring monthly billing, cancellation, limitations and data-source disclosures are visible before checkout.
- No fabricated testimonials, certification badges or outcome guarantees. Only Individual advertises the 7-day free trial configured on its Paddle Price.

## External setup required before accepting live payments

1. Publish the site with GitHub Pages and set the custom domain to `getsentinelfeed.com`.
2. Point the apex domain and `www` to GitHub Pages, wait for DNS validation, then enable **Enforce HTTPS**.
3. Configure `support@getsentinelfeed.com` as a forwarding alias to the owner's private mailbox and verify receipt before submitting the domain.
4. Verify a dedicated sending subdomain such as `updates.getsentinelfeed.com` in Resend and copy the exact DNS records Resend provides. Do not put the Resend API key in this repository.
5. Confirm automatic Teams recipient and Enterprise endpoint capture in the two checkout setup forms, with no manual onboarding.
6. In the private backend repository, set the live `PADDLE_API_KEY` GitHub Secret, `PADDLE_ENVIRONMENT=production` Variable, and live `PADDLE_PRICE_MAP` Variable. Delete or update an existing `PADDLE_PRICE_MAP` Secret, which takes precedence over the Variable. Never add the Paddle API key to this site.
7. Check Paddle's live dashboard: Individual's Price has a 7-day free trial, Teams and Enterprise do not, and the site domain is approved for live checkout. Do not infer dashboard configuration from the client-side code.
8. Coordinate the web deployment and backend live settings so a customer cannot complete a live checkout while backend sync still points to sandbox. Confirm Paddle copies checkout `customData` into the live subscription before accepting Teams or Enterprise.

## Refund commitment to review

The public policy accepts requests for an initial subscription charge within 7 calendar days. Renewal charges are generally non-refundable except where law requires otherwise or the Service materially failed. Obtain local legal advice if a different Paraguay-specific policy is required.

## Local preview

Run `python -m http.server 8000` in this directory and open `http://localhost:8000`.
