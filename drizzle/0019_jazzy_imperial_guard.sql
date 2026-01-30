ALTER TABLE `cardCompanies` ADD `parentCompanyId` int;--> statement-breakpoint
ALTER TABLE `cardCompanies` ADD `contractReference` varchar(100);--> statement-breakpoint
ALTER TABLE `cardCompanies` ADD `contractStartDate` date;--> statement-breakpoint
ALTER TABLE `cardCompanies` ADD `contractEndDate` date;