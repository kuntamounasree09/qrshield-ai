# QRShield AI

QRShield AI is a cybersecurity checkpoint for QR codes. It decodes an uploaded
image, classifies the payload, checks observable security signals, calculates a
deterministic risk score, and gives a safety recommendation before the user
opens a destination.

The app never automatically navigates to decoded content. Uploaded images and
decoded payloads are treated as untrusted input.

## Stack

- React, Vite, TypeScript, React Router, Tailwind CSS
- Express and TypeScript API
- PostgreSQL with Drizzle ORM
- `sharp` and `jsqr` for server-side image normalization and QR decoding
- Optional HTTP adapters for AI explanation and threat intelligence

## Local setup

Requirements: Node.js 20+, pnpm 10+, and PostgreSQL 14+.

```bash
pnpm install
cp .env.example .env
# Edit DATABASE_URL and SESSION_SECRET in .env
pnpm --filter @workspace/db run push
pnpm run typecheck
pnpm test
```

Run the API and web app in separate terminals:

```bash
pnpm --filter @workspace/api-server run dev
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/qrshield-ai run dev
```

Open `http://localhost:5173`. The Vite proxy should route `/api` requests to
the API server when using the Replit workflow; in a standalone setup, configure
your local reverse proxy or serve the web app behind the same origin as the
Express API.

For a production frontend bundle:

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/qrshield-ai run build
```

## Core behavior

Risk levels are fixed and explainable:

| Score | Level |
| ---: | --- |
| 0–19 | Safe |
| 20–39 | Low |
| 40–59 | Medium |
| 60–79 | High |
| 80–100 | Critical |

Every deterministic score contribution is stored with a finding code, title,
detail, and contribution. Optional AI output is displayed as a separate
interpretation and cannot change the score. Optional provider failures are
reported as unavailable rather than replaced with fabricated results.

## Security boundaries

- Only PNG, JPEG, and WebP uploads are accepted, with a configurable size cap.
- QR destinations are never opened, rendered in an iframe, or executed.
- HTTP/HTTPS URL checks reject local, private, link-local, reserved, and
  loopback targets.
- Redirect inspection uses strict hop and timeout limits and validates each
  redirect target before contacting it.
- Session history is scoped by a signed, HttpOnly cookie.
- API responses contain no provider credentials.

## Useful commands

```bash
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/qrshield-ai run typecheck
pnpm test
pnpm --filter @workspace/api-server run build
```