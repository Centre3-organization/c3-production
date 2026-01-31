CREATE TABLE `dataScopeRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleId` int NOT NULL,
	`resourceType` varchar(50) NOT NULL,
	`scopeType` enum('global','site','zone','group','department','self') NOT NULL,
	`scopeConfig` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataScopeRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupAccessPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`siteId` int,
	`zoneId` int,
	`accessType` enum('allowed','restricted','escorted') NOT NULL DEFAULT 'allowed',
	`accessHours` json,
	`requiresEscort` boolean NOT NULL DEFAULT false,
	`maxVisitDuration` int,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groupAccessPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`module` varchar(50) NOT NULL,
	`action` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameAr` varchar(100),
	`description` text,
	`category` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rolePermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleId` int NOT NULL,
	`permissionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rolePermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameAr` varchar(100),
	`description` text,
	`level` int NOT NULL,
	`isSystem` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemRoles_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemRoles_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `userSiteAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`siteId` int NOT NULL,
	`accessLevel` enum('view','operate','manage','admin') NOT NULL DEFAULT 'view',
	`isPrimary` boolean NOT NULL DEFAULT false,
	`assignedBy` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `userSiteAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSystemRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleId` int NOT NULL,
	`assignedBy` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `userSystemRoles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userZoneAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`zoneId` int NOT NULL,
	`accessLevel` enum('view','operate','manage','admin') NOT NULL DEFAULT 'view',
	`assignedBy` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `userZoneAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowSendBacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` int NOT NULL,
	`taskId` int NOT NULL,
	`fromStageId` int NOT NULL,
	`targetType` enum('requestor','previous_approver','specific_stage','specific_user','group') NOT NULL,
	`targetStageId` int,
	`targetUserId` int,
	`targetGroupId` int,
	`reason` text NOT NULL,
	`requestedInfo` text,
	`deadline` timestamp,
	`status` enum('pending','responded','expired') NOT NULL DEFAULT 'pending',
	`respondedBy` int,
	`respondedAt` timestamp,
	`responseComments` text,
	`sendBackCount` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflowSendBacks_id` PRIMARY KEY(`id`)
);
