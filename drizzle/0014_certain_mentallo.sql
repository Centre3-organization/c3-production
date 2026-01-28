CREATE TABLE `mainActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`description` text,
	`icon` varchar(50),
	`color` varchar(20),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mainActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mainActivityId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`description` text,
	`requiresMOP` boolean NOT NULL DEFAULT false,
	`requiresPermit` boolean NOT NULL DEFAULT false,
	`riskLevel` enum('low','medium','high','critical') DEFAULT 'low',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subActivities_id` PRIMARY KEY(`id`)
);
