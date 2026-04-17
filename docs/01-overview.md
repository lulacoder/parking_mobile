# Overview

## What this app is

The mobile app is the handheld version of the Smart Parking system. It gives each user a view that matches their role and hides screens that do not apply to them.

The app is built with:

- Expo
- React Native
- Expo Router
- Firebase Authentication
- Firestore
- Firebase Cloud Functions

The mobile app talks to the same backend as the web app. That means the same parking data, users, bookings, sessions, and payment requests are shared across both apps.

## The four roles

| Role | What they usually do |
|------|----------------------|
| Driver | Reserve parking, scan QR codes, confirm check-ins, submit payment details |
| Operator | Generate QR codes, check vehicles in, approve check-in requests, confirm payments |
| Owner | View analytics, manage operators, update payment destination details |
| Admin | Manage owners, parkings, and operator assignments |

## High-level app flow

When the app starts, it does a small number of checks in order:

1. Firebase auth checks whether the user is signed in.
2. If the user is signed in, the app loads the user profile from Firestore.
3. The profile determines the user's role.
4. The app redirects the user to the correct home screen for that role.
5. The drawer menu only shows screens that match the user's role.

This is handled mostly in `app/index.js`, `src/contexts/AuthContext.js`, and `app/(app)/_layout.js`.

## Project structure

| Folder | Purpose |
|--------|---------|
| `app/` | Route files and screen layouts |
| `src/components/` | Reusable UI pieces like buttons, inputs, and the drawer |
| `src/contexts/` | Shared app state, especially authentication |
| `src/config/` | Firebase initialization |
| `src/hooks/` | Shared React hooks such as protected routes |
| `src/services/` | Data helpers and query hooks |
| `src/utils/` | Role helpers, platform helpers, error handling, and callable function wrappers |
| `assets/` | App icons, splash images, and other static assets |

## Main screens

### Authentication screens

- `app/(auth)/login.js`
- `app/(auth)/signup.js`

These screens let users sign in or create a new account.

### Shared app shell

- `app/_layout.js`
- `app/index.js`
- `app/(app)/_layout.js`

These files set up providers, check auth state, and route the user into the correct role area.

### Role screens

- `app/(app)/driver/index.js`
- `app/(app)/driver/scan-qr.js`
- `app/(app)/driver/checkin-confirm.js`
- `app/(app)/operator/index.js`
- `app/(app)/owner/index.js`
- `app/(app)/admin/index.js`

## Beginner mental model

If you are trying to understand the app quickly, keep this in mind:

- The UI decides what to show.
- Firebase decides who the user is.
- Firestore stores the user's role and parking data.
- Cloud Functions do the sensitive work such as bookings, QR generation, and payment confirmation.

That division matters because it keeps the mobile app simple. The app mostly displays data and sends requests to trusted backend logic.

## Key design choices

### Expo Router

The app uses file-based routing instead of manually registering screens. That means the file path is the route path.

### Firebase compat SDK

The app uses the Firebase compat packages so the code can call Firebase in the familiar namespaced style:

```javascript
firestore.collection('users').doc(uid).get();
auth.signInWithEmailAndPassword(email, password);
```

### Role-first navigation

The app always asks one question first: what role is this user?

That answer decides:

- which screen they land on after sign-in,
- which drawer items they can see,
- which actions they can take,
- and which Cloud Functions they should call.
