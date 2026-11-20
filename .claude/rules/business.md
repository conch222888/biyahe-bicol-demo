# Business rules

This product is a transport booking and ticketing platform (confirmed by the founder). Where the product is still a client-side demo with sample data, the rules below are requirements for the first real backend, and the demo must never present sample data, simulated payment or unsigned tickets as real.

## Non-negotiable
- A seat on a trip can be held or sold to one booking only. This is enforced by a database constraint and a transactional reservation, not only by application checks.
- Payment and booking states must always reconcile: no paid booking without a seat, no seat without a payment or a valid, expiring hold.
- Payment webhooks are signature-verified and idempotent. A repeated, delayed or out-of-order webhook must not double-charge, double-confirm or double-refund.
- Passenger data (names, phone numbers, IDs, travel history) is personal data: minimise, never log, never use real records in tests.
- No production payment credentials or customer records in development, tests or agent sessions. Use the gateway's sandbox.

## Tests that must exist for changes in these areas
- Concurrent requests for the same seat: exactly one succeeds.
- Hold expiry releases the seat; payment arriving after expiry is handled without overselling.
- Webhook delivered twice, late, or before the client returns.
- Cancellation and refund: seat released once, refund issued once, states reconciled.
- Operator and admin routes reject passengers and other operators' staff.
- Confirmation or notification failure does not lose or duplicate the booking.
- Recovery after a crash between payment and confirmation.

HIGH risk by default: seat inventory, payments and refunds, fares, operator permissions, schema.
