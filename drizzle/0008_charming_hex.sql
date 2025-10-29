CREATE TABLE `EventGameComment` (
	`id` text PRIMARY KEY NOT NULL,
	`eventGameId` text NOT NULL,
	`userId` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`eventGameId`) REFERENCES `EventGame`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `EventGame` (
	`id` text PRIMARY KEY NOT NULL,
	`teamId` text NOT NULL,
	`title` text NOT NULL,
	`scoreA` integer DEFAULT 0 NOT NULL,
	`scoreB` integer DEFAULT 0 NOT NULL,
	`playerA` text NOT NULL,
	`playerB` text NOT NULL,
	`type` text DEFAULT 'single' NOT NULL,
	`quarters` text,
	`comment` text,
	`gameId` text,
	`createdById` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
