# EV Rental System API Guide

This guide summarizes the REST resources that are currently available in the EV Rental System backend, together with the default seed data that is loaded on server start. Use it as a quick reference when exploring the API with Postman or any HTTP client.

## Prerequisites & Setup

1. Ensure a MongoDB instance is running (e.g. locally on `mongodb://127.0.0.1:27017/ev-rental-system`).
2. Install dependencies: `npm install`
3. Start the development server: `npm run start`
4. Explore the interactive API documentation at `http://localhost:4000/docs` (or `<your-host>/docs` in other environments). The raw OpenAPI document is available at `/swagger.json` if you prefer importing into tools such as Postman.

On boot the application will connect to MongoDB, ensure the collections exist, and seed default documents so every entity has data you can query immediately.

## Available Resources & Routes

All endpoints are prefixed with `/api`. Each resource exposes the standard CRUD verbs (`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`).

| Resource | Route Prefix | Populated References |
| --- | --- | --- |
| Users | `/api/users` | – |
| User documents | `/api/userDocs` | `user`, `verifiedBy` |
| Stations | `/api/stations` | – |
| Vehicles | `/api/vehicles` | – |
| Bookings | `/api/booking` | `renter`, `pickupStation`, `vehicle` |
| Rentals | `/api/rentals` | `booking`, `renter`, `vehicle`, `pickupStation`, `returnStation` |
| Handovers | `/api/handovers` | `rental`, `vehicle`, `staff` |
| Payments | `/api/payments` | `rental` |

## Seeded Sample Data

The following records are inserted (or updated) automatically to make testing easier:

- **Users**: renter `alice.nguyen@example.com`, staff `bao.tran@example.com`, and admin `admin.le@example.com`.
- **User documents**: Alice has an approved driver license and a pending ID card awaiting review by staff.
- **Stations**: three stations (`station-hcm-01`, `station-hcm-02`, `station-hn-01`) representing Ho Chi Minh City and Hanoi locations.
- **Vehicles**: two vehicles (Tesla Model 3 and Nissan Leaf) linked to the Ho Chi Minh stations.
- **Bookings**: Alice has a confirmed June booking tied to the Tesla and a pending July reservation without an assigned vehicle yet.
- **Rentals**: the confirmed June booking is converted into a completed rental with odometer readings.
- **Handovers**: pickup and return handovers recorded by staff `bao.tran@example.com` for the completed rental.
- **Payments**: a paid card transaction for the completed rental, including base fare and surcharge details.

You can use these seeded documents to exercise relationships — for example:

- Fetch the Tesla booking: `GET /api/booking` and locate the record with status `confirmed`.
- Inspect the completed rental workflow: `GET /api/rentals`, `GET /api/handovers`, and `GET /api/payments` using the IDs referenced in the rental payload.
- Update or delete any document to observe validation handling (e.g. enforcing enum values, numeric bounds, and reference integrity).

## Next Steps

- Extend validation or business logic inside the controllers as requirements evolve.
- Secure the endpoints (authentication/authorization) and replace placeholder password hashes when integrating with a user-facing application.
- Add automated tests once a testing strategy is defined.
