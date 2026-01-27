ALTER TABLE `areaTypes` ADD `parentId` int;--> statement-breakpoint
ALTER TABLE `areaTypes` ADD `nameAr` varchar(100);--> statement-breakpoint
ALTER TABLE `areaTypes` ADD `level` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `areaTypes` ADD `sortOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `siteTypes` ADD `parentId` int;--> statement-breakpoint
ALTER TABLE `siteTypes` ADD `nameAr` varchar(100);--> statement-breakpoint
ALTER TABLE `siteTypes` ADD `level` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `siteTypes` ADD `sortOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `zoneTypes` ADD `parentId` int;--> statement-breakpoint
ALTER TABLE `zoneTypes` ADD `nameAr` varchar(100);--> statement-breakpoint
ALTER TABLE `zoneTypes` ADD `level` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `zoneTypes` ADD `sortOrder` int DEFAULT 0 NOT NULL;