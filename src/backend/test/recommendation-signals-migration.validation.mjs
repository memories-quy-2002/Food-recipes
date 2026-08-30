import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const migrations = [
  '20260830100000_add_recommendation_not_interested/migration.sql',
  '20260830110000_add_recommendation_meal_plan_removals/migration.sql',
];

for (const relative of migrations) {
  const sql = fs.readFileSync(path.join(root, 'prisma', 'migrations', relative), 'utf8');
  assert.match(sql, /FOREIGN KEY \("user_id"\) REFERENCES "accounts"\("user_id"\) ON DELETE CASCADE/);
  assert.match(sql, /FOREIGN KEY \("recipe_id"\) REFERENCES "recipes"\("recipe_id"\) ON DELETE CASCADE/);
}

console.log('Recommendation signal migrations have cascading user and recipe foreign keys.');
