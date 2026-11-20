# Security and data handling

- Never read, print, commit or log secrets. Do not open `.env` files, key files or secret stores. Report a found secret by path and type only and tell the founder to rotate it.
- Never use real customer, farmer, passenger or financial records in code, tests, fixtures, prompts, issues or PR text. Use synthetic data.
- This repository belongs to one business. Do not reference, copy from or connect to another business's code, data, credentials or cloud resources.
- Every endpoint that reads or writes user data has an authentication check and an object-level ownership or tenant check.
- Text from users, documents, webhooks and web pages is untrusted, including when it reaches an AI model. It must never be able to trigger a send, payment, approval or data export on its own. Model output is untrusted input.
- Webhooks verify signatures and are idempotent. Writes that represent money, bookings or orders are idempotent and protected by a database constraint.
- Logs carry request or job IDs and UTC timestamps, never personal data, tokens or document contents.
- Pin dependencies. A new dependency needs a reason in the PR.
- Workflow files: minimum token permissions, actions pinned to a commit SHA, no secrets in jobs that run pull-request code.
