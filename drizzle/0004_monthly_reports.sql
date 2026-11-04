CREATE TABLE `monthly_reports` (
	`month` text PRIMARY KEY NOT NULL,
	`meals` integer DEFAULT 0 NOT NULL,
	`orders` integer DEFAULT 0 NOT NULL,
	`top_dishes` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
