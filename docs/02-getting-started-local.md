# Getting Started Locally

This guide shows you how to set up the mobile app on your machine, connect it to Firebase, and run it in development.

## Prerequisites

You should have these tools installed:

| Tool | Why you need it |
|------|-----------------|
| Node.js 20+ | Runs the Expo app and installs dependencies |
| npm | Comes with Node.js and installs packages |
| Git | Clones the repository |
| Android Studio or a real Android device | Lets you test the app on Android |
| Xcode or a real iPhone | Needed for iOS testing on macOS |
| Firebase CLI | Needed if you want to run local emulators |

If you are on Windows, start with Android. iOS development requires macOS.

## Step 1: Install dependencies

From the `mobile_app` folder:

```bash
cd mobile_app
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is used because some Expo and React Native packages can be picky about peer dependency resolution.

## Step 2: Create your environment file

Copy `.env.example` to `.env` and fill in the real values from your Firebase project.

```bash
copy .env.example .env
```

On macOS or Linux you can use `cp .env.example .env`.

### Required environment variables

| Variable | What it is for |
|----------|----------------|
| `FIREBASE_API_KEY` | Firebase project API key |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `FIREBASE_DATABASE_URL` | Firebase Realtime Database URL if you use it |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `FIREBASE_APP_ID` | Firebase app ID |
| `GOOGLE_MAPS_API_KEY` | Needed for the map preview and opening locations in Google Maps |
| `USE_FUNCTIONS_EMULATOR` | Set to `true` for local function testing |
| `FUNCTIONS_EMULATOR_HOST` | Usually `localhost` |
| `FUNCTIONS_EMULATOR_PORT` | Usually `5001` |

### Optional environment variable

| Variable | What it is for |
|----------|----------------|
| `WEB_APP_HOST` | Host used in QR deep links such as `https://<host>/driver/checkin-confirm` |

## Step 3: Start Firebase emulators

The mobile app does not include its own Firebase emulator scripts. Start the emulators from the web app folder because that is where the Firebase CLI scripts live.

Important: the mobile app currently connects its callable Cloud Functions client to the emulator, but its direct Firebase Auth and Firestore calls still use the Firebase project configured in `.env`. That means the emulator is mainly for backend function testing unless you also update those clients to point at a local emulator.

### Functions and Firestore emulators

```bash
cd ..\Web App
npm run firebase:emulators:all
```

### Functions emulator only

```bash
cd ..\Web App
npm run firebase:emulators
```

Use the full emulator set when you want the web app and backend stack to run locally together, or when you want to test functions against local backend data.

## Step 4: Start the mobile app

Open a second terminal in `mobile_app` and run:

```bash
npm start
```

You can also start specific targets:

```bash
npm run android
npm run ios
npm run web
```

If you are on Windows, `npm run android` is usually the most practical option.

## What happens on startup

1. Expo loads `app/_layout.js`.
2. The app creates the safe area, query client, and auth provider.
3. `app/index.js` checks whether you are signed in.
4. Signed-in users are sent to their role home screen.
5. Unsigned users are sent to the login screen.

## Permissions you may need

| Permission | Why it is needed |
|------------|------------------|
| Camera | Required for QR scanning in `driver/scan-qr.js` |
| Network access | Needed to reach Firebase and Google Maps |

The camera permission text is already configured in `app.config.js`.

## QR and deep-link behavior

The driver can reach the check-in screen in more than one way:

- Scan the QR code with the in-app camera scanner.
- Paste a token or URL into the driver home screen.
- Open a link that points to `/driver/checkin-confirm`.

The app understands both raw tokens and URLs that contain a `token` query string.

The custom scheme is `smartparking://`. That is most reliable in a development build or installed app. If you are testing inside Expo Go and a deep link does not open automatically, use the in-app scanner or paste the token manually.

## How to tell if setup worked

Your setup is working when you can:

1. Open the app without red errors.
2. Reach the login screen.
3. Sign in or sign up with a Firebase account.
4. See the correct role dashboard.
5. Scan a QR code or open the driver check-in screen without crashes.

## Common setup mistakes

| Problem | Usually means |
|---------|---------------|
| App stays on the loading screen | Firebase config is missing or the profile fetch cannot finish |
| Login fails immediately | Wrong Firebase credentials or an invalid user account |
| QR scanner says permission denied | Camera permission was not granted |
| Map preview is blank | `GOOGLE_MAPS_API_KEY` is missing |
| Functions calls fail locally | The web app emulators are not running, or the host and port are wrong |
