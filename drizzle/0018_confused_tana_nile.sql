ALTER TABLE `users` ADD `userType` enum('centre3_employee','contractor','sub_contractor','client') DEFAULT 'centre3_employee';--> statement-breakpoint
ALTER TABLE `users` ADD `employeeId` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `jobTitle` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `contractorCompanyId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `parentContractorId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `subContractorCompany` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `clientCompanyId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `contractReference` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `contractExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `reportingToId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `accountManagerId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `profilePhotoUrl` varchar(500);