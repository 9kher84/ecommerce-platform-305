SELECT id, name_en FROM "Categories" WHERE type::text = 'SECTOR' AND "parentId" IS NULL LIMIT 2;
SELECT id, name_en FROM "Categories" WHERE type::text = 'CATEGORY' LIMIT 2;
SELECT id, name FROM cities LIMIT 2;
