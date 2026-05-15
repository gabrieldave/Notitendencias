# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Notitendencias** is a single-service Next.js 15 monolith (App Router, TypeScript, Tailwind, Drizzle ORM) that serves both the public website and an admin panel. Port: **3015**.

### Prerequisites

- **Node.js 22** (already available in the VM)
- **PostgreSQL** must be running locally on `127.0.0.1:5432` with user `cursor` / password `cursor` and database `notitendencias`

### Starting PostgreSQL

```bash
sudo pg_ctlcluster 16 main start
```

### Running the app

```bash
npm run dev        # → http://localhost:3015
```

### Key commands (documented in package.json)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server on port 3015 |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run setup` | Verify env + migrations + seed |
| `npm run db:migrate` | Apply Drizzle migrations only |
| `npm run db:seed` | Seed categories and sources |
| `npm run db:studio` | Drizzle Studio (DB browser) |

### Environment

The `.env` file at repo root configures the app. Minimum required variables for local dev:
- `DATABASE_URL` — PostgreSQL connection string
- `ADMIN_PASSWORD` — Password for `/admin` panel
- `BRIDGE_API_KEY` — Bearer token for `POST /api/bridge/ingest`
- `AUTH_SECRET` — Auth.js session secret

### Gotchas

- The `next.config.ts` uses `output: "standalone"` which is for Docker deployment; in dev mode (`npm run dev`) this has no effect.
- The `npm run setup` script is idempotent — safe to re-run after pulling new migrations.
- Admin panel auth uses httpOnly cookie set by `POST /api/admin/login` with the `ADMIN_PASSWORD`.
- Lint command uses `next lint` (deprecated warning is cosmetic, linting still works).
- The build requires `DATABASE_URL` to be set even for `next build` — the code provides a dummy fallback during the build phase (`NEXT_PHASE === "phase-production-build"`).
