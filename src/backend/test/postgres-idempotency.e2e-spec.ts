import { Prisma } from '../src/generated/prisma/client';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { CookingSessionRepository } from '../src/modules/cooking-history/cooking-session.repository';
import { PlanningRepository } from '../src/modules/planning/planning.repository';

const databaseUrl = process.env.FOOD_RECIPES_POSTGRES_TEST_URL;
const shouldRunAgainstPostgres = (() => {
	if (!databaseUrl) return false;
	try {
		const parsed = new URL(databaseUrl);
		return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) && parsed.pathname.toLowerCase().includes('test');
	} catch {
		return false;
	}
})();

type Fixture = { userId: number; otherUserId?: number; categoryId: number; mealId: number; recipeId: number; pantryId: number };

const suite = shouldRunAgainstPostgres ? describe : describe.skip;

suite('PostgreSQL write idempotency', () => {
	let prisma: PrismaService;
	let planning: PlanningRepository;
	let cooking: CookingSessionRepository;
	const fixtures: Fixture[] = [];
	const originalDatabaseUrl = process.env.DATABASE_URL;
	const testTag = `concurrency-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

	beforeAll(async () => {
		if (!databaseUrl) throw new Error('Set FOOD_RECIPES_POSTGRES_TEST_URL to a loopback PostgreSQL database with "test" in its database name.');
		process.env.DATABASE_URL = databaseUrl;
		prisma = new PrismaService();
		planning = new PlanningRepository(prisma);
		cooking = new CookingSessionRepository(prisma);
		await prisma.$queryRaw(Prisma.sql`SELECT 1 FROM accounts LIMIT 1`);
		await prisma.$queryRaw(Prisma.sql`SELECT 1 FROM cooking_sessions LIMIT 1`);
	});

	afterEach(async () => {
		const fixture = fixtures.pop();
		if (!fixture || !prisma) return;
		await prisma.$executeRaw(Prisma.sql`DROP TRIGGER IF EXISTS reject_test_recipe_shopping_insert ON shopping_list_items`);
		await prisma.$executeRaw(Prisma.sql`DROP FUNCTION IF EXISTS reject_test_recipe_shopping_insert()`);
		await prisma.$executeRaw(Prisma.sql`DROP TRIGGER IF EXISTS reject_test_cooking_history_insert ON cooking_history`);
		await prisma.$executeRaw(Prisma.sql`DROP FUNCTION IF EXISTS reject_test_cooking_history_insert()`);
		if (fixture.otherUserId) await prisma.$executeRaw(Prisma.sql`DELETE FROM accounts WHERE user_id = ${fixture.otherUserId}`);
		await prisma.$executeRaw(Prisma.sql`DELETE FROM recipes WHERE recipe_id = ${fixture.recipeId}`);
		await prisma.$executeRaw(Prisma.sql`DELETE FROM pantry_items WHERE pantry_id = ${fixture.pantryId}`);
		await prisma.$executeRaw(Prisma.sql`DELETE FROM accounts WHERE user_id = ${fixture.userId}`);
		await prisma.$executeRaw(Prisma.sql`DELETE FROM categories WHERE category_id = ${fixture.categoryId}`);
		await prisma.$executeRaw(Prisma.sql`DELETE FROM meals WHERE meal_id = ${fixture.mealId}`);
	});

	afterAll(async () => {
		if (prisma) await prisma.$disconnect();
		if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
		else process.env.DATABASE_URL = originalDatabaseUrl;
	});

	const createFixture = async (pantryQuantity: number): Promise<Fixture> => {
		const users = await prisma.$queryRaw<{ user_id: number }[]>(Prisma.sql`
			INSERT INTO accounts (full_name, password, email, created_on)
			VALUES ('Concurrency test', 'not-a-login-password', ${`${testTag}-${fixtures.length}@example.test`}, CURRENT_TIMESTAMP)
			RETURNING user_id
		`);
		const categories = await prisma.$queryRaw<{ category_id: number }[]>(Prisma.sql`
			INSERT INTO categories (category_name) VALUES (${`${testTag} category`}) RETURNING category_id
		`);
		const meals = await prisma.$queryRaw<{ meal_id: number }[]>(Prisma.sql`
			INSERT INTO meals (meal_name, meal_description) VALUES (${`${testTag} meal`}, 'PostgreSQL concurrency fixture') RETURNING meal_id
		`);
		const recipes = await prisma.$queryRaw<{ recipe_id: number }[]>(Prisma.sql`
			INSERT INTO recipes (recipe_name, meal_id, category_id, prep_time, cook_time, user_id, ingredients, instructions, status)
			VALUES (${`${testTag} recipe ${fixtures.length}`}, ${meals[0].meal_id}, ${categories[0].category_id}, INTERVAL '1 minute', INTERVAL '1 minute', ${users[0].user_id}, ARRAY['rice'], ARRAY['Cook rice'], 'published')
			RETURNING recipe_id
		`);
		await prisma.$executeRaw(Prisma.sql`
			INSERT INTO recipe_ingredients (recipe_id, position, quantity, unit, name)
			VALUES (${recipes[0].recipe_id}, 1, 2, 'GRAM', 'rice')
		`);
		const pantryItems = await prisma.$queryRaw<{ pantry_id: number }[]>(Prisma.sql`
			INSERT INTO pantry_items (user_id, name, have, quantity, unit)
			VALUES (${users[0].user_id}, 'rice', TRUE, ${pantryQuantity}, 'GRAM')
			RETURNING pantry_id
		`);
		const fixture = {
			userId: Number(users[0].user_id),
			categoryId: Number(categories[0].category_id),
			mealId: Number(meals[0].meal_id),
			recipeId: Number(recipes[0].recipe_id),
			pantryId: Number(pantryItems[0].pantry_id),
		};
		fixtures.push(fixture);
		return fixture;
	};

	it('does not add duplicate shopping rows when two tabs confirm the same recipe together', async () => {
		const fixture = await createFixture(0);
		const results = await Promise.all([
			planning.addPreparedRecipeIngredients(fixture.userId, fixture.recipeId, 1),
			planning.addPreparedRecipeIngredients(fixture.userId, fixture.recipeId, 1),
		]);
		const rows = await prisma.$queryRaw<Array<{ item_id: number }>>(Prisma.sql`
			SELECT item_id FROM shopping_list_items
			WHERE user_id = ${fixture.userId} AND source_recipe_id = ${fixture.recipeId} AND checked = FALSE
		`);

		expect(results.reduce((sum, result) => sum + (result?.added_shopping_items ?? 0), 0)).toBe(1);
		expect(rows).toHaveLength(1);
	});

	it('keeps identical ingredient names separate when the required units differ', async () => {
		const fixture = await createFixture(0);
		await prisma.$executeRaw(Prisma.sql`
			INSERT INTO recipe_ingredients (recipe_id, position, quantity, unit, name)
			VALUES (${fixture.recipeId}, 2, 1, 'PIECE', 'rice')
		`);

		const result = await planning.addPreparedRecipeIngredients(fixture.userId, fixture.recipeId, 1);
		const rows = await prisma.$queryRaw<Array<{ quantity: string | null }>>(Prisma.sql`
			SELECT quantity FROM shopping_list_items
			WHERE user_id = ${fixture.userId} AND source_recipe_id = ${fixture.recipeId} AND checked = FALSE
			ORDER BY quantity
		`);

		expect(result?.added_shopping_items).toBe(2);
		expect(rows.map(({ quantity }) => quantity)).toEqual(['1 piece', '2 g']);
	});

	it('preserves a matching manual shopping item instead of replacing it with a recipe line', async () => {
		const fixture = await createFixture(0);
		const manualRows = await prisma.$queryRaw<{ item_id: number }[]>(Prisma.sql`
			INSERT INTO shopping_list_items (user_id, label, quantity, checked)
			VALUES (${fixture.userId}, 'Rice', '2 g', FALSE)
			RETURNING item_id
		`);

		const result = await planning.addPreparedRecipeIngredients(fixture.userId, fixture.recipeId, 1);
		const rows = await prisma.$queryRaw<Array<{ item_id: number; label: string; source_recipe_id: number | null; checked: boolean }>>(Prisma.sql`
			SELECT item_id, label, source_recipe_id, checked FROM shopping_list_items
			WHERE user_id = ${fixture.userId}
		`);

		expect(result?.added_shopping_items).toBe(0);
		expect(rows).toEqual([{ item_id: manualRows[0].item_id, label: 'Rice', source_recipe_id: null, checked: false }]);
	});

	it('recalculates from current pantry stock when confirmation follows an old preview', async () => {
		const fixture = await createFixture(0);
		const preview = await planning.prepareRecipeIngredients(fixture.userId, fixture.recipeId, 1);
		expect(preview?.ingredients[0]).toMatchObject({ status: 'missing', missing_quantity: 2 });
		await prisma.$executeRaw(Prisma.sql`UPDATE pantry_items SET quantity = 2 WHERE pantry_id = ${fixture.pantryId}`);

		const confirmed = await planning.addPreparedRecipeIngredients(fixture.userId, fixture.recipeId, 1);
		const rows = await prisma.$queryRaw<Array<{ item_id: number }>>(Prisma.sql`SELECT item_id FROM shopping_list_items WHERE user_id = ${fixture.userId}`);

		expect(confirmed?.ingredients[0]).toMatchObject({ status: 'available', missing_quantity: 0 });
		expect(confirmed?.added_shopping_items).toBe(0);
		expect(rows).toHaveLength(0);
	});

	it('rolls back earlier shopping inserts when a later ingredient insert fails', async () => {
		const fixture = await createFixture(0);
		await prisma.$executeRaw(Prisma.sql`
			INSERT INTO recipe_ingredients (recipe_id, position, quantity, unit, name)
			VALUES (${fixture.recipeId}, 2, 1, 'GRAM', 'beans')
		`);
		await prisma.$executeRaw(Prisma.sql`
			CREATE FUNCTION reject_test_recipe_shopping_insert() RETURNS trigger LANGUAGE plpgsql AS $$
			BEGIN
				IF NEW.source_recipe_id IS NOT NULL AND LOWER(NEW.label) = 'rice' THEN
					RAISE EXCEPTION 'forced test failure' USING ERRCODE = '23514';
				END IF;
				RETURN NEW;
			END;
			$$
		`);
		await prisma.$executeRaw(Prisma.sql`
			CREATE TRIGGER reject_test_recipe_shopping_insert
			BEFORE INSERT ON shopping_list_items
			FOR EACH ROW EXECUTE FUNCTION reject_test_recipe_shopping_insert()
		`);

		await expect(planning.addPreparedRecipeIngredients(fixture.userId, fixture.recipeId, 1)).rejects.toThrow('forced test failure');
		const rows = await prisma.$queryRaw<Array<{ item_id: number }>>(Prisma.sql`
			SELECT item_id FROM shopping_list_items
			WHERE user_id = ${fixture.userId} AND source_recipe_id = ${fixture.recipeId}
		`);
		expect(rows).toHaveLength(0);
	});

	it('does not duplicate history or pantry deductions when completion is concurrent and retried', async () => {
		const fixture = await createFixture(5);
		const startedAt = new Date(Date.now() - 60_000);
		const sessions = await prisma.$queryRaw<{ session_id: number }[]>(Prisma.sql`
			INSERT INTO cooking_sessions (user_id, recipe_id, servings, current_step, status, started_at, last_active_at)
			VALUES (${fixture.userId}, ${fixture.recipeId}, 1, 0, 'active', ${startedAt}, CURRENT_TIMESTAMP)
			RETURNING session_id
		`);
		const sessionId = Number(sessions[0].session_id);

		const [firstResponse, simultaneousRetry] = await Promise.all([
			cooking.complete(fixture.userId, sessionId, 'complete'),
			cooking.complete(fixture.userId, sessionId, 'complete'),
		]);
		const lostResponseRetry = await cooking.complete(fixture.userId, sessionId, 'complete');
		const history = await prisma.$queryRaw<Array<{ history_id: number }>>(Prisma.sql`
			SELECT history_id FROM cooking_history WHERE user_id = ${fixture.userId} AND recipe_id = ${fixture.recipeId}
		`);
		const usage = await prisma.$queryRaw<Array<{ usage_id: number }>>(Prisma.sql`
			SELECT usage_id FROM cooking_ingredient_usage WHERE user_id = ${fixture.userId} AND ingredient_name = 'rice'
		`);
		const pantry = await prisma.$queryRaw<Array<{ quantity: number | string }>>(Prisma.sql`
			SELECT quantity FROM pantry_items WHERE pantry_id = ${fixture.pantryId}
		`);

		expect([firstResponse, simultaneousRetry].filter(Boolean)).toHaveLength(1);
		expect(firstResponse ?? simultaneousRetry).toMatchObject({ history: { recipe_id: fixture.recipeId } });
		expect(lostResponseRetry).toBeNull();
		expect(history).toHaveLength(1);
		expect(usage).toHaveLength(1);
		expect(Number(pantry[0].quantity)).toBe(3);
	});

	it('does not allow another user to complete or consume a cooking session', async () => {
		const fixture = await createFixture(5);
		const otherUsers = await prisma.$queryRaw<{ user_id: number }[]>(Prisma.sql`
			INSERT INTO accounts (full_name, password, email, created_on)
			VALUES ('Other test user', 'not-a-login-password', ${`${testTag}-other@example.test`}, CURRENT_TIMESTAMP)
			RETURNING user_id
		`);
		fixture.otherUserId = Number(otherUsers[0].user_id);
		const sessions = await prisma.$queryRaw<{ session_id: number }[]>(Prisma.sql`
			INSERT INTO cooking_sessions (user_id, recipe_id, servings, current_step, status, started_at, last_active_at)
			VALUES (${fixture.userId}, ${fixture.recipeId}, 1, 0, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			RETURNING session_id
		`);

		await expect(cooking.complete(fixture.otherUserId, Number(sessions[0].session_id), 'complete')).resolves.toBeNull();
		const session = await prisma.$queryRaw<Array<{ status: string }>>(Prisma.sql`SELECT status FROM cooking_sessions WHERE session_id = ${sessions[0].session_id}`);
		const pantry = await prisma.$queryRaw<Array<{ quantity: number | string }>>(Prisma.sql`SELECT quantity FROM pantry_items WHERE pantry_id = ${fixture.pantryId}`);
		expect(session[0].status).toBe('active');
		expect(Number(pantry[0].quantity)).toBe(5);
	});

	it('rolls back session and pantry writes when cooking history cannot be recorded', async () => {
		const fixture = await createFixture(5);
		const sessions = await prisma.$queryRaw<{ session_id: number }[]>(Prisma.sql`
			INSERT INTO cooking_sessions (user_id, recipe_id, servings, current_step, status, started_at, last_active_at)
			VALUES (${fixture.userId}, ${fixture.recipeId}, 1, 0, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			RETURNING session_id
		`);
		const sessionId = Number(sessions[0].session_id);
		await prisma.$executeRaw(Prisma.sql`
			CREATE FUNCTION reject_test_cooking_history_insert() RETURNS trigger LANGUAGE plpgsql AS $$
			BEGIN
				RAISE EXCEPTION 'forced history failure' USING ERRCODE = '23514';
			END;
			$$
		`);
		await prisma.$executeRaw(Prisma.sql`
			CREATE TRIGGER reject_test_cooking_history_insert
			BEFORE INSERT ON cooking_history
			FOR EACH ROW EXECUTE FUNCTION reject_test_cooking_history_insert()
		`);

		await expect(cooking.complete(fixture.userId, sessionId, 'complete')).rejects.toThrow('forced history failure');
		const failedAttempt = await prisma.$queryRaw<Array<{ status: string; quantity: number | string }>>(Prisma.sql`
			SELECT s.status, p.quantity
			FROM cooking_sessions s
			JOIN pantry_items p ON p.pantry_id = ${fixture.pantryId}
			WHERE s.session_id = ${sessionId}
		`);
		const failedHistory = await prisma.$queryRaw<Array<{ history_id: number }>>(Prisma.sql`SELECT history_id FROM cooking_history WHERE user_id = ${fixture.userId}`);
		expect(failedAttempt[0].status).toBe('active');
		expect(Number(failedAttempt[0].quantity)).toBe(5);
		expect(failedHistory).toHaveLength(0);

		await prisma.$executeRaw(Prisma.sql`DROP TRIGGER reject_test_cooking_history_insert ON cooking_history`);
		await prisma.$executeRaw(Prisma.sql`DROP FUNCTION reject_test_cooking_history_insert()`);
		await expect(cooking.complete(fixture.userId, sessionId, 'complete')).resolves.toMatchObject({ history: { recipe_id: fixture.recipeId } });
		const successfulPantry = await prisma.$queryRaw<Array<{ quantity: number | string }>>(Prisma.sql`SELECT quantity FROM pantry_items WHERE pantry_id = ${fixture.pantryId}`);
		expect(Number(successfulPantry[0].quantity)).toBe(3);
	});
});
