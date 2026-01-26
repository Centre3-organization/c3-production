CREATE TABLE `groupAccessPolicy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`resourceType` enum('site','zone','area','system','application','data') NOT NULL,
	`resourceId` int,
	`accessLevel` enum('none','read','write','execute','delete','admin') NOT NULL DEFAULT 'read',
	`timeRestriction` json,
	`ipRestrictions` json,
	`requiresMfa` boolean NOT NULL DEFAULT false,
	`requiresApproval` boolean NOT NULL DEFAULT false,
	`requiresEscort` boolean NOT NULL DEFAULT false,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groupAccessPolicy_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupSecuritySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`sessionTimeoutMinutes` int NOT NULL DEFAULT 30,
	`passwordComplexityLevel` enum('basic','standard','high') NOT NULL DEFAULT 'standard',
	`mfaRequired` boolean NOT NULL DEFAULT false,
	`allowedIpRanges` json,
	`allowedLocations` json,
	`auditLevel` enum('basic','detailed','comprehensive') NOT NULL DEFAULT 'basic',
	`accessReviewFrequency` enum('monthly','quarterly','annually','never') NOT NULL DEFAULT 'quarterly',
	`maxConcurrentSessions` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groupSecuritySettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `groupSecuritySettings_groupId_unique` UNIQUE(`groupId`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`groupType` enum('internal','external') NOT NULL,
	`parentGroupId` int,
	`description` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdBy` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userGroupMembership` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`groupId` int NOT NULL,
	`isPrimaryGroup` boolean NOT NULL DEFAULT false,
	`assignedBy` int,
	`status` enum('active','inactive','pending') NOT NULL DEFAULT 'active',
	`validFrom` timestamp,
	`validUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userGroupMembership_id` PRIMARY KEY(`id`)
);
