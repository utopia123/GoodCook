CREATE TABLE `condiments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'seasoning' NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_condiments_kind` ON `condiments` (`kind`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`ingredients` text DEFAULT '' NOT NULL,
	`steps` text DEFAULT '' NOT NULL,
	`minutes` integer,
	`difficulty` text DEFAULT 'easy' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_recipes_created` ON `recipes` (`created_at`);
--> statement-breakpoint
-- 内置 10 道家常热门菜（首次迁移时写入；删掉不会重复出现）
INSERT INTO `recipes` (`id`, `title`, `ingredients`, `steps`, `minutes`, `difficulty`, `created_by`, `created_at`) VALUES
('seed-tomato-egg', '番茄炒蛋', '番茄 2 个
鸡蛋 3 个
葱花 少许
糖 半勺
盐 适量', '番茄切块，鸡蛋加少许盐打散
热锅多油，倒入蛋液炒至凝固盛出
余油下番茄，加糖和盐炒出汁
倒回鸡蛋翻炒均匀，撒葱花出锅', 10, 'easy', NULL, unixepoch()),
('seed-braised-pork', '红烧肉', '五花肉 500g
冰糖 20g
生抽 2 勺
老抽 半勺
料酒 2 勺
姜片 3 片
八角 2 颗', '五花肉切块冷水下锅焯水，捞出沥干
冷锅下冰糖小火炒至枣红色
下肉块翻炒上色，加姜片八角
加料酒、生抽、老抽和热水没过肉
小火炖 60 分钟，大火收汁即可', 90, 'medium', NULL, unixepoch()),
('seed-pepper-pork', '青椒肉丝', '猪里脊 250g
青椒 3 个
蒜末 适量
生抽 1 勺
淀粉 1 勺
盐 适量', '肉切丝，加生抽淀粉抓匀腌 10 分钟
青椒去籽切丝
热油下肉丝滑散至变色盛出
底油爆香蒜末，下青椒丝炒至断生
倒回肉丝，加盐翻匀出锅', 20, 'easy', NULL, unixepoch()),
('seed-mapo-tofu', '麻婆豆腐', '嫩豆腐 1 盒
肉末 100g
郫县豆瓣 1 勺
花椒粉 适量
蒜末 适量
淀粉水 半碗', '豆腐切块，淡盐水中浸 5 分钟
热油炒香肉末，加豆瓣和蒜末炒出红油
加水烧开，下豆腐轻推煮 3 分钟
淋淀粉水勾芡至浓稠
撒花椒粉和葱花出锅', 20, 'easy', NULL, unixepoch()),
('seed-cola-wings', '可乐鸡翅', '鸡翅中 10 个
可乐 330ml
生抽 2 勺
姜片 3 片
料酒 1 勺', '鸡翅两面划刀，冷水下锅焯水
热锅少油，鸡翅煎至两面金黄
加姜片、料酒、生抽炒匀
倒入可乐没过鸡翅，中小火焖 20 分钟
大火收汁至浓稠亮泽', 40, 'easy', NULL, unixepoch()),
('seed-steamed-fish', '清蒸鲈鱼', '鲈鱼 1 条
姜丝 适量
葱段 适量
蒸鱼豉油 3 勺
料酒 1 勺', '鱼处理干净，两面划刀，抹料酒腌 10 分钟
盘底垫姜片葱段，放上鱼
水开上锅，大火蒸 8 分钟关火焖 2 分钟
倒掉盘中汤汁，铺新姜丝葱丝
淋蒸鱼豉油，浇一勺热油激香', 30, 'medium', NULL, unixepoch()),
('seed-garlic-broccoli', '蒜蓉西兰花', '西兰花 1 颗
蒜末 5 瓣
蚝油 1 勺
盐 适量', '西兰花切小朵，盐水泡 10 分钟洗净
水开加盐和几滴油，焯 1 分钟捞出过凉水
热油爆香蒜末
下西兰花大火翻炒
加蚝油和盐炒匀出锅', 10, 'easy', NULL, unixepoch()),
('seed-beef-potato', '土豆炖牛腩', '牛腩 500g
土豆 2 个
胡萝卜 1 根
洋葱 半个
生抽 2 勺
八角 2 颗
姜片 3 片', '牛腩切块冷水下锅焯水，撇去浮沫
热油炒香洋葱姜片八角
下牛腩翻炒，加生抽炒匀
加热水没过，小火炖 60 分钟
加土豆胡萝卜块再炖 25 分钟，收汁调味', 120, 'medium', NULL, unixepoch()),
('seed-vinegar-cabbage', '醋溜白菜', '白菜 半颗
干辣椒 3 个
蒜末 适量
香醋 2 勺
生抽 1 勺
糖 半勺', '白菜帮子斜刀片成薄片，叶子切段
热油爆香蒜末和干辣椒
先下白菜帮大火翻炒 1 分钟
下菜叶，加香醋、生抽、糖炒软
加盐调味，收汁出锅', 15, 'easy', NULL, unixepoch()),
('seed-wintermelon-ribs', '冬瓜排骨汤', '排骨 500g
冬瓜 400g
姜片 3 片
枸杞 少许
盐 适量', '排骨冷水下锅焯水，捞出冲净
砂锅加足量水和姜片，下排骨
大火烧开转小火炖 40 分钟
加冬瓜块再炖 15 分钟
加盐调味，撒枸杞出锅', 60, 'easy', NULL, unixepoch());
