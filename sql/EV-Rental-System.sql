CREATE TABLE `users` (
	`user_id` VARCHAR(36) NOT NULL,
	`full_name` VARCHAR(255) NOT NULL,
	`email` VARCHAR(255) NOT NULL,
	`phone` VARCHAR(50),
	`password_hash` VARCHAR(255) NOT NULL,
	`role` VARCHAR(20) NOT NULL,
	`status` VARCHAR(20) NOT NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL,
	PRIMARY KEY(`user_id`)
);


CREATE INDEX `idx_users_role`
ON `users` (`role`);
CREATE TABLE `user_documents` (
	`doc_id` VARCHAR(36) NOT NULL,
	`user_id` VARCHAR(36) NOT NULL,
	`doc_type` VARCHAR(20) NOT NULL,
	`doc_number` VARCHAR(100),
	`doc_image_url` VARCHAR(1000),
	`verify_status` VARCHAR(20) NOT NULL,
	`uploaded_at` DATETIME NOT NULL,
	`verified_at` DATETIME,
	`verified_by` VARCHAR(36),
	PRIMARY KEY(`doc_id`)
);


CREATE TABLE `stations` (
	`station_id` VARCHAR(36) NOT NULL,
	`name` VARCHAR(255) NOT NULL,
	`address` VARCHAR(500),
	`lat` DECIMAL(10,7),
	`lng` DECIMAL(10,7),
	`open_hours` VARCHAR(255),
	`status` VARCHAR(20) NOT NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL,
	PRIMARY KEY(`station_id`)
);


CREATE TABLE `vehicles` (
	`vehicle_id` VARCHAR(36) NOT NULL,
	`station_id` VARCHAR(36),
	`vin` VARCHAR(64),
	`model` VARCHAR(100),
	`plate_no` VARCHAR(64),
	`battery_percent` INTEGER,
	`status` VARCHAR(20) NOT NULL,
	`odometer` INTEGER,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL,
	PRIMARY KEY(`vehicle_id`)
);


CREATE INDEX `idx_vehicles_status`
ON `vehicles` (`status`);
CREATE TABLE `bookings` (
	`booking_id` VARCHAR(36) NOT NULL,
	`renter_id` VARCHAR(36) NOT NULL,
	`pickup_station_id` VARCHAR(36) NOT NULL,
	`vehicle_id` VARCHAR(36),
	`pickup_time_expected` DATETIME NOT NULL,
	`status` VARCHAR(20) NOT NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL,
	PRIMARY KEY(`booking_id`)
);


CREATE TABLE `rentals` (
	`rental_id` VARCHAR(36) NOT NULL,
	`booking_id` VARCHAR(36),
	`renter_id` VARCHAR(36) NOT NULL,
	`vehicle_id` VARCHAR(36) NOT NULL,
	`pickup_station_id` VARCHAR(36) NOT NULL,
	`return_station_id` VARCHAR(36),
	`pickup_time` DATETIME NOT NULL,
	`return_time` DATETIME,
	`odo_start` INTEGER,
	`odo_end` INTEGER,
	`condition_notes` TEXT,
	`status` VARCHAR(20) NOT NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL,
	PRIMARY KEY(`rental_id`)
);


CREATE TABLE `handovers` (
	`handover_id` VARCHAR(36) NOT NULL,
	`rental_id` VARCHAR(36) NOT NULL,
	`vehicle_id` VARCHAR(36) NOT NULL,
	`staff_id` VARCHAR(36) NOT NULL,
	`action` VARCHAR(20) NOT NULL,
	`notes` TEXT,
	`photos_url` VARCHAR(1000),
	`created_at` DATETIME NOT NULL,
	PRIMARY KEY(`handover_id`)
);


CREATE TABLE `payments` (
	`payment_id` VARCHAR(36) NOT NULL,
	`rental_id` VARCHAR(36) NOT NULL,
	`method` VARCHAR(20) NOT NULL,
	`status` VARCHAR(20) NOT NULL,
	`base_amount` DECIMAL(12,2) NOT NULL,
	`surcharge_amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
	`total_amount` DECIMAL(12,2) NOT NULL,
	`txn_ref` VARCHAR(128),
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL,
	PRIMARY KEY(`payment_id`)
);


ALTER TABLE `user_documents`
ADD FOREIGN KEY(`user_id`) REFERENCES `users`(`user_id`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `user_documents`
ADD FOREIGN KEY(`verified_by`) REFERENCES `users`(`user_id`)
ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE `vehicles`
ADD FOREIGN KEY(`station_id`) REFERENCES `stations`(`station_id`)
ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE `bookings`
ADD FOREIGN KEY(`renter_id`) REFERENCES `users`(`user_id`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `bookings`
ADD FOREIGN KEY(`pickup_station_id`) REFERENCES `stations`(`station_id`)
ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `bookings`
ADD FOREIGN KEY(`vehicle_id`) REFERENCES `vehicles`(`vehicle_id`)
ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE `rentals`
ADD FOREIGN KEY(`booking_id`) REFERENCES `bookings`(`booking_id`)
ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE `rentals`
ADD FOREIGN KEY(`renter_id`) REFERENCES `users`(`user_id`)
ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `rentals`
ADD FOREIGN KEY(`vehicle_id`) REFERENCES `vehicles`(`vehicle_id`)
ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `rentals`
ADD FOREIGN KEY(`pickup_station_id`) REFERENCES `stations`(`station_id`)
ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `rentals`
ADD FOREIGN KEY(`return_station_id`) REFERENCES `stations`(`station_id`)
ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE `handovers`
ADD FOREIGN KEY(`rental_id`) REFERENCES `rentals`(`rental_id`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `handovers`
ADD FOREIGN KEY(`vehicle_id`) REFERENCES `vehicles`(`vehicle_id`)
ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `handovers`
ADD FOREIGN KEY(`staff_id`) REFERENCES `users`(`user_id`)
ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `payments`
ADD FOREIGN KEY(`rental_id`) REFERENCES `rentals`(`rental_id`)
ON UPDATE CASCADE ON DELETE CASCADE;