# Farqiah 2026

A complete guest-first polling application: live voting, an admin control room, images and GIFs, safe live editing, vote migration, and a separate final round.

This application lives in `apps/farqiah-2026` in the existing Farqiayh repository. The existing static site at the repository root remains independently runnable. Deploy **this folder** as a Next.js application. GitHub Pages cannot execute its server or database routes.

## Run locally

Requirements: Node.js 22 or newer, npm, and PostgreSQL 16 or newer. Docker is optional.

```bash
cd apps/farqiah-2026
cp .env.example .env
```

Generate a random secret with `openssl rand -hex 32` and put it in `.env` as `APP_SECRET`. Leave `APP_URL=http://localhost:3000` for local development. If you already have PostgreSQL, set `DATABASE_URL` to your database. Otherwise:

```bash
docker compose up -d db
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Guests can immediately open the demo poll and vote. Click **Login** and enter **`silverhand` / `engineer`** for admin access. Seeding is idempotent: it updates the configured admin password hash and creates the demo poll only if it does not already exist. It never resets votes.

For a complete local Docker deployment after creating `.env`:

```bash
docker compose --profile full up --build
```

The `setup` container applies migrations and seeds the demo account before the production app starts. This Compose file is for a local demo and deliberately uses the requested demo credentials. PostgreSQL data survives container restarts in a named volume. `docker compose down` preserves that volume.

To run a production build directly:

```bash
npm run build
npm start
```

## Admin guide

1. Log in and select **Admin Dashboard → Create poll**. Set a title and optional description.
2. Add questions, choose single or multiple choice, and set a maximum selection count. Every question needs at least two options. At most one option per question can accept written answers.
3. Add images to questions and options with **Add image / GIF**. Upload GIF/PNG/JPEG/WebP files up to 3 MB, or paste an HTTPS direct image URL. Giphy/Tenor **direct GIF URLs** work; ordinary provider webpage links are not image files. Failed images show an accessible fallback.
4. Save the draft, then select **Open voting**. Share the URL from **Guest view**. Guests do not need an account or email. A display name is optional.
5. During voting, edit labels, images, or ordering and save. IDs stay unchanged. Add options at any time. Existing voters keep their ballots; adding an option does not give them a second vote for that question. A newly added question can be answered separately.
6. To merge, replace, or move a voted option, first save any pending changes. If necessary, add and save a replacement option. Choose **Migrate votes** on the old option, select its destination, review the explanation, and confirm. The original option is archived. Written answers remain stored. If a voter selected both source and destination, their ballot contributes **one** vote to the destination; the audit record records this overlap explicitly.
7. Select **Close voting** after round 1. Choose **Start final round**, review the ranked options, then select Top 2, Top 4, or a custom set for **every question**. At least two options must advance per question. Ties use existing option order as a display tie-breaker; the admin makes the final selection.
8. Start final voting. Each question and option gets a new ID with a `sourceId` linking it to round 1. Counts start at zero and the same guests can vote again. Round 1 remains available from the round selector.
9. Close the final round and select **Publish final results**. Published polls are locked. Tied top options are all shown as winners; a question with no votes does not declare a winner.

Duplicating a poll copies the current round into a new draft with fresh IDs and zero votes. Deleting a poll removes it from all application views while retaining its database records and audit history. Questions with votes cannot be deleted. Lowering a selection limit below an existing ballot’s size is rejected.

## Stack and layout

- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn-style Radix dialog/button primitives, Lucide, Sonner.
- PostgreSQL and Prisma 6, with checked-in SQL migrations and an idempotent seed.
- Server-Sent Events (SSE), with a shared database event counter and a 15-second client fallback refresh.
- Media is stored in PostgreSQL `bytea` for a self-contained v1. No local upload directory or object-storage account is required.

| Location                | Responsibility                                                     |
| ----------------------- | ------------------------------------------------------------------ |
| `src/app/`              | Public, poll, and admin pages; server API routes                   |
| `src/components/`       | Guest ballot, results, poll editor, migration and finalist dialogs |
| `src/components/ui/`    | Composable shadcn-style Button and Radix Dialog primitives         |
| `src/lib/polls.ts`      | Transactional business rules and read models                       |
| `src/lib/auth.ts`       | Admin sessions, signed guest cookies, shared rate limiting         |
| `src/lib/validation.ts` | Shared Zod form and request validation                             |
| `prisma/schema.prisma`  | Database schema                                                    |
| `prisma/migrations/`    | Reproducible PostgreSQL SQL migration                              |
| `prisma/seed.ts`        | Admin and demo poll                                                |
| `tests/`                | Validation tests and database/API workflow integration tests       |

The model separates **Poll → Round → Question → Option**, with one **Ballot** per anonymous guest per question, **Vote** selections pointing at stable option IDs, and optional **TextAnswer** records. Admin sessions, uploaded media, migration audits, and rate limits are persistent database records.

## Environment variables

| Variable              | Purpose                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string; use a TLS-enabled pooled URL on managed hosts.                                                                                |
| `APP_URL`             | Exact canonical origin, including scheme and port when applicable. Required for same-origin mutation checks and secure-cookie configuration.                |
| `APP_SECRET`          | Random secret of at least 32 characters; signs anonymous guest cookies. Keep it stable across instances and deploys.                                        |
| `DEMO_MODE`           | `true` allows the seed to create `silverhand` / `engineer` and a demo poll. Explicitly set `false` for a real production instance.                          |
| `ADMIN_USERNAME`      | Seed username, default `silverhand`.                                                                                                                        |
| `ADMIN_PASSWORD_HASH` | A scrypt hash, used by the seed to set the database admin’s password. Never put a production plaintext password in source or browser code.                  |
| `TRUST_PROXY`         | Trust `X-Forwarded-For` for IP-based login throttling only behind a proxy that overwrites it. Otherwise login throttling uses a shared conservative bucket. |

Generate a production password hash without putting a plaintext password in shell arguments:

```bash
read -s -p 'New admin password: ' FARQIAH_PASSWORD
printf '%s' "$FARQIAH_PASSWORD" | npm run --silent password:hash
unset FARQIAH_PASSWORD
```

Store the resulting `scrypt:...` string in your deployment’s `ADMIN_PASSWORD_HASH`, set `DEMO_MODE=false`, and run `npm run db:seed` once with those variables. This also replaces a previously seeded demo password for that username. Changing the environment variable alone does not update an existing database account. Use a strong production password; the exact requested demo password is intentionally public.

## Deployment

### Vercel

1. Import the GitHub repository and set **Root Directory** to `apps/farqiah-2026`, framework **Next.js**.
2. Provision a PostgreSQL database (for example, managed PostgreSQL or Supabase’s PostgreSQL connection pooler). Configure the environment variables above. Use the direct database connection for migrations if your provider’s transaction pooler does not support Prisma migration operations.
3. From a trusted machine or deployment job using production database variables, run `npm ci`, `npm run db:migrate`, and `npm run db:seed` once. For later schema changes, apply checked-in migrations before deploying compatible application code. Do not seed public demo data in production.
4. Deploy using `npm run build`. `vercel.json` and the SSE route set a 60-second function duration. Streams close at 45 seconds and automatically reconnect. All application instances read the same durable event counters; there is no process-local event bus.
5. Set `APP_URL` to the exact deployed origin. A preview deployment needs its own matching origin and preferably a separate database. Verify `/api/health`, then test guest voting and admin login on the deployed origin.

The upload body is capped at 3 MB to stay below typical serverless request limits. Media responses are immutable and cacheable. Public polling requests and authenticated data use `no-store`.

### Render

Use the included `render.yaml` as a Blueprint file, selecting `apps/farqiah-2026/render.yaml` if prompted. It defines a Node service and PostgreSQL database, build and migration/seed steps, and `/api/health`. Set `APP_URL` to the service’s exact HTTPS URL and provide `ADMIN_PASSWORD_HASH`. Review the service/database plan in your Render account before provisioning. `TRUST_PROXY=true` assumes Render is the only public ingress.

Alternatively create a Node service manually with the same root directory, `npm ci && npm run build`, pre-deploy `npm run db:migrate && npm run db:seed`, and start command `npm start`.

### Fly.io or another Docker host

Build the included Dockerfile from the app folder. The final image runs as the unprivileged `node` user on port 3000. Attach PostgreSQL, supply the environment variables, and run migrations/seeding from the `build` image as a separate one-time/release job before starting the runtime image. The runtime image contains Next.js standalone output and intentionally excludes development tools. Health check `/api/health`. No persistent application disk is needed because uploaded media is in PostgreSQL.

## Validation

```bash
npm run typecheck
npm test
npm run test:embedded
npm run build
```

`test:embedded` executes the SQL migration and integration suite using an ephemeral in-process PostgreSQL engine (PGlite). It opens no network ports and does not use your configured database. The production app always uses PostgreSQL through `DATABASE_URL`; the embedded adapter is a development-only test harness.

To exercise the workflows against a normal PostgreSQL server, export `DATABASE_URL` pointing to a **dedicated test database**, migrate it, and run:

```bash
npm run db:migrate
npm run test:integration
```

Tests cover anonymous cookies, server authorization, login/logout, media byte validation and retrieval, double submissions, max selections, cross-question option injection, text privacy, stable IDs during rename/reorder/add, stale admin edits, vote migration and overlap, final-round re-voting, published-result locking, soft deletion, and streamed edit events. The GitHub Actions workflow provisions PostgreSQL 16 and runs the same checks. The integration suite cleans up only its own polls and media. It must still run on a test database because rate-limit buckets and test admin accounts are exercised.

Suggested browser checks before public launch: desktop and 390 px mobile layouts; keyboard-only login, ballot selection and dialogs; guest and admin in separate browser contexts; lost/reconnected network; a broken GIF URL; and two admin tabs editing the same poll. The automated tests exercise API handlers and database logic; they do not substitute for browser or production load testing.

## V1 assumptions and limits

- The existing GitHub repository is the source destination. This app is added alongside its static site, in a separate folder.
- Voting is submitted per question, with one immutable ballot per browser session per question per round. Guests may leave other questions unanswered and return later. A new question added live is available to earlier voters.
- Signed, HttpOnly, SameSite cookies and database uniqueness prevent ordinary accidental double submissions, including concurrent requests. Clearing cookies, switching browsers, or using another device can allow another vote. This is anonymous group polling, not verified identity voting.
- Live totals are visible before voting. Percentages use the number of ballots for that question as the denominator, so multiple-choice percentages can exceed 100% in total. Poll participant counts are distinct anonymous sessions within the current round. Admin dashboard totals sum those per-poll counts, not unique people across polls.
- One first round and one final round per poll. Finalists need at least two choices per question. Text options may advance and collect new text; their earlier written answers are retained with round 1.
- Every mutation for a poll locks its row in a database transaction. Vote deduplication and migration are atomic. Admin edit revisions are separate from live event counters, so incoming votes do not invalidate an open editor.
- SSE checks lightweight database revisions approximately every 1.5 seconds. It works across instances without Redis, but database query load grows with connected viewers. This is suitable for a group-scale v1; it has not been load-certified for large public events.
- Uploaded files are checked by size and image signature and served with safe MIME/security headers. They are not transcoded or malware-scanned. External images load directly in the browser with no referrer; the server does not fetch arbitrary URLs.
- Media and vote history are retained when a poll is deleted. Admin views show at most 200 recent text submissions per poll; all are stored. Use a database export for a complete archive.
- Production credentials are hashed with scrypt. Sessions use random opaque tokens, only hashed tokens are stored, and logout revokes the session. Login, upload, and mutation rate limits are shared across app instances. Use HTTPS and a stable secret. Replacing `APP_SECRET` invalidates anonymous cookies and therefore resets the practical duplicate-voting boundary.

## Future improvements

Move larger media collections to S3/R2 with image processing; replace revision sampling with PostgreSQL notifications or a managed pub/sub service for larger audiences; add pagination, moderation and CSV export for text responses; add a retention policy and cleanup job for expired rate limits, sessions and unused media; add passkeys or individual admin accounts; and add Playwright browser coverage plus concurrency/load testing on the intended hosting provider. Arabic/RTL localization is a separate enhancement; this build follows the English interface requested here.

## Framework references

- [Next.js App Router documentation](https://nextjs.org/docs/app)
- [Next.js standalone deployment](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Prisma production migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)
- [Prisma database seeding](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding)
