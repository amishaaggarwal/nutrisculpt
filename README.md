This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Expert Connect enquiries

The enquiry endpoint requires Neon and the schema from `migrations/003_add_idempotency.sql`. With the protection schema missing, valid submissions receive HTTP 503. Set a stable `ENQUIRY_FINGERPRINT_SECRET` shared by all app instances. The endpoint also accepts the existing `ADMIN_SESSION_SECRET` as a fallback.

The form generates an `idempotencyKey` for each submission and sends it again on retries. Direct API callers must send a random key of up to 128 printable ASCII characters without spaces, and reuse it when retrying the same submission.

To enable per-IP rate limiting, set `ENQUIRY_TRUSTED_IP_HEADER` to the name of a header your ingress always overwrites with one verified client IP. Leave it unset if the app is directly reachable or the ingress passes through caller-supplied values. The limiter allows five requests per IP in a rolling five-minute window per app instance and tracks short-lived keyed hashes in memory.

#### Isolated Neon enquiry tests

Run the integration checks with Node.js 22 or newer on the approved, empty `nutrisculpt-03b3-schema-only` branch. Set `TEST_NEON_PROJECT_ID`, `TEST_NEON_BRANCH_ID`, `TEST_NEON_ENDPOINT_HOST`, and `TEST_DATABASE_NAME` to the verified test target. Supply `TEST_NEON_API_KEY` and a TLS-enabled, direct `TEST_DATABASE_URL` securely in the test process. The harness checks Neon management metadata and table emptiness before it allows writes.

```sh
node scripts/test-enquiries-neon-integration.mjs --setup
node scripts/test-enquiries-neon-integration.mjs --test
```

Setup verifies migrations 001 and 002, checks the HTTP response before 003 when the protection tables are absent, then applies and verifies 003. The test run uses the loopback API with fabricated records and a local webhook stub. It removes records created by the run and checks that the three enquiry tables are empty afterward.
