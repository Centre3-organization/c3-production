CREATE TABLE `approvers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`siteId` int,
	`regionId` int,
	`approvalLevel` int NOT NULL DEFAULT 1,
	`maxApprovalAmount` varchar(20),
	`canApproveEmergency` boolean NOT NULL DEFAULT false,
	`canApproveVIP` boolean NOT NULL DEFAULT false,
	`delegateUserId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roleTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameAr` varchar(100),
	`description` text,
	`category` enum('internal','external','contractor','visitor') DEFAULT 'internal',
	`accessLevel` enum('basic','standard','elevated','full') DEFAULT 'standard',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roleTypes_id` PRIMARY KEY(`id`)
);
