# Smart Parking Mobile App

This folder contains the Expo and React Native mobile app for the Smart Parking system.

If you are new to the project, start here:

1. Read [docs/README.md](docs/README.md) for the full doc index.
2. Follow [docs/02-getting-started-local.md](docs/02-getting-started-local.md) to install and run the app on your machine.
3. Read [docs/03-auth-and-navigation.md](docs/03-auth-and-navigation.md) to understand login, role redirects, and navigation.

## What the mobile app does

The mobile app is the on-the-go version of the parking system. It lets different users do different jobs:

- Drivers can reserve parking, scan QR codes, and confirm check-ins.
- Operators can generate QR codes, check vehicles in, and review payment requests.
- Owners can view analytics, manage operators, and update payment details.
- Admins can manage owners, parkings, and operator assignments.

The app uses the same Firebase backend as the web app. In development, it can connect to the same local Firebase emulators that power the web app.

## Quick start

```bash
cd mobile_app
npm install --legacy-peer-deps
copy .env.example .env
npm start
```

If you want the local backend used by the mobile app, start the Firebase emulators from the web app folder first:

```bash
cd ..\Web App
npm run firebase:emulators:all
```

Then return to `mobile_app` and run `npm start`.

## Useful links

- [Mobile docs home](docs/README.md)
- [Setup guide](docs/02-getting-started-local.md)
- [How auth and routing work](docs/03-auth-and-navigation.md)
- [Role dashboards and user flows](docs/04-role-dashboards.md)
- [Backend, Firebase, and emulators](docs/05-backend-and-emulators.md)
- [Troubleshooting](docs/06-troubleshooting.md)
- [Accessibility guide](ACCESSIBILITY_GUIDE.md)
- [Platform guide](PLATFORM_GUIDE.md)
- [Functions demo](FUNCTIONS_INTEGRATION_DEMO.md)
