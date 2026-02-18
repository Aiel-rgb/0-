CREATE TABLE `dailyTaskCompletions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dailyTaskId` int NOT NULL,
	`completedDate` varchar(10) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyTaskCompletions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`emoji` varchar(8) NOT NULL DEFAULT '✅',
	`xpReward` int NOT NULL DEFAULT 50,
	`goldReward` int NOT NULL DEFAULT 25,
	`category` varchar(64) NOT NULL DEFAULT 'health',
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyTasks_id` PRIMARY KEY(`id`)
);
