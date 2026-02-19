CREATE TABLE `checkpointTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkpointId` int NOT NULL,
	`requestId` int,
	`transactionType` enum('person_entry','person_exit','vehicle_entry','vehicle_exit','asset_in','asset_out') NOT NULL,
	`decision` enum('allowed','denied','held') NOT NULL,
	`personName` varchar(255),
	`idNumber` varchar(50),
	`idType` enum('national_id','iqama','passport','other'),
	`vehiclePlate` varchar(20),
	`idVerified` boolean DEFAULT false,
	`photoMatched` boolean DEFAULT false,
	`aiResults` json,
	`notes` text,
	`guardId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checkpointTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checkpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`zoneId` int,
	`name` varchar(100) NOT NULL,
	`nameAr` varchar(100),
	`description` text,
	`type` enum('main_gate','side_gate','service_entrance','emergency_exit','loading_dock','other') NOT NULL,
	`location` varchar(255),
	`hasCamera` boolean DEFAULT false,
	`hasGateControl` boolean DEFAULT false,
	`gateControlId` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checkpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `denialReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`requestId` int,
	`denialReason` enum('request_not_found','request_expired','request_not_valid_yet','request_cancelled','wrong_gate','wrong_date','wrong_time','fake_pass','tampered_pass','screenshot_pass','shared_pass','escort_not_present','host_declined','safety_violation','no_ppe','vehicle_mismatch','driver_mismatch','cargo_issue','extra_items','missing_approval','serial_mismatch','supervisor_order','system_error','other') NOT NULL,
	`denialCategory` enum('document','person','request','pass','procedural','vehicle','asset','other') NOT NULL,
	`comments` text NOT NULL,
	`photos` json,
	`aiFaceMatchScore` int,
	`aiDocumentValidation` json,
	`aiAnomaly` json,
	`supervisorNotified` boolean DEFAULT false,
	`addToWatchlist` boolean DEFAULT false,
	`recommendBlacklist` boolean DEFAULT false,
	`guardId` int NOT NULL,
	`checkpointId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `denialReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fakePassReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`detectionMethod` enum('qr_crypto_failed','qr_request_not_exist','photocopy_detected','physical_tampering','details_mismatch','wrong_format','other') NOT NULL,
	`qrContent` text,
	`passType` enum('printed','phone_screen','laminated_card','other'),
	`physicalCondition` text,
	`personName` varchar(255),
	`idShown` boolean DEFAULT false,
	`idNumber` varchar(50),
	`claimedCompany` varchar(255),
	`claimedHost` varchar(255),
	`behaviorWhenConfronted` enum('cooperative','confused','defensive','fled','aggressive'),
	`photoOfPass` varchar(500) NOT NULL,
	`photoOfPerson` varchar(500),
	`photoOfVehicle` varchar(500),
	`guardNotes` text NOT NULL,
	`supervisorNotified` boolean DEFAULT true,
	`securityDispatched` boolean DEFAULT false,
	`policeNotified` boolean DEFAULT false,
	`personAddedToWatchlist` boolean DEFAULT false,
	`vehicleAddedToWatchlist` boolean DEFAULT false,
	`vehiclePlate` varchar(20),
	`vehicleDescription` text,
	`guardId` int NOT NULL,
	`checkpointId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fakePassReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unregisteredEntryAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personName` varchar(255),
	`idNumber` varchar(50),
	`idType` enum('national_id','iqama','passport','other'),
	`company` varchar(255),
	`phone` varchar(20),
	`statedHost` varchar(255),
	`statedPurpose` text,
	`expectedBy` varchar(255),
	`vehiclePlate` varchar(20),
	`vehicleType` varchar(50),
	`vehicleColor` varchar(30),
	`attemptType` enum('walk_in','claims_appointment','wrong_date_time','fake_pass','tailgating','social_engineering','repeat_attempt','other_suspicious') NOT NULL,
	`guardNotes` text NOT NULL,
	`photos` json,
	`outcome` enum('turned_away','directed_elsewhere','escalated_supervisor','created_walkin','security_called') NOT NULL,
	`flagForReview` boolean DEFAULT false,
	`addToWatchlist` boolean DEFAULT false,
	`isRepeatAttempt` boolean DEFAULT false,
	`guardId` int NOT NULL,
	`checkpointId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unregisteredEntryAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entryType` enum('person','vehicle','company') NOT NULL,
	`personName` varchar(255),
	`idNumber` varchar(50),
	`idType` enum('national_id','iqama','passport','other'),
	`vehiclePlate` varchar(20),
	`vehicleType` varchar(50),
	`vehicleColor` varchar(30),
	`companyName` varchar(255),
	`reason` text NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`actionRequired` enum('monitor','deny_entry','alert_supervisor','call_security') NOT NULL,
	`sourceType` enum('denial_report','unregistered_attempt','fake_pass','security_incident','manual_entry') NOT NULL,
	`sourceId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`addedBy` int NOT NULL,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `checkpointTransactions` ADD CONSTRAINT `checkpointTransactions_checkpointId_checkpoints_id_fk` FOREIGN KEY (`checkpointId`) REFERENCES `checkpoints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkpointTransactions` ADD CONSTRAINT `checkpointTransactions_requestId_requests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkpointTransactions` ADD CONSTRAINT `checkpointTransactions_guardId_users_id_fk` FOREIGN KEY (`guardId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkpoints` ADD CONSTRAINT `checkpoints_siteId_sites_id_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkpoints` ADD CONSTRAINT `checkpoints_zoneId_zones_id_fk` FOREIGN KEY (`zoneId`) REFERENCES `zones`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `denialReports` ADD CONSTRAINT `denialReports_transactionId_checkpointTransactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `checkpointTransactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `denialReports` ADD CONSTRAINT `denialReports_requestId_requests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `denialReports` ADD CONSTRAINT `denialReports_guardId_users_id_fk` FOREIGN KEY (`guardId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `denialReports` ADD CONSTRAINT `denialReports_checkpointId_checkpoints_id_fk` FOREIGN KEY (`checkpointId`) REFERENCES `checkpoints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fakePassReports` ADD CONSTRAINT `fakePassReports_guardId_users_id_fk` FOREIGN KEY (`guardId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fakePassReports` ADD CONSTRAINT `fakePassReports_checkpointId_checkpoints_id_fk` FOREIGN KEY (`checkpointId`) REFERENCES `checkpoints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unregisteredEntryAttempts` ADD CONSTRAINT `unregisteredEntryAttempts_guardId_users_id_fk` FOREIGN KEY (`guardId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unregisteredEntryAttempts` ADD CONSTRAINT `unregisteredEntryAttempts_checkpointId_checkpoints_id_fk` FOREIGN KEY (`checkpointId`) REFERENCES `checkpoints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlist` ADD CONSTRAINT `watchlist_addedBy_users_id_fk` FOREIGN KEY (`addedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlist` ADD CONSTRAINT `watchlist_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_denial_transaction` ON `denialReports` (`transactionId`);--> statement-breakpoint
CREATE INDEX `idx_denial_reason` ON `denialReports` (`denialReason`);--> statement-breakpoint
CREATE INDEX `idx_denial_checkpoint` ON `denialReports` (`checkpointId`);--> statement-breakpoint
CREATE INDEX `idx_denial_time` ON `denialReports` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_fake_checkpoint` ON `fakePassReports` (`checkpointId`);--> statement-breakpoint
CREATE INDEX `idx_fake_method` ON `fakePassReports` (`detectionMethod`);--> statement-breakpoint
CREATE INDEX `idx_fake_time` ON `fakePassReports` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_unreg_checkpoint` ON `unregisteredEntryAttempts` (`checkpointId`);--> statement-breakpoint
CREATE INDEX `idx_unreg_type` ON `unregisteredEntryAttempts` (`attemptType`);--> statement-breakpoint
CREATE INDEX `idx_unreg_time` ON `unregisteredEntryAttempts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_unreg_person` ON `unregisteredEntryAttempts` (`personName`,`idNumber`);--> statement-breakpoint
CREATE INDEX `idx_watchlist_type` ON `watchlist` (`entryType`);--> statement-breakpoint
CREATE INDEX `idx_watchlist_person` ON `watchlist` (`personName`,`idNumber`);--> statement-breakpoint
CREATE INDEX `idx_watchlist_vehicle` ON `watchlist` (`vehiclePlate`);--> statement-breakpoint
CREATE INDEX `idx_watchlist_active` ON `watchlist` (`isActive`);