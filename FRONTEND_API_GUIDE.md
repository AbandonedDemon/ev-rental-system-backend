# Frontend API Guide - EV Rental System

## Context
- Backend branch `flowagain` follows the BA booking/payment flow.
- Seed data: 50 vehicles, 10 brands, 4 stations, sample renters + staff accounts.
- Swagger UI: `http://localhost:4000/docs` (exports the OpenAPI described in `src/config/swagger.js`).
- All IDs are Mongo ObjectId strings; never reuse cached IDs from previous seeds.

## Lifecycle Overview
1. **Register & verify** – User registers (`POST /api/auth/register`), uploads documents, staff approves -> `user.status = verified`.
2. **Booking request** – Renter submits `POST /api/bookings` -> status pipeline `CREATED -> PENDING_APPROVAL -> APPROVED -> WAITING_PAYMENT`.
3. **Vehicle hold** – When a vehicle is attached, reservationService keeps it `reserved` for 30 minutes (background job releases expired holds).
4. **Payment** – Payment success (`SUCCESS`) promotes booking to `PAID` then `SUCCESS` (either via fake checkout or real PayOS later).
5. **Rental execution** – Paid booking spawns a rental (`READY_FOR_PICKUP -> IN_PROGRESS -> LATE/RETURNED/DAMAGED -> COMPLETED/CANCELLED`).
6. **Handovers & closure** – Staff capture pickup/return inspections with `/api/handovers`; vehicles flip back to `available` when rental ends.

## Status Reference
### User.status
| Value | Meaning |
| --- | --- |
| `pending_documents` | Newly registered renter, must upload documents. |
| `documents_submitted` | Documents uploaded, pending staff review. |
| `verified` | Approved renter – allowed to create bookings. |
| `active` / `inactive` / `suspended` | Operational flags for staff/admin. |

### Booking.status
| Value | Meaning |
| --- | --- |
| `CREATED` | Auto state when payload received (internal use). |
| `PENDING_APPROVAL` | Awaiting staff triage or auto-approval rules. |
| `APPROVED` | Vehicle assigned; reservation timer running. |
| `REJECTED` | Staff declined the request. |
| `WAITING_PAYMENT` | Renter must pay before deadline. |
| `PAID` | Payment captured; system will spawn rental. |
| `PAYMENT_FAILED` | Gateway failure or timeout. |
| `CANCELLED` | Cancelled manually or auto-expired. |
| `SUCCESS` | Reservation fulfilled, rental created. |

### Payment.status
| Value | Meaning |
| --- | --- |
| `PENDING` | Awaiting confirmation (manual cash, gateway pending). |
| `SUCCESS` | Funds captured; booking syncs to `PAID`. |
| `FAILED` | Payment rejected/voided; booking downgraded. |
| `REFUNDED` | Post-rental refund completed. |

### Rental.status
| Value | Meaning |
| --- | --- |
| `CREATED` | Placeholder rental created from booking. |
| `READY_FOR_PICKUP` | Vehicle prepared; waiting for renter arrival. |
| `IN_PROGRESS` | Renter has picked up vehicle. |
| `LATE` | Return deadline exceeded (auto-flagged job). |
| `RETURNED` | Vehicle handed back; inspection pending. |
| `DAMAGED` | Return detected issues; maintenance flow triggered. |
| `COMPLETED` | Rental closed cleanly. |
| `CANCELLED` | Rental voided before pickup. |

## High-Level API Map
| Domain | Endpoint | Notes |
| --- | --- | --- |
| Auth | `POST /api/auth/login`, `POST /api/auth/register` | Returns JWT + user payload. |
| Profile | `GET /api/users/me` | Requires `Authorization` header. Includes latest documents. |
| User documents | `POST /api/user-documents` (multipart), `GET /api/user-documents?userId=...`, `PUT /api/user-documents/:id` | Staff updates `verifyStatus` (`pending`/`approved`/`rejected`). |
| Bookings | `POST /api/bookings`, `GET /api/bookings`, `GET /api/bookings/:id`, `PUT /api/bookings/:id/status`, `PUT /api/bookings/:id/cancel` | Main renter + staff flow. |
| Payments | `POST /api/payments/checkout/test`, `POST /api/payments`, `PUT /api/payments/:id`, `GET /api/payments` | Fake checkout is the default for now. |
| Rentals | `GET /api/rentals`, `GET /api/rentals/:id`, `PUT /api/rentals/:id` | Staff may create/adjust rentals manually if needed. |
| Handovers | `POST /api/handovers`, `GET /api/handovers?rentalId=...` | Save pickup/return evidence. |
| Vehicles & brands | `GET /api/brands/by-station?stationId=...`, `GET /api/vehicles?stationId=...` | Use to build selection UI. |

## Detailed Flow Notes
### 1. Authentication & Profile
- `POST /api/auth/login` -> `{ token, user }`. Persist token for subsequent requests.
- `GET /api/users/me` -> includes `status`, latest `userDocument`, and role. Block booking UI unless `status === "verified"`.

### 2. User Document Workflow
- `POST /api/user-documents`
  - Multipart fields: `docType`, `frontImage`, `backImage`, optional metadata.
  - Response contains `verifyStatus` (`pending` by default).
- `GET /api/user-documents?userId=<ObjectId>`
  - Staff dashboard uses this to display renter history.
- `PUT /api/user-documents/:id`
  - Staff sets `verifyStatus = "approved"` or `"rejected"`, plus notes.
  - When staff approves the latest document, backend promotes user to `verified`.

### 3. Booking Lifecycle
- `POST /api/bookings`
  - Required fields: `renterName`, `phoneNumber`, `email`, `renterId`, `brand`, `pickupStation`, `pickupTimeExpected`, `rentalDays`, `paymentMethod`, `agreedToPaymentTerms`, `agreedToDataSharing`.
  - Backend validates renter exists and `user.status === "verified"`.
  - `vehicle` optional; staff can assign later.
  - Response includes `statusHistory`, `pricing`, and `reservation` metadata.
- `GET /api/bookings?renterId=<ObjectId>`
  - **Frontend Profile -> Bookings Tab must pass `renterId`.**
  - Without filters the endpoint returns the entire system list (for staff dashboards).
  - Additional filters: `status`, `email`, `phoneNumber`, `bookingCode`, `pickupStation`.
- `PUT /api/bookings/:id/status`
  - Staff-only. Body `{ status, vehicleId?, statusNote? }`.
  - Validation rules enforce linear flow (cannot pay before approval, cannot approve without available vehicle, etc.).
- `PUT /api/bookings/:id/cancel`
  - Cancels and frees any reserved vehicle. Use when renter withdraws pre-payment.

### 4. Payment Integration (temporary fake checkout)
- `POST /api/payments/checkout/test`
  - Body `{ "bookingId": "...", "method": "wallet" }`.
  - Preconditions: booking status `WAITING_PAYMENT`.
  - Backend creates a `SUCCESS` payment, updates booking to `PAID`, and queues rental creation.
- `POST /api/payments`
  - Manual capture for staff (cash at counter). Important fields:
    - `booking` (required)
    - `method` (`cash` | `card` | `wallet` | `transfer`)
    - `status` (defaults to `SUCCESS` if omitted)
    - Optional `autoComplete` (true => converts `PENDING` to `SUCCESS`).
    - Optional `skipBookingUpdate` (true => do **not** change booking status).
- `PUT /api/payments/:id`
  - Update status, attach rental reference, or adjust surcharge. Keep `skipBookingUpdate` in mind.
- `GET /api/payments?booking=<id>`
  - Useful for payment history screens.

### 5. Rental Management
- Rentals usually auto-create after payment. Use APIs for dashboards:
  - `GET /api/rentals?renterId=<id>` or `GET /api/rentals?booking=<id>`.
  - `PUT /api/rentals/:id`
    - Supported transitions documented in Swagger. Example payloads:
      - `{ "status": "READY_FOR_PICKUP" }`
      - `{ "status": "IN_PROGRESS", "pickupTime": "2025-11-09T02:00:00.000Z" }`
      - `{ "status": "RETURNED", "returnStation": "...", "returnTime": "..." }`
    - Vehicle status sync happens automatically (reserved -> rented -> available/maintenance).

### 6. Handovers
- `POST /api/handovers`
  - Multipart: `rental`, `vehicle`, `action` (`pickup` or `return`), `staff`, `notes`, `photos` array.
  - Controller updates rental & vehicle states according to action (e.g., pickup -> `IN_PROGRESS`).
- `GET /api/handovers?rentalId=<id>`
  - Use to render timeline or gallery for the rental detail screen.

### 7. Background Jobs & Automation
- `startBackgroundJobs()` schedules:
  - **Reservation timeout** every 5 minutes: bookings stuck in `APPROVED/WAITING_PAYMENT` past hold window -> booking `CANCELLED`, vehicle `available`.
  - **Auto rental creation**: if booking `PAID` and rental missing, system builds `READY_FOR_PICKUP` rental.
  - **Late rental check** hourly: rentals past planned return -> `LATE`, surcharge placeholder applied.
- Frontend should poll booking/rental endpoints when timers expire to pick up state changes.

## Frontend Checklist
- Always include `Authorization: Bearer <token>` once renter logged in.
- Fetch station/brand lists fresh; never hard-code ObjectId.
- When rendering profile booking history, call `GET /api/bookings?renterId=${currentUser._id}` and map `statusHistory` for timeline UI.
- After fake checkout, refetch booking and `GET /api/rentals?booking=<id>` to show the new rental card.
- Respect uppercase status values (`PAID`, `SUCCESS`, etc.) in FE state machines.
- Staff dashboards should offer filters for `status`, `email`, and `phoneNumber` using query params already supported by backend.

## End-to-End Test Script (Manual)
1. Login as verified renter (or register + upload documents + have staff approve).
2. `POST /api/bookings` with renter + station + brand; note `_id`.
3. Staff approves:
   - `PUT /api/bookings/:id/status` `{ "status": "APPROVED", "vehicleId": "..." }`
   - `PUT /api/bookings/:id/status` `{ "status": "WAITING_PAYMENT" }`
4. Simulate payment:
   - `POST /api/payments/checkout/test` `{ "bookingId": "..." }`
5. Verify results:
   - `GET /api/bookings/:id` -> status `PAID` or `SUCCESS`.
   - `GET /api/rentals?booking=<id>` -> new rental `READY_FOR_PICKUP`.
6. Staff pickup handover:
   - `POST /api/handovers` (action `pickup`) -> rental becomes `IN_PROGRESS`.
7. Staff return handover:
   - `POST /api/handovers` (action `return`) -> rental `RETURNED`, vehicle available again.

## Useful Tips
- `GET /api/brands/by-station?stationId=<id>` exposes availability counters for the booking wizard.
- Booking responses include `pricing` ({ baseAmount, depositAmount, surchargeAmount, totalAmount }). Show these values consistently across FE screens.
- Payment responses attach populated `booking` and `rental` documents; leverage them to avoid duplicate fetches when updating UI state.
- Cron jobs run server-side; FE should handle eventual consistency (optimistic UI + periodic refetch).

For endpoint-by-endpoint schemas, rely on Swagger (`http://localhost:4000/docs`). This guide focuses on how the FE should stitch them together.

