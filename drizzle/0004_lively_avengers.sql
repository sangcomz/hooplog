CREATE TABLE `Comment` (
	`id` text PRIMARY KEY NOT NULL,
	`gameId` text NOT NULL,
	`userId` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Score` (
	`id` text PRIMARY KEY NOT NULL,
	`gameId` text NOT NULL,
	`teamNumber` integer NOT NULL,
	`quarter` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Score_gameId_teamNumber_quarter_key` ON `Score` (`gameId`,`teamNumber`,`quarter`);