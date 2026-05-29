SELECT id, name FROM categories WHERE type = 'SECTOR' AND "parentId" IS NULL LIMIT 5;
SELECT id, name FROM categories WHERE type = 'CATEGORY' LIMIT 5;
SELECT id, name FROM cities LIMIT 5;
