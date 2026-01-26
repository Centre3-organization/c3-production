ALTER TABLE `groups` ADD `groupCategory` varchar(50);--> statement-breakpoint
ALTER TABLE `groups` ADD `requiresApprovalChain` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `groups` ADD `defaultWorkflowId` int;--> statement-breakpoint
ALTER TABLE `groups` ADD `approvalConfig` json;--> statement-breakpoint
ALTER TABLE `groups` ADD `internalLiaisonUserId` int;--> statement-breakpoint
ALTER TABLE `groups` ADD `internalLiaisonGroupId` int;--> statement-breakpoint
ALTER TABLE `groups` ADD `slaOverrideHours` int;--> statement-breakpoint
ALTER TABLE `groups` ADD `timezone` varchar(50) DEFAULT 'Asia/Riyadh';--> statement-breakpoint
ALTER TABLE `groups` ADD `workingHours` json;--> statement-breakpoint
ALTER TABLE `userGroupMembership` ADD `roleInGroup` varchar(100);--> statement-breakpoint
ALTER TABLE `userGroupMembership` ADD `reportsToUserId` int;--> statement-breakpoint
ALTER TABLE `userGroupMembership` ADD `canApprove` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userGroupMembership` ADD `approvalLimit` decimal(15,2);--> statement-breakpoint
ALTER TABLE `userGroupMembership` ADD `isGroupAdmin` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `userGroupMembership` ADD `notificationPreferences` json;--> statement-breakpoint
ALTER TABLE `users` ADD `managerId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `alternateManagerId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `employeeType` enum('internal','external','contractor') DEFAULT 'internal';--> statement-breakpoint
ALTER TABLE `users` ADD `workScheduleId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `defaultSiteId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `canDelegate` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `maxDelegationDays` int DEFAULT 30;--> statement-breakpoint
ALTER TABLE `users` ADD `approvalAuthorityLevel` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `outOfOfficeUntil` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `outOfOfficeDelegateId` int;