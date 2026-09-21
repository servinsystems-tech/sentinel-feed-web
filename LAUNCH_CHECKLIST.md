# SentinelFeed launch checklist

The static site is prepared for `https://getsentinelfeed.com/` and GitHub Pages. No paid hosting platform or build service is required.

## Completed in this PR

- Original supplied logo retained and its visible shield centered consistently with CSS.
- The legal operator identity is disclosed only in the body of the Terms page, not in global components or metadata.
- Public support address set to `support@getsentinelfeed.com`; the private destination mailbox is deliberately not committed.
- Terms, Privacy Notice and Refund Policy completed and linked from the purchase page.
- Canonical URLs, Open Graph URL, structured business data, `CNAME`, `robots.txt` and `sitemap.xml` added for the new domain.
- Paddle SDK loads only when a plan is selected. Explicit sandbox selection, public-token/environment validation, per-plan mapping and user-readable error states remain in place.
- Prices, plan deliverables, recurring monthly billing, cancellation, limitations and data-source disclosures are visible before checkout.
- No fabricated testimonials, certification badges, outcome guarantees or automatic trial promise.

## External setup required before Paddle production verification

1. Publish the site with GitHub Pages and set the custom domain to `getsentinelfeed.com`.
2. Point the apex domain and `www` to GitHub Pages, wait for DNS validation, then enable **Enforce HTTPS**.
3. Configure `support@getsentinelfeed.com` as a forwarding alias to the owner's private mailbox and verify receipt before submitting the domain.
4. Verify a dedicated sending subdomain such as `updates.getsentinelfeed.com` in Resend and copy the exact DNS records Resend provides. Do not put the Resend API key in this repository.
5. Confirm Teams recipient onboarding and Enterprise HTTPS endpoint onboarding operationally.
6. Test all three Paddle sandbox checkouts and the backend subscription sync.
7. Submit `https://getsentinelfeed.com/` for Paddle website approval only after the home page and all three legal URLs are publicly reachable over HTTPS.
8. After Paddle production approval, replace only the public sandbox client-side token and sandbox Price IDs with their production counterparts, switch the environment to `production`, and remove the pre-launch notice. Never add a Paddle API key to this site.

## Refund commitment to review

The public policy accepts requests for an initial subscription charge within 7 calendar days. Renewal charges are generally non-refundable except where law requires otherwise or the Service materially failed. Obtain local legal advice if a different Paraguay-specific policy is required.

## Local preview

Run `python -m http.server 8000` in this directory and open `http://localhost:8000`.
