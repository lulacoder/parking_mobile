# Mobile App Docs

This folder explains how the mobile app works and how to run it on your own machine.

The docs are written for beginners. If you only want the shortest path to a working app, read the files in this order:

1. [01-overview.md](01-overview.md)
2. [02-getting-started-local.md](02-getting-started-local.md)
3. [03-auth-and-navigation.md](03-auth-and-navigation.md)
4. [04-role-dashboards.md](04-role-dashboards.md)
5. [05-backend-and-emulators.md](05-backend-and-emulators.md)
6. [06-troubleshooting.md](06-troubleshooting.md)

## Doc map

| File | What it covers |
|------|----------------|
| [01-overview.md](01-overview.md) | What the app is, which roles it supports, and how the app is structured |
| [02-getting-started-local.md](02-getting-started-local.md) | Installation, environment variables, emulators, and how to launch the app |
| [03-auth-and-navigation.md](03-auth-and-navigation.md) | Login, signup, role lookup, redirects, and drawer navigation |
| [04-role-dashboards.md](04-role-dashboards.md) | What drivers, operators, owners, and admins can do in the app |
| [05-backend-and-emulators.md](05-backend-and-emulators.md) | Firebase setup, Firestore collections, Cloud Functions, and QR links |
| [06-troubleshooting.md](06-troubleshooting.md) | Common setup and runtime problems, plus how to fix them |

## Extra guides

These guides are useful once you understand the basics:

- [../ACCESSIBILITY_GUIDE.md](../ACCESSIBILITY_GUIDE.md)
- [../PLATFORM_GUIDE.md](../PLATFORM_GUIDE.md)
- [../FUNCTIONS_INTEGRATION_DEMO.md](../FUNCTIONS_INTEGRATION_DEMO.md)
- [../MOBILE_SETUP.md](../MOBILE_SETUP.md)

## How to read the app

The mobile app is built with Expo Router.

- Files in `app/` define the screens and routes.
- Files in `src/` contain shared logic, Firebase setup, hooks, and UI components.
- `app/_layout.js` wraps the app in providers such as Auth and React Query.
- `app/index.js` decides whether a user should see login or their role dashboard.

If you are trying to understand a screen, look at the matching route file first, then read the shared code in `src/`.
