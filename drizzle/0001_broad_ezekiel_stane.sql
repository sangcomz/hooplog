CREATE TABLE `Attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`gameId` text NOT NULL,
	`userId` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Attendance_gameId_userId_key` ON `Attendance` (`gameId`,`userId`);--> statement-breakpoint
CREATE TABLE `Game` (
	`id` text PRIMARY KEY NOT NULL,
	`teamId` text NOT NULL,
	`creatorId` text NOT NULL,
	`date` integer NOT NULL,
	`location` text,
	`description` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
