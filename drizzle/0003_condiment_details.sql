ALTER TABLE `condiments` ADD `effect` text;--> statement-breakpoint
ALTER TABLE `condiments` ADD `good_with` text;--> statement-breakpoint
ALTER TABLE `condiments` ADD `avoid_with` text;
--> statement-breakpoint
-- 预置常用佐料 / 香料 / 调味料（含功效与宜忌）
INSERT INTO `condiments` (`id`, `name`, `kind`, `note`, `effect`, `good_with`, `avoid_with`, `created_at`) VALUES
('seed-c-1','大蒜','aromatic',NULL,'杀菌、去腥增香、提味','炒青菜、红烧、凉拌、蒜蓉粉丝','清淡海鲜（容易抢味）',unixepoch()),
('seed-c-2','生姜','aromatic',NULL,'去腥、驱寒、和胃','炖肉、蒸鱼、煮汤','清炒嫩叶菜（易焦苦）',unixepoch()),
('seed-c-3','大葱','aromatic',NULL,'增香、发汗、去腥','爆炒、烧菜、蘸酱','清淡汤品（味道冲）',unixepoch()),
('seed-c-4','小米辣','aromatic',NULL,'增辣提味、开胃','水煮菜、小炒肉、凉拌','清蒸海鲜、给老人小孩的菜',unixepoch()),
('seed-c-5','香菜','aromatic',NULL,'提香解腻、点缀','汤、凉菜、面食收尾','有人不吃，建议单独上桌',unixepoch()),
('seed-c-6','花椒','spice',NULL,'麻香、去腥、温中散寒','麻婆豆腐、水煮鱼、卤味','清蒸鱼（抢鲜味）',unixepoch()),
('seed-c-7','黑胡椒','spice',NULL,'增香提味、暖胃','煎牛排、炒蛋、西式汤','清蒸菜、清汤',unixepoch()),
('seed-c-8','八角','spice',NULL,'增香、去腥','红烧肉、卤味、炖牛腩','清汤、炒青菜（药味重）',unixepoch()),
('seed-c-9','桂皮','spice',NULL,'增香、暖胃','卤味、红烧、甜汤','清炒、海鲜',unixepoch()),
('seed-c-10','香叶','spice',NULL,'增香、去腥','卤煮、炖肉','放多了会发苦，清淡菜不放',unixepoch()),
('seed-c-11','孜然','spice',NULL,'去膻增香','羊肉、烤串、土豆','清蒸、清淡汤品',unixepoch()),
('seed-c-12','五香粉','spice',NULL,'复合香气、去腥增味','卤味、炸物腌料','清炒时蔬（味重）',unixepoch()),
('seed-c-13','生抽','seasoning',NULL,'提鲜、提供咸味','炒菜、凉拌、腌制','想上色的红烧菜（色浅）',unixepoch()),
('seed-c-14','老抽','seasoning',NULL,'上色、酱香','红烧、卤味、焖菜','凉拌、清炒（容易发黑）',unixepoch()),
('seed-c-15','料酒','seasoning',NULL,'去腥、解腻','肉类焯水、腌鱼、烧菜','素菜、凉菜',unixepoch()),
('seed-c-16','香醋','seasoning',NULL,'解腻、开胃、提酸香','糖醋菜、凉拌、醋溜','绿叶菜久煮（易发黄）',unixepoch()),
('seed-c-17','蚝油','seasoning',NULL,'提鲜、增稠挂汁','炒青菜、焖菜、拌馅','高温久炒（失鲜味）',unixepoch()),
('seed-c-18','盐','seasoning',NULL,'基础咸味、提升鲜味','几乎所有菜','出锅前再补，避免过咸',unixepoch()),
('seed-c-19','白糖','seasoning',NULL,'提鲜、中和咸酸、炒糖色','红烧、糖醋、凉拌','不需要甜味的清汤',unixepoch()),
('seed-c-20','豆瓣酱','seasoning',NULL,'增香提色、咸鲜微辣','回锅肉、麻婆豆腐、水煮菜','清淡菜（过咸过辣）',unixepoch());
