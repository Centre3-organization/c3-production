CREATE TABLE `requestComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`instanceId` int,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`visibility` enum('private','group','requestor') NOT NULL DEFAULT 'private',
	`targetGroupId` int,
	`context` enum('approval','rejection','clarification','general','internal_note') NOT NULL DEFAULT 'general',
	`taskId` int,
	`isEdited` boolean DEFAULT false,
	`editedAt` timestamp,
	`isDeleted` boolean DEFAULT false,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requestComments_id` PRIMARY KEY(`id`)
);
