CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`stage` enum('l1','manual') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approverId` int,
	`comments` text,
	`entryMethod` enum('manual','rfid','card'),
	`cardNumber` varchar(50),
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `areaTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `areaTypes_id` PRIMARY KEY(`id`),
	CONSTRAINT `areaTypes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`areaTypeId` int,
	`floor` varchar(10),
	`maxCapacity` int NOT NULL DEFAULT 0,
	`rackCount` int DEFAULT 0,
	`infrastructureSpecs` json,
	`status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `areas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(3) NOT NULL,
	`name` varchar(100) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `countries_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`costCenter` varchar(50),
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regions_id` PRIMARY KEY(`id`),
	CONSTRAINT `regions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `requestAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`assetType` enum('laptop','camera','tool','material','other') NOT NULL,
	`description` varchar(200),
	`serialNumber` varchar(100),
	`quantity` int NOT NULL DEFAULT 1,
	CONSTRAINT `requestAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requestZones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`zoneId` int NOT NULL,
	CONSTRAINT `requestZones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestNumber` varchar(50) NOT NULL,
	`type` enum('admin_visit','work_permit','material_entry','tep','mop','escort') NOT NULL,
	`status` enum('draft','pending_l1','pending_manual','approved','rejected','cancelled','expired') NOT NULL DEFAULT 'draft',
	`requestorId` int NOT NULL,
	`visitorName` varchar(100) NOT NULL,
	`visitorIdType` enum('national_id','iqama','passport') NOT NULL,
	`visitorIdNumber` varchar(50) NOT NULL,
	`visitorCompany` varchar(100),
	`visitorPhone` varchar(20),
	`visitorEmail` varchar(320),
	`hostId` int,
	`siteId` int NOT NULL,
	`purpose` text,
	`startDate` varchar(10) NOT NULL,
	`endDate` varchar(10) NOT NULL,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `requests_requestNumber_unique` UNIQUE(`requestNumber`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`permissions` json NOT NULL,
	`isSystem` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `securityAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`zoneId` int,
	`type` enum('door_forced','unauthorized_access','tailgating','fire','intrusion','system_failure','manual_trigger') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`title` varchar(200) NOT NULL,
	`description` text,
	`status` enum('new','viewed','in_progress','resolved','false_alarm') NOT NULL DEFAULT 'new',
	`viewedBy` int,
	`viewedAt` timestamp,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siteTypes_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteTypes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`countryId` int,
	`regionId` int,
	`cityId` int,
	`address` text,
	`latitude` varchar(20),
	`longitude` varchar(20),
	`siteTypeId` int,
	`category` enum('primary','secondary','tertiary') DEFAULT 'primary',
	`maxCapacity` int NOT NULL DEFAULT 0,
	`currentOccupancy` int NOT NULL DEFAULT 0,
	`status` enum('active','inactive','maintenance','offline') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sites_id` PRIMARY KEY(`id`),
	CONSTRAINT `sites_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `systemSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `zoneTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `zoneTypes_id` PRIMARY KEY(`id`),
	CONSTRAINT `zoneTypes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`zoneTypeId` int,
	`securityLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`accessPolicy` enum('open','supervised','restricted','prohibited') DEFAULT 'supervised',
	`maxCapacity` int NOT NULL DEFAULT 0,
	`currentOccupancy` int NOT NULL DEFAULT 0,
	`securityControls` json,
	`isLocked` boolean NOT NULL DEFAULT false,
	`lockedBy` int,
	`lockedAt` timestamp,
	`lockReason` text,
	`status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `zones_id` PRIMARY KEY(`id`)
);
