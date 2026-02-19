CREATE TABLE `checkpointSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkpointId` int NOT NULL,
	`cameraEnabled` boolean NOT NULL DEFAULT true,
	`cameraResolution` enum('640x480','1280x720','1920x1080') NOT NULL DEFAULT '1280x720',
	`cameraFacingMode` enum('user','environment') NOT NULL DEFAULT 'user',
	`aiEnabled` boolean NOT NULL DEFAULT false,
	`claudeApiKey` varchar(500),
	`faceMatchingEnabled` boolean NOT NULL DEFAULT false,
	`documentValidationEnabled` boolean NOT NULL DEFAULT false,
	`anomalyDetectionEnabled` boolean NOT NULL DEFAULT false,
	`plateRecognitionEnabled` boolean NOT NULL DEFAULT false,
	`emailNotificationsEnabled` boolean NOT NULL DEFAULT true,
	`smsNotificationsEnabled` boolean NOT NULL DEFAULT false,
	`supervisorEmail` varchar(255),
	`supervisorPhone` varchar(20),
	`watchlistEnabled` boolean NOT NULL DEFAULT true,
	`autoFlagHighRisk` boolean NOT NULL DEFAULT true,
	`watchlistRetentionDays` int NOT NULL DEFAULT 90,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checkpointSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `checkpointSettings` ADD CONSTRAINT `checkpointSettings_checkpointId_checkpoints_id_fk` FOREIGN KEY (`checkpointId`) REFERENCES `checkpoints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checkpointSettings` ADD CONSTRAINT `checkpointSettings_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_settings_checkpoint` ON `checkpointSettings` (`checkpointId`);