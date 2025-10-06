# EV-Rental-System documentation
## Summary

- [Introduction](#introduction)
- [Database Type](#database-type)
- [Table Structure](#table-structure)
	- [users](#users)
	- [user_documents](#user_documents)
	- [stations](#stations)
	- [vehicles](#vehicles)
	- [bookings](#bookings)
	- [rentals](#rentals)
	- [handovers](#handovers)
	- [payments](#payments)
- [Relationships](#relationships)
- [Database Diagram](#database-diagram)

## Introduction

## Database type

- **Database system:** MySQL
## Table structure

### users

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **user_id** | VARCHAR(36) | 🔑 PK, not null |  | |
| **full_name** | VARCHAR(255) | not null |  | |
| **email** | VARCHAR(255) | not null |  | |
| **phone** | VARCHAR(50) | null |  | |
| **password_hash** | VARCHAR(255) | not null |  | |
| **role** | VARCHAR(20) | not null |  | |
| **status** | VARCHAR(20) | not null |  | |
| **created_at** | DATETIME | not null |  | |
| **updated_at** | DATETIME | not null |  | | 


#### Indexes
| Name | Unique | Fields |
|------|--------|--------|
| idx_users_role |  | role |
### user_documents

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **doc_id** | VARCHAR(36) | 🔑 PK, not null |  | |
| **user_id** | VARCHAR(36) | not null | fk_user_documents_user_id_users | |
| **doc_type** | VARCHAR(20) | not null |  | |
| **doc_number** | VARCHAR(100) | null |  | |
| **doc_image_url** | VARCHAR(1000) | null |  | |
| **verify_status** | VARCHAR(20) | not null |  | |
| **uploaded_at** | DATETIME | not null |  | |
| **verified_at** | DATETIME | null |  | |
| **verified_by** | VARCHAR(36) | null | fk_user_documents_verified_by_users | | 


### stations

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **station_id** | VARCHAR(36) | 🔑 PK, not null |  | |
| **name** | VARCHAR(255) | not null |  | |
| **address** | VARCHAR(500) | null |  | |
| **lat** | DECIMAL(10,7) | null |  | |
| **lng** | DECIMAL(10,7) | null |  | |
| **open_hours** | VARCHAR(255) | null |  | |
| **status** | VARCHAR(20) | not null |  | |
| **created_at** | DATETIME | not null |  | |
| **updated_at** | DATETIME | not null |  | | 


### vehicles

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **vehicle_id** | VARCHAR(36) | 🔑 PK, not null |  | |
| **station_id** | VARCHAR(36) | null | fk_vehicles_station_id_stations | |
| **vin** | VARCHAR(64) | null |  | |
| **model** | VARCHAR(100) | null |  | |
| **plate_no** | VARCHAR(64) | null |  | |
| **battery_percent** | INTEGER | null |  | |
| **status** | VARCHAR(20) | not null |  | |
| **odometer** | INTEGER | null |  | |
| **created_at** | DATETIME | not null |  | |
| **updated_at** | DATETIME | not null |  | | 


#### Indexes
| Name | Unique | Fields |
|------|--------|--------|
| idx_vehicles_status |  | status |
### bookings

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **booking_id** | VARCHAR(36) | 🔑 PK, not null |  | |
| **renter_id** | VARCHAR(36) | not null | fk_bookings_renter_id_users | |
| **pickup_station_id** | VARCHAR(36) | not null | fk_bookings_pickup_station_id_stations | |
| **vehicle_id** | VARCHAR(36) | null | fk_bookings_vehicle_id_vehicles | |
| **pickup_time_expected** | DATETIME | not null |  | |
| **status** | VARCHAR(20) | not null |  | |
| **created_at** | DATETIME | not null |  | |
| **updated_at** | DATETIME | not null |  | | 


### rentals

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **rental_id** | VARCHAR(36) | 🔑 PK, not null |  | |
| **booking_id** | VARCHAR(36) | null | fk_rentals_booking_id_bookings | |
| **renter_id** | VARCHAR(36) | not null | fk_rentals_renter_id_users | |
| **vehicle_id** | VARCHAR(36) | not null | fk_rentals_vehicle_id_vehicles | |
| **pickup_station_id** | VARCHAR(36) | not null | fk_rentals_pickup_station_id_stations | |
| **return_station_id** | VARCHAR(36) | null | fk_rentals_return_station_id_stations | |
| **pickup_time** | DATETIME | not null |  | |
| **return_time** | DATETIME | null |  | |
| **odo_start** | INTEGER | null |  | |
| **odo_end** | INTEGER | null |  | |
| **condition_notes** | TEXT | null |  | |
| **status** | VARCHAR(20) | not null |  | |
| **created_at** | DATETIME | not null |  | |
| **updated_at** | DATETIME | not null |  | | 


### handovers

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **handover_id** | VARCHAR(36) | 🔑 PK, not null |  | |
| **rental_id** | VARCHAR(36) | not null | fk_handovers_rental_id_rentals | |
| **vehicle_id** | VARCHAR(36) | not null | fk_handovers_vehicle_id_vehicles | |
| **staff_id** | VARCHAR(36) | not null | fk_handovers_staff_id_users | |
| **action** | VARCHAR(20) | not null |  | |
| **notes** | TEXT | null |  | |
| **photos_url** | VARCHAR(1000) | null |  | |
| **created_at** | DATETIME | not null |  | | 


### payments

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **payment_id** | VARCHAR(36) | 🔑 PK, not null |  | |
| **rental_id** | VARCHAR(36) | not null | fk_payments_rental_id_rentals | |
| **method** | VARCHAR(20) | not null |  | |
| **status** | VARCHAR(20) | not null |  | |
| **base_amount** | DECIMAL(12,2) | not null |  | |
| **surcharge_amount** | DECIMAL(12,2) | not null, default: 0 |  | |
| **total_amount** | DECIMAL(12,2) | not null |  | |
| **txn_ref** | VARCHAR(128) | null |  | |
| **created_at** | DATETIME | not null |  | |
| **updated_at** | DATETIME | not null |  | | 


## Relationships

- **user_documents to users**: many_to_one
- **user_documents to users**: many_to_one
- **vehicles to stations**: many_to_one
- **bookings to users**: many_to_one
- **bookings to stations**: many_to_one
- **bookings to vehicles**: many_to_one
- **rentals to bookings**: many_to_one
- **rentals to users**: many_to_one
- **rentals to vehicles**: many_to_one
- **rentals to stations**: many_to_one
- **rentals to stations**: many_to_one
- **handovers to rentals**: many_to_one
- **handovers to vehicles**: many_to_one
- **handovers to users**: many_to_one
- **payments to rentals**: many_to_one

## Database Diagram

```mermaid
erDiagram
	user_documents }o--|| users : references
	user_documents }o--|| users : references
	vehicles }o--|| stations : references
	bookings }o--|| users : references
	bookings }o--|| stations : references
	bookings }o--|| vehicles : references
	rentals }o--|| bookings : references
	rentals }o--|| users : references
	rentals }o--|| vehicles : references
	rentals }o--|| stations : references
	rentals }o--|| stations : references
	handovers }o--|| rentals : references
	handovers }o--|| vehicles : references
	handovers }o--|| users : references
	payments }o--|| rentals : references

	users {
		VARCHAR(36) user_id
		VARCHAR(255) full_name
		VARCHAR(255) email
		VARCHAR(50) phone
		VARCHAR(255) password_hash
		VARCHAR(20) role
		VARCHAR(20) status
		DATETIME created_at
		DATETIME updated_at
	}

	user_documents {
		VARCHAR(36) doc_id
		VARCHAR(36) user_id
		VARCHAR(20) doc_type
		VARCHAR(100) doc_number
		VARCHAR(1000) doc_image_url
		VARCHAR(20) verify_status
		DATETIME uploaded_at
		DATETIME verified_at
		VARCHAR(36) verified_by
	}

	stations {
		VARCHAR(36) station_id
		VARCHAR(255) name
		VARCHAR(500) address
		DECIMAL(10,7) lat
		DECIMAL(10,7) lng
		VARCHAR(255) open_hours
		VARCHAR(20) status
		DATETIME created_at
		DATETIME updated_at
	}

	vehicles {
		VARCHAR(36) vehicle_id
		VARCHAR(36) station_id
		VARCHAR(64) vin
		VARCHAR(100) model
		VARCHAR(64) plate_no
		INTEGER battery_percent
		VARCHAR(20) status
		INTEGER odometer
		DATETIME created_at
		DATETIME updated_at
	}

	bookings {
		VARCHAR(36) booking_id
		VARCHAR(36) renter_id
		VARCHAR(36) pickup_station_id
		VARCHAR(36) vehicle_id
		DATETIME pickup_time_expected
		VARCHAR(20) status
		DATETIME created_at
		DATETIME updated_at
	}

	rentals {
		VARCHAR(36) rental_id
		VARCHAR(36) booking_id
		VARCHAR(36) renter_id
		VARCHAR(36) vehicle_id
		VARCHAR(36) pickup_station_id
		VARCHAR(36) return_station_id
		DATETIME pickup_time
		DATETIME return_time
		INTEGER odo_start
		INTEGER odo_end
		TEXT condition_notes
		VARCHAR(20) status
		DATETIME created_at
		DATETIME updated_at
	}

	handovers {
		VARCHAR(36) handover_id
		VARCHAR(36) rental_id
		VARCHAR(36) vehicle_id
		VARCHAR(36) staff_id
		VARCHAR(20) action
		TEXT notes
		VARCHAR(1000) photos_url
		DATETIME created_at
	}

	payments {
		VARCHAR(36) payment_id
		VARCHAR(36) rental_id
		VARCHAR(20) method
		VARCHAR(20) status
		DECIMAL(12,2) base_amount
		DECIMAL(12,2) surcharge_amount
		DECIMAL(12,2) total_amount
		VARCHAR(128) txn_ref
		DATETIME created_at
		DATETIME updated_at
	}
```