# Role Dashboards and User Flows

This guide explains what each role sees in the mobile app and what they can do from that screen.

## At a glance

| Role | Main screen | Main job |
|------|-------------|----------|
| Driver | `app/(app)/driver/index.js` | Reserve parking, scan QR codes, confirm check-ins, and submit payment details |
| Operator | `app/(app)/operator/index.js` | Generate QR codes, check vehicles in, and review payment requests |
| Owner | `app/(app)/owner/index.js` | Review analytics, manage operators, and update payment details |
| Admin | `app/(app)/admin/index.js` | Manage owners, parkings, and operator assignments |

Each screen uses `useProtectedRoute([...])` so the user only sees the dashboard that matches their role.

## Driver dashboard

The driver screen is the busiest dashboard in the app because it combines several everyday tasks.

### Main sections

#### QR Check-In

This section gives the driver three ways to reach the check-in flow:

- Open the QR scanner in `app/(app)/driver/scan-qr.js`.
- Paste a token or URL into the check-in field.
- Go straight to the check-in confirmation screen.

The scanner uses `expo-camera`. It reads QR codes and tries to extract a `token` value from the encoded URL. If the QR data is just a token, the screen still works.

#### Choose Parking on Map

The driver home screen loads active parkings from Firestore and shows them as selectable chips.

What a beginner should know:

- The list only includes parkings whose status is `active`.
- Picking a parking changes the selected map/location preview.
- If a parking has coordinates, the driver can open it in Google Maps.
- If `GOOGLE_MAPS_API_KEY` is missing, the app shows a warning.

#### Reserve Slot

The driver can reserve a slot by entering a plate number and tapping Reserve.

The app normalizes the plate to uppercase before sending it to `driverFunctions.createBooking(...)`.

#### My Active Bookings

This section lists active or reserved bookings for the signed-in driver.

It helps the driver confirm:

- the plate number,
- the booking status,
- and when the reservation expires.

#### My Active Sessions

This section shows live parking sessions for the driver.

Each session can lead to a manual payment submission. The driver can open a modal, pick a payment method, and submit a reference code if needed.

#### Pending Payment Confirmations

This section shows payment requests that are already waiting for operator review.

If a request is pending, the driver cannot submit another payment for the same session until the existing request is resolved.

### Check-in confirmation screen

`app/(app)/driver/checkin-confirm.js` is the screen that receives the QR token.

It does three things:

1. Reads the token from the route query string.
2. Lets the driver enter a plate number.
3. Submits `confirmCheckInFromQr(token, plateNumber)` to the backend.

After submission, the screen watches the `checkInRequests` Firestore document so the driver can see whether the request is pending, approved, rejected, or expired.

### Driver flow in simple terms

1. Pick a parking or scan a QR code.
2. Enter a plate number.
3. Submit the request.
4. Wait for approval if the workflow requires it.
5. When the session is active, submit payment from the active session card.

## Operator dashboard

The operator screen is designed for daily parking operations.

### Assigned parking

The operator profile includes `assignedParkingIds`, which are loaded from Firestore.

That assignment decides:

- which parkings the operator can switch between,
- which QR codes they can generate,
- and which pending requests they can see.

### Driver check-in QR

The operator can generate a QR token using `operatorFunctions.createParkingCheckInToken(...)`.

The screen shows:

- the QR code itself,
- the token ID,
- the expiration time,
- and the deep link string.

The QR refreshes automatically on a timer so the operator always has a current token.

### Manual vehicle check-in

The operator can type a plate number and check a vehicle in directly.

There is also a walk-in toggle:

- enabled means the operator can create a session even when there is no booking,
- disabled means the operator expects a booked vehicle.

### Pending QR confirmations

This section lists pending check-in requests that still need approval.

For each request, the operator can:

- approve it,
- or reject it.

Approving usually starts a session and updates the parking counters. Rejecting clears the request path so the driver can try again with a fresh QR code.

### Active sessions and pending payments

The operator sees active sessions for the selected parking and can settle payment requests from there.

That part of the screen lets the operator:

- confirm a manual payment,
- reject a payment that cannot be verified,
- and see the payment method, amount, and reference code.

## Owner dashboard

The owner dashboard is focused on business visibility and operator management.

### Analytics range

The owner can switch between short and longer time ranges, such as 7 days or 30 days.

The dashboard uses React Query hooks from `src/services/dashboardHooks.js` to load and cache the data.

### Summary cards and charts

The owner dashboard shows:

- gross revenue,
- owner revenue,
- admin commission,
- completed sessions,
- pending payment requests,
- revenue trend,
- and payment method breakdown.

### Payment destination details

The owner can update the phone number or bank account used for receiving payments.

This is important because the driver and operator payment screens may show these details when a payment request is being prepared.

### Create operator

Owners can create operator accounts from the mobile app.

The form collects:

- full name,
- email,
- password,
- phone,
- and assigned parkings.

### Owned parkings and operators

At the bottom of the screen, the owner can review:

- parkings linked to their account,
- the operators linked to those parkings,
- and the current assignment state.

Owners can also edit operator parking assignments and activate or deactivate an operator.

## Admin dashboard

The admin dashboard is the highest-level management screen in the app.

### Analytics range and summary

Like the owner dashboard, the admin can change the date range and review summary metrics.

Admins focus on the platform-wide view:

- total gross revenue,
- admin commission,
- owner revenue,
- confirmed payments,
- and pending payment requests.

### Create owner account

Admins can create owner accounts directly from the app.

This is usually the first step before creating parkings or assigning operators.

### Create or update parking

The parking form lets the admin:

- create a parking,
- update an existing parking,
- set the owner,
- set capacity values,
- set pricing,
- and store the parking location.

### Assign operator to parking

The admin can attach or remove an operator from a parking.

This is what controls which parking records the operator can see.

### Current owners, operators, and parkings

The final lists on the screen make it easy to confirm that the system data is connected correctly.

## A simple way to remember the roles

- Drivers use the app to move cars through parking.
- Operators use the app to handle live check-ins and payments.
- Owners use the app to manage their business performance.
- Admins use the app to manage the whole platform.
