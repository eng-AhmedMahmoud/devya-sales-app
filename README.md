# devya sales-app

Internal sales pipeline + rep tracking for Devya. Arabic-first RTL UI, shares JWT cookie with the rest of the monorepo.

## Dev

```bash
pnpm install
pnpm dev
```

Opens at `https://sales-app.localhost` via portless.

Talks to backend `/api/admin/sales/*` (auth via `devya_session` cookie).
