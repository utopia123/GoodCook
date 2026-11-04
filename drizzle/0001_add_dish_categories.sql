CREATE TABLE `dish_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dish_categories_name_unique` ON `dish_categories` (`name`);--> statement-breakpoint
CREATE INDEX `idx_dish_categories_order` ON `dish_categories` (`sort_order`);--> statement-breakpoint
ALTER TABLE `dishes` ADD `category_id` text REFERENCES dish_categories(id);--> statement-breakpoint
CREATE INDEX `idx_dishes_category` ON `dishes` (`category_id`);