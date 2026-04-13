# Mobile Setup Guide

## Install

```bash
cd mobile_app
npm install --legacy-peer-deps
```

## Required Environment Variables

Create `mobile_app/.env`:

```env
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_DATABASE_URL=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

GOOGLE_MAPS_API_KEY=
WEB_APP_HOST=localhost

USE_FUNCTIONS_EMULATOR=true
FUNCTIONS_EMULATOR_HOST=localhost
FUNCTIONS_EMULATOR_PORT=5001
```

## Run

```bash
npm start
```

## QR + Deep Links

- Native scheme: `smartparking://driver/checkin-confirm?token=<token>`
- HTTPS links handled for host in `WEB_APP_HOST` and path `/driver/checkin-confirm`

## Permissions

- Camera permission is required for in-app QR scanning.
- Android and iOS camera usage descriptions are configured in `app.config.js`.

## Notes

- Mobile app reuses the same Firebase project and Cloud Functions region (`us-central1`) as the web app.
- Install or update dependencies with `--legacy-peer-deps` to avoid peer dependency conflicts.
