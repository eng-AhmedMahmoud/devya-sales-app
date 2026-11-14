# devya sales-app

Internal sales pipeline + rep tracking for Devya. Arabic-first RTL UI, shares JWT cookie with the rest of the monorepo.

## Dev

```bash
pnpm install
pnpm dev
```

Opens at `https://sales-app.localhost` via portless.

Talks to backend `/api/admin/sales/*` (auth via `devya_session` cookie).

## Hosting

Production runs on the Devya VPS (`72.61.81.59`) as the container `devya-sales-app` on
`127.0.0.1:3172`, behind nginx (`/etc/nginx/sites-available/devya-sales-app`, TLS by
certbot) for `sales.devya-solutions.com`. The app left Vercel after the account pause of
2026-11-13; the Vercel project stays, unused.

- Nothing builds on the VPS. `npm run deploy` (`scripts/deploy.sh`) builds the Next
  standalone server on the Mac from `origin/main`, swaps in Linux sharp binaries,
  ships it to `/home/devya/projects/devya-sales-app/releases/<sha>`, points `current` at it
  and runs `docker compose up -d` there (stock `node:24.22.1-alpine`, release
  mounted read-only). A push does not deploy. Roll back by pointing `current` at an
  older release (command in the script header); the last 3 are kept.
- Config: `deploy/production.env`, all public config (API proxy target
  `https://api.devya-solutions.com`, cookie settings, cross-app URLs). It feeds the
  build (`NEXT_PUBLIC_*` are inlined) and is the container's runtime env.
- Browser calls stay on this app's origin: `/api/*` is rewritten to the backend, so
  the session cookie stays first-party.
- Merge gate: Jenkins `continuous-integration/jenkins/pr-head`, which runs
  `bash scripts/ci-local.sh` (lint, typecheck, build). Run the same script locally when
  Jenkins is down or queued.
