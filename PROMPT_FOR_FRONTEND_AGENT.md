# Prompt For Frontend Agent

## Context Snapshot
- Backend branch `flowagain` now enforces the BA booking -> payment -> rental flow.
- Booking list endpoint defaults to **all bookings** unless `renterId` (or aliases) is provided.
- Temporary fake checkout endpoint (`POST /api/payments/checkout/test`) replaces real PayOS during integration.
- Rental and handover controllers update vehicle status automatically; FE screens must respect new status enums.

## Mission
1. Update Profile -> Bookings tab to call `GET /api/bookings?renterId=${currentUser._id}` and render the new status pipeline.
2. Wire payment flow using the fake checkout endpoint until PayOS keys are available.
3. Reflect booking/rental/vehicle status transitions across renter & staff dashboards.
4. Surface document verification state so renters know why booking is disabled.
5. Keep FE copy & prompts in sync with `FRONTEND_API_GUIDE.md` and Swagger.

## Start Here
1. Read `FRONTEND_API_GUIDE.md` (in repo root) for endpoints, status tables, and E2E test plan.
2. Open Swagger at `http://localhost:4000/docs` for request/response schemas.
3. Verify seeds by calling:
   - `POST /api/auth/login` (use sample admin/staff credentials from vault).
   - `GET /api/users/me` (confirm `status`).
   - `GET /api/brands/by-station?stationId=<ObjectId>` (confirm availability counts).

## Implementation Playbook
### A. Profile area
- Gate booking UI behind `user.status === "verified"`.
- Replace any legacy calls (e.g. `/api/bookings`) with `GET /api/bookings?renterId=...`.
- Render `statusHistory` as a stepper: CREATED, PENDING_APPROVAL, APPROVED, WAITING_PAYMENT, PAID, SUCCESS.
- Show payment call-to-action when status = `WAITING_PAYMENT`.

### B. Payment flow (temporary)
- On pay button -> POST `/api/payments/checkout/test` with `{ bookingId, method }`.
- After success: refetch booking & rental list; expect booking `PAID` and rental `READY_FOR_PICKUP`.
- Display payment details (method, txnRef) from response `data`.

### C. Staff dashboard
- Booking table: expose filters for `status`, `email`, `phoneNumber`, `bookingCode`.
- Add actions:
  1. Approve -> send `PUT /api/bookings/:id/status` with `{ status: "APPROVED", vehicleId }`.
  2. Move to payment -> `{ status: "WAITING_PAYMENT" }`.
  3. Cancel -> `PUT /api/bookings/:id/cancel`.
- Payment tab: allow manual capture via `POST /api/payments` (cash) with optional `skipBookingUpdate`.
- Rental tab: fetch `GET /api/rentals` with filters, allow status push (`READY_FOR_PICKUP` / `IN_PROGRESS` / `RETURNED`).

### D. Handovers
- Pickup form -> multipart `POST /api/handovers` (action `pickup`). Expect rental to switch to `IN_PROGRESS`.
- Return form -> `POST /api/handovers` (action `return`). Expect rental -> `RETURNED` and vehicle -> `available`.
- Timeline view -> `GET /api/handovers?rentalId=<id>`.

## QA Checklist (Frontend)
- [ ] Renter with `verified` status can create booking; others see clear error banner.
- [ ] Profile Bookings tab only shows the current renter history.
- [ ] Payment button triggers fake checkout and updates UI without reload.
- [ ] Rental card appears after payment with `READY_FOR_PICKUP` status.
- [ ] Staff tables respect new filters and show uppercase statuses.
- [ ] Cancelling a booking frees the reserved vehicle and removes timer.
- [ ] Handover uploads succeed and gallery renders returned photos.

## Communication Notes
- Document any FE-only assumptions in the shared Confluence page.
- When PayOS is ready, swap fake checkout with `/api/payos/checkout`; no other FE change needed.
- Coordinate with backend before changing status strings—enums are centralized in `src/constants/statusCodes.js`.

Use this prompt as the source of truth while implementing or debugging the FE side.

