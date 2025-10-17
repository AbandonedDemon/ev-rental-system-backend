# Backend TODOs for EV Rental Workflow

## New & Updated Endpoints
- `POST /api/users` must accept `{ fullName, email, phone?, password }` and return the created user with `_id`, `status` (default `pending_documents`), and timestamps.
- `POST /api/user-documents` now receives multipart form data with fields `user`, `documentType`, `identityNumber`, `drivingLicenseNumber`, and three images (`frontImage`, `backImage`, `drivingLicenseImage`). Respond with the persisted document including `status` and `verifiedBy`.
- `GET /api/user-documents` should support `?userId=` to fetch the latest document record for a renter.
- `PUT /api/vehicles/:id` must allow updating at least the `status` field (`available | rented | maintenance`) and return the updated vehicle.
- `POST /api/handovers` has to accept `{ rental, stationId, type: "pickup" | "return", odoReading?, batteryPercent?, notes?, photos[] }`, create the handover record, and update the related rental state.
- `GET /api/handovers` should allow filtering by `rentalId` so the dashboard can refresh a single rental timeline.

## Data Contracts & Statuses
- Extend user status enum to include `pending_documents`, `documents_submitted`, and `verified`. Frontend unlocks booking only when `status === "verified"`.
- Handovers should update rental status: pickup -> `ongoing`, return -> `completed`, and surface `odoStart/End`, `batteryPercent`, `conditionNotes`.
- Ensure `GET /api/rentals` and `GET /api/bookings` return renter, vehicle, and station relations (used across profile and dashboard).

## What Frontend Handles
- Registration wizard collects renter data, uploads verification images, and blocks booking until the document status is `verified`.
- Staff dashboard reads vehicles/bookings/rentals, triggers handover creation, and patches vehicle statuses.
- Booking form enforces verification before calling `POST /api/bookings`.
- Payment flow remains stubbed (per instructions) and was not changed.

👉 Once backend implements the above, let me know if payload shapes differ so I can align the frontend adapters quickly.
