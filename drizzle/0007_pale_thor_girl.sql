CREATE TABLE `fieldOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fieldId` int NOT NULL,
	`value` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`labelAr` varchar(255),
	`parentValue` varchar(255),
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fieldOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formFields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionId` int NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`fieldType` enum('text','textarea','number','email','phone','date','datetime','dropdown','dropdown_multi','radio','checkbox','checkbox_group','file','file_multi','user_lookup','readonly') NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT false,
	`displayOrder` int NOT NULL DEFAULT 0,
	`columnSpan` int NOT NULL DEFAULT 6,
	`placeholder` varchar(255),
	`placeholderAr` varchar(255),
	`helpText` text,
	`helpTextAr` text,
	`defaultValue` varchar(500),
	`options` json,
	`optionsSource` enum('static','api','dependent') DEFAULT 'static',
	`optionsApi` varchar(500),
	`dependsOnField` varchar(100),
	`validation` json,
	`showCondition` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `formFields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestTypeId` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`icon` varchar(100),
	`displayOrder` int NOT NULL DEFAULT 0,
	`isRepeatable` boolean NOT NULL DEFAULT false,
	`minItems` int NOT NULL DEFAULT 0,
	`maxItems` int NOT NULL DEFAULT 100,
	`showCondition` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `formSections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requestCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`description` text,
	`icon` varchar(100),
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`requiresInternalOnly` boolean NOT NULL DEFAULT false,
	`allowedGroupIds` json,
	`allowMultipleTypes` boolean NOT NULL DEFAULT false,
	`typeCombinationRules` json,
	`hasRequestorSection` boolean NOT NULL DEFAULT true,
	`hasLocationSection` boolean NOT NULL DEFAULT true,
	`hasScheduleSection` boolean NOT NULL DEFAULT true,
	`hasVisitorSection` boolean NOT NULL DEFAULT true,
	`hasAttachmentSection` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requestCategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `requestCategories_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `requestMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`materialIndex` int NOT NULL,
	`direction` enum('entry','exit') NOT NULL,
	`materialType` varchar(100) NOT NULL,
	`model` varchar(255),
	`serialNumber` varchar(255),
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requestMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requestTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`shortCode` varchar(10),
	`description` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`isExclusive` boolean NOT NULL DEFAULT false,
	`maxDurationDays` int,
	`workflowId` int,
	`generateQrCode` boolean NOT NULL DEFAULT true,
	`generateDcpForm` boolean NOT NULL DEFAULT true,
	`notifyEmail` boolean NOT NULL DEFAULT true,
	`notifySms` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requestTypes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requestVehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`driverName` varchar(255),
	`driverNationality` varchar(100),
	`driverId` varchar(50),
	`driverCompany` varchar(255),
	`driverPhone` varchar(20),
	`vehiclePlate` varchar(50),
	`vehicleType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requestVehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requestVisitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`visitorIndex` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`nationality` varchar(100),
	`idType` enum('national_id','iqama','passport'),
	`idNumber` varchar(50) NOT NULL,
	`company` varchar(255),
	`jobTitle` varchar(255),
	`mobile` varchar(20),
	`email` varchar(320),
	`isVerified` boolean NOT NULL DEFAULT false,
	`verificationSource` enum('yaqeen','manual'),
	`idAttachmentUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requestVisitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `requests` ADD `categoryId` int;--> statement-breakpoint
ALTER TABLE `requests` ADD `selectedTypeIds` json;--> statement-breakpoint
ALTER TABLE `requests` ADD `formData` json;