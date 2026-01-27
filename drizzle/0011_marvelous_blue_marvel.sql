ALTER TABLE `approvalInstances` ADD `entryMethod` enum('qr_code','rfid','card');--> statement-breakpoint
ALTER TABLE `approvalInstances` ADD `qrCodeData` varchar(500);--> statement-breakpoint
ALTER TABLE `approvalInstances` ADD `rfidTag` varchar(100);--> statement-breakpoint
ALTER TABLE `approvalInstances` ADD `cardNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `approvalInstances` ADD `accessGrantedBy` int;--> statement-breakpoint
ALTER TABLE `approvalInstances` ADD `accessGrantedAt` timestamp;