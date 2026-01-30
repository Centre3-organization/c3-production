ALTER TABLE `cardCompanies` ADD `contactPersonName` varchar(255);--> statement-breakpoint
ALTER TABLE `cardCompanies` ADD `contactPersonEmail` varchar(255);--> statement-breakpoint
ALTER TABLE `cardCompanies` ADD `contactPersonPhone` varchar(50);--> statement-breakpoint
ALTER TABLE `cardCompanies` ADD `contactPersonPosition` varchar(100);--> statement-breakpoint
ALTER TABLE `cardCompanies` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `cardCompanies` ADD `country` varchar(100);--> statement-breakpoint
ALTER TABLE `cardCompanies` ADD `registrationNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `cardCompanies` ADD `status` enum('active','inactive','suspended') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `cardCompanies` ADD `notes` text;