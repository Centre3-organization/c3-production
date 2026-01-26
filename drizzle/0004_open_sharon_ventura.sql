CREATE TABLE `approvalDelegations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`delegatorId` int NOT NULL,
	`delegateId` int NOT NULL,
	`delegationType` enum('full','partial') NOT NULL DEFAULT 'full',
	`processTypes` json,
	`siteIds` json,
	`approvalRoleIds` json,
	`validFrom` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`reason` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`revokedAt` timestamp,
	`revokedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvalDelegations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvalHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` int NOT NULL,
	`taskId` int,
	`stageId` int,
	`actionType` enum('workflow_started','workflow_completed','stage_started','stage_completed','task_assigned','task_reassigned','decision_made','info_requested','info_provided','escalation_triggered','delegation_applied','sla_warning','sla_breach','comment_added','document_attached') NOT NULL,
	`actionBy` int,
	`actionByType` enum('user','system','scheduler') NOT NULL DEFAULT 'user',
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`actionAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvalHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvalInstances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`requestType` varchar(50) NOT NULL,
	`workflowId` int NOT NULL,
	`currentStageId` int,
	`currentStageOrder` int NOT NULL DEFAULT 1,
	`status` enum('pending','in_progress','approved','rejected','cancelled','info_requested') NOT NULL DEFAULT 'pending',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvalInstances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvalRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`level` int NOT NULL DEFAULT 1,
	`processTypes` json,
	`canFinalApprove` boolean NOT NULL DEFAULT false,
	`canReject` boolean NOT NULL DEFAULT true,
	`canRequestInfo` boolean NOT NULL DEFAULT true,
	`canDelegate` boolean NOT NULL DEFAULT false,
	`maxSlaHours` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvalRoles_id` PRIMARY KEY(`id`),
	CONSTRAINT `approvalRoles_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `approvalStages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`stageOrder` int NOT NULL,
	`stageName` varchar(255) NOT NULL,
	`stageType` enum('individual','role','group','group_hierarchy','dynamic_field','shift_based','manager','external_manager','site_manager','zone_owner','custom_resolver') NOT NULL,
	`approvalMode` enum('any','all','percentage') NOT NULL DEFAULT 'any',
	`requiredApprovals` int NOT NULL DEFAULT 1,
	`approvalPercentage` int,
	`canReject` boolean NOT NULL DEFAULT true,
	`canRequestInfo` boolean NOT NULL DEFAULT true,
	`slaHours` int,
	`autoApproveOnSla` boolean NOT NULL DEFAULT false,
	`autoRejectOnSla` boolean NOT NULL DEFAULT false,
	`isConditional` boolean NOT NULL DEFAULT false,
	`conditionExpression` json,
	`timeRestrictions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvalStages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvalTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` int NOT NULL,
	`stageId` int NOT NULL,
	`assignedTo` int NOT NULL,
	`assignedVia` enum('direct','role','group','shift','delegation','escalation') NOT NULL,
	`originalAssignee` int,
	`status` enum('pending','approved','rejected','info_requested','reassigned','expired','skipped') NOT NULL DEFAULT 'pending',
	`decision` enum('approved','rejected','info_requested'),
	`comments` text,
	`infoRequest` json,
	`dueAt` timestamp,
	`decidedAt` timestamp,
	`remindersSent` int NOT NULL DEFAULT 0,
	`lastReminderAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvalTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvalWorkflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`processType` enum('admin_visit','work_permit','material_entry','tep','mop','escort','mcm','tdp','mhv'),
	`isActive` boolean NOT NULL DEFAULT true,
	`priority` int NOT NULL DEFAULT 0,
	`isDefault` boolean NOT NULL DEFAULT false,
	`version` int NOT NULL DEFAULT 1,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvalWorkflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escalationRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stageId` int NOT NULL,
	`escalationOrder` int NOT NULL,
	`triggerType` enum('no_response','sla_warning','sla_breach') NOT NULL,
	`triggerValue` int NOT NULL,
	`actionType` enum('notify_approver','notify_escalation','notify_admin','add_approver','replace_approver','escalate_stage','auto_approve','auto_reject') NOT NULL,
	`actionConfig` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `escalationRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shiftAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shiftId` int NOT NULL,
	`userId` int NOT NULL,
	`roleInShift` varchar(100) NOT NULL,
	`isPrimary` boolean NOT NULL DEFAULT true,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shiftAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shiftDefinitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`daysOfWeek` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shiftDefinitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shiftSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`siteId` int,
	`timezone` varchar(50) NOT NULL DEFAULT 'Asia/Riyadh',
	`isDefault` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shiftSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stageApprovers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stageId` int NOT NULL,
	`approverType` enum('user','role','approval_role','group','group_role','hierarchy_level','dynamic_field','shift_assignment','manager_chain') NOT NULL,
	`approverReference` varchar(255),
	`approverConfig` json,
	`priority` int NOT NULL DEFAULT 0,
	`isBackup` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stageApprovers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userApprovalRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`approvalRoleId` int NOT NULL,
	`siteIds` json,
	`regionIds` json,
	`isPrimary` boolean NOT NULL DEFAULT true,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userApprovalRoles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowConditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`conditionType` enum('process_type','category','sub_category','site_id','region','zone_id','requester_group','requester_type','activity_risk','has_mop','has_mhv','visitor_count','time_range','request_duration','vip_visit') NOT NULL,
	`conditionOperator` enum('equals','not_equals','in','not_in','greater_than','less_than','between','contains','starts_with','is_null','is_not_null') NOT NULL,
	`conditionValue` json NOT NULL,
	`logicalGroup` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflowConditions_id` PRIMARY KEY(`id`)
);
