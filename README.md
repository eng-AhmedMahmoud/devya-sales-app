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

Production runs on the Devya VPS (`72.61.81.59`) as the Docker container `devya-sales-app`
on `127.0.0.1:3172`, behind nginx (`/etc/nginx/sites-available/devya-sales-app`, TLS by
certbot) for `sales.devya-solutions.com`. The app left Vercel after the account pause of
2026-11-13; the Vercel project stays, unused.

- Config: `docker-compose.prod.yml` holds every value, all public config (API proxy
  target `https://api.devya-solutions.com`, cookie settings, cross-app URLs).
  `NEXT_PUBLIC_*` are inlined at build time, so a change needs a redeploy.
- Browser calls stay on this app's origin: `/api/*` is rewritten to the backend, so
  the session cookie stays first-party.
- Merge gate: Jenkins `continuous-integration/jenkins/pr-head`, which runs
  `bash scripts/ci-local.sh` (lint, typecheck, build). Run the same script locally when
  Jenkins is down.
- Deploy: `npm run deploy` (`scripts/deploy.sh`) after merging. It ships `origin/main`,
  builds the image on the VPS under the shared build lock, swaps the container and
  checks the public hosts. A push does not deploy. The previous tree stays at
  `/home/devya/projects/devya-sales-app.prev` for a rollback (command in the script header).
