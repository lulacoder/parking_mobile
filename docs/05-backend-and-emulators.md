# Backend, Firebase, and Emulators

This guide explains the backend pieces the mobile app talks to and how those pieces behave in development.

## The important idea

The mobile app is mostly a front end.

It reads some data directly from Firestore, but the sensitive actions go through Cloud Functions. That means bookings, QR generation, check-in approval, and payment confirmation are handled by trusted backend code instead of being done directly from the device.

## Firebase setup in the app

The Firebase client is initialized in `src/config/firebase.js`.

It reads its values from `Constants.expoConfig.extra`, which is populated by `app.config.js`.

### Main values

| Value | Purpose |
|-------|---------|
| Firebase API key | Connects the mobile app to the correct project |
| Auth domain | Firebase auth sign-in configuration |
| Project ID | The Firebase project name |
| Storage bucket | Firebase storage configuration |
| Messaging sender ID | Firebase messaging configuration |
| App ID | Firebase app identifier |
| Google Maps API key | Enables map-related behavior |
| `USE_FUNCTIONS_EMULATOR` | Controls whether callable functions use the emulator |
| `FUNCTIONS_EMULATOR_HOST` | Hostname for the emulator |
| `FUNCTIONS_EMULATOR_PORT` | Port for the emulator |

## What the mobile app connects to

| Service | How the app uses it |
|---------|---------------------|
| Firebase Auth | Signs users in and out |
| Firestore | Reads user profiles, parkings, bookings, sessions, and requests |
| Cloud Functions | Handles bookings, QR creation, payments, analytics, and management actions |

The mobile app currently connects the callable Cloud Functions client to the emulator when `USE_FUNCTIONS_EMULATOR=true`.

Direct Firebase Auth and Firestore calls still use the Firebase project configured in `.env`.

## Cloud Functions wrapper

`src/utils/functions.js` wraps every callable function in a helper called `callFunction(...)`.

That wrapper does a few useful things:

- It calls the named Cloud Function with the provided data.
- It maps common Firebase function errors to readable messages.
- If the emulator is timing out or unavailable, it can try the production function client as a fallback.

That fallback is useful during development when the emulator is flaky or not running.

## Functions by role

### Driver functions

| Function | What it does |
|----------|--------------|
| `createBooking` | Creates a parking reservation |
| `submitManualPayment` | Submits a payment request for operator review |
| `driverCheckOutVehicle` | Driver-side checkout helper |
| `listPendingPaymentsForDriver` | Lists the driver's pending payment confirmations |
| `confirmCheckInFromQr` | Sends a QR token plus plate number for check-in |
| `getParkingPaymentDetails` | Returns the payment destination for a parking |

### Operator functions

| Function | What it does |
|----------|--------------|
| `checkInVehicle` | Checks a vehicle in manually |
| `listPendingPaymentsForOperator` | Lists payment requests for a parking |
| `getPendingPaymentForSession` | Gets the pending payment for one session |
| `confirmManualPayment` | Confirms a payment request |
| `rejectManualPayment` | Rejects a payment request |
| `createParkingCheckInToken` | Creates a QR token and deep link |
| `approveCheckInRequest` | Approves a QR-based check-in request |
| `rejectCheckInRequest` | Rejects a QR-based check-in request |

### Owner functions

| Function | What it does |
|----------|--------------|
| `getOwnerAnalytics` | Loads owner dashboard analytics |
| `ownerCreateOperator` | Creates a new operator account |
| `ownerUpdateOperatorAssignments` | Changes which parkings an operator can access |
| `ownerSetOperatorStatus` | Activates or deactivates an operator |
| `ownerUpdatePaymentDetails` | Saves payout details |

### Admin functions

| Function | What it does |
|----------|--------------|
| `getAdminAnalytics` | Loads platform-wide analytics |
| `createOwnerAccount` | Creates a new owner account |
| `upsertParking` | Creates or updates a parking record |
| `assignOperatorToParking` | Links an operator to a parking |

## Firestore collections the mobile app uses

| Collection | What it is for |
|------------|----------------|
| `users` | Auth profile, role, status, and assignments |
| `parkings` | Parking locations, capacity, pricing, and status |
| `bookings` | Reservations created by drivers |
| `sessions` | Active and completed parking sessions |
| `checkInRequests` | Pending QR-based check-in approvals |
| `paymentRequests` | Pending manual payment approvals |
| `owners` | Owner account data used in admin and owner analytics |

Some of the role dashboards also depend on live Firestore listeners so the data feels current without a manual refresh.

## QR and deep links

The operator creates a token and a deep link.

The driver then uses the token in one of three ways:

1. Scan the QR code with the camera scanner.
2. Paste the token into the driver home screen.
3. Open the deep link in a browser or supported app.

The driver check-in screen accepts both raw tokens and URLs that contain a `token` query string.

## Emulator behavior

When the emulator is enabled, the app tries to connect the functions client to the emulator host and port from `.env`.

On Android, the app can automatically resolve `localhost` to `10.0.2.2` when needed so the emulator is reachable from the device or emulator.

If the emulator is not reachable, the wrapper may fall back to the production function client so the app can still keep moving during development.

## Why the backend is split this way

This split keeps the mobile app easier to reason about:

- Firestore is used for reading and listening to state.
- Cloud Functions are used for business actions that should be validated on the server.
- The app stays thin and focused on the user interface.
