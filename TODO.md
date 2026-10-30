# TODO

## Mercado Pago payments

Add Mercado Pago after the business account and credentials are ready.

- [ ] Confirm the Mercado Pago country, account ownership, and product to use (Checkout Pro or another checkout flow).
- [ ] Create sandbox and production applications in Mercado Pago.
- [ ] Keep access tokens and webhook secrets on the API server; never expose them in the static site or `site-config.js`.
- [ ] Add a server endpoint that creates a payment preference for the selected plan or package.
- [ ] Add a checkout action to the plan request flow without replacing the existing WhatsApp fallback.
- [ ] Add a Mercado Pago webhook endpoint to verify payment status server-side and make it idempotent.
- [ ] Store the payment ID, preference ID, plan/package, amount, currency, and status with the existing plan request.
- [ ] Treat only a verified server-side `approved` status as paid; never trust the browser redirect alone.
- [ ] Add success, pending, and failure states to the site and API.
- [ ] Test the complete flow in sandbox, including duplicate webhooks, abandoned checkouts, refunds, and rejected payments.
- [ ] Update the privacy policy, payment terms, and release checks before production launch.
- [ ] Configure production URLs, webhook signing/secrets, and monitoring after the account is approved.
