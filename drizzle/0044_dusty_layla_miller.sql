CREATE TABLE `securityAlertConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertTypeId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerConditions` json NOT NULL,
	`impactLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`affectedAreas` json,
	`statusOnTrigger` varchar(50) DEFAULT 'alert_triggered',
	`autoResolve` boolean DEFAULT false,
	`autoResolveAfterMinutes` int,
	`viewableBy` json NOT NULL,
	`actionPoints` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityAlertConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityAlertLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertConfigId` int NOT NULL,
	`triggeredBy` varchar(255),
	`triggerData` json,
	`status` enum('triggered','acknowledged','in_progress','resolved','escalated') NOT NULL DEFAULT 'triggered',
	`notificationsSent` json,
	`actionsTaken` json,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolutionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityAlertLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityAlertNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertConfigId` int NOT NULL,
	`triggerOn` enum('alert_created','alert_escalated','action_taken','alert_resolved') NOT NULL,
	`channel` enum('email','sms','whatsapp','in_app','webhook') NOT NULL,
	`recipients` json NOT NULL,
	`messageTemplate` text,
	`messageVariables` json,
	`sendImmediately` boolean DEFAULT true,
	`delayMinutes` int DEFAULT 0,
	`deduplicateWithin` int,
	`escalationLevel` int DEFAULT 1,
	`escalateAfterMinutes` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityAlertNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityAlertTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` enum('breach','impact','status','view','action') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`isActive` boolean NOT NULL DEFAULT true,
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityAlertTypes_id` PRIMARY KEY(`id`),
	CONSTRAINT `securityAlertTypes_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `securityAlertConfigs` ADD CONSTRAINT `sac_alertTypeId_sat_id_fk` FOREIGN KEY (`alertTypeId`) REFERENCES `securityAlertTypes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityAlertConfigs` ADD CONSTRAINT `sac_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityAlertLogs` ADD CONSTRAINT `sal_alertConfigId_sac_id_fk` FOREIGN KEY (`alertConfigId`) REFERENCES `securityAlertConfigs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityAlertLogs` ADD CONSTRAINT `sal_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityAlertNotifications` ADD CONSTRAINT `san_alertConfigId_sac_id_fk` FOREIGN KEY (`alertConfigId`) REFERENCES `securityAlertConfigs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityAlertNotifications` ADD CONSTRAINT `san_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityAlertTypes` ADD CONSTRAINT `sat_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_config_alert_type` ON `securityAlertConfigs` (`alertTypeId`);--> statement-breakpoint
CREATE INDEX `idx_config_active` ON `securityAlertConfigs` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_log_alert_config` ON `securityAlertLogs` (`alertConfigId`);--> statement-breakpoint
CREATE INDEX `idx_log_status` ON `securityAlertLogs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_log_created_at` ON `securityAlertLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_notif_alert_config` ON `securityAlertNotifications` (`alertConfigId`);--> statement-breakpoint
CREATE INDEX `idx_notif_channel` ON `securityAlertNotifications` (`channel`);--> statement-breakpoint
CREATE INDEX `idx_notif_active` ON `securityAlertNotifications` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_alert_category` ON `securityAlertTypes` (`category`);--> statement-breakpoint
CREATE INDEX `idx_alert_active` ON `securityAlertTypes` (`isActive`);