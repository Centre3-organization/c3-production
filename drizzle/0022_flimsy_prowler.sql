ALTER TABLE `groups` MODIFY COLUMN `groupType` enum('internal','contractor','client') NOT NULL;--> statement-breakpoint
ALTER TABLE `groups` ADD `companyId` int;