# Message For Frontend Team

## TL;DR
- Backend has been updated to match the BA booking -> payment -> rental flow.
- `GET /api/bookings` now expects a renter filter; profile screens must call `GET /api/bookings?renterId=<ObjectId>`.
- Use `POST /api/payments/checkout/test` to simulate payments while PayOS credentials are not ready.
- Rental and handover APIs now drive vehicle status automatically—surface the new status values in UI.

## Immediate To-Do
1. Refresh API helper layer to accept `renterId`, `status`, `email`, `phoneNumber` filters when fetching bookings.
2. Update booking detail screen to show `statusHistory`, `pricing` (base/deposit/surcharge/total), and linked payment information.
3. Add fake checkout button that posts `{ bookingId, method }` to `/api/payments/checkout/test` and refetches booking + rental data on success.
4. Expose document verification state (pending/approved/rejected) in Profile so users know why booking actions are disabled.
5. Sync copy and flows with `FRONTEND_API_GUIDE.md` + `PROMPT_FOR_FRONTEND_AGENT.md`.

## Reference
- Swagger: `http://localhost:4000/docs`
- Status enums live in `src/constants/statusCodes.js`
- Background jobs: `src/services/backgroundJobs.js` (for understanding automatic transitions)

Ping the backend team before deploying if you detect mismatched status names or missing filters.

