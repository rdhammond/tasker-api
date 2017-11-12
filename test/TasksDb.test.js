const DB_PATH = `${__dirname}/test.sqlite`;

const should = require('should'),
	sqlite = require('sqlite'),
	fs = require('fs'),
	TasksDb = require('../lib/TasksDb');

const testEntries = [
	{name: 'Test1', completed: 1},
	{name: 'Test2', completed: 0},
	{name: 'Test3', completed: 1}
];

var db;

async function loadEntries() {
	const statement = await sqlite.prepare('INSERT INTO daily(lastUpdated, name, completed) VALUES(?, ?, ?);');

	testEntries.forEach(async x => {
		const {name, completed} = x;
		await statement.run(new Date().toISOString(), name, completed);
	});
	await statement.finalize();
}

function clearEntries() {
	return sqlite.run('DELETE FROM daily');
}

describe('TasksDb', function() {
	before(async function() {
		await sqlite.open(DB_PATH, {Promise, cached: true});

		await sqlite.migrate({
			force: true,
			migrationsPath: `${__dirname}/../migrations`
		});
	});

	after(async function() {
		await sqlite.close();
		fs.unlinkSync(DB_PATH);
	});

	describe('#open', function() {
		it('should open successfully', async function() {
			const db = new TasksDb();
			await db.open({sqlite: DB_PATH});
			db.sqlite.should.be.ok();
		});
	});

	describe('#get', function() {
		before(loadEntries);
		after(clearEntries);

		beforeEach(async function() {
			db = new TasksDb();
			await db.open({sqlite: DB_PATH});
		});

		it('should reject unknown types', function() {
			return db.get('blargh').should.be.rejected();
		});

		it('should fetch for a given type', async function() {
			const items = await db.get('daily');
			items.length.should.eql(testEntries.length);

			const names = items.map(x => x.name);
			testEntries.forEach(x => names.should.matchAny(x.name));
		});

		it('should convert completed to boolean', async function() {
			const items = await db.get('daily');
			items.forEach(x => x.completed.should.be.type('boolean'));
		});
	});

	describe('#update', function() {
		var id;

		beforeEach(loadEntries);
		afterEach(clearEntries);

		beforeEach(async function() {
			db = new TasksDb();
			await db.open({sqlite: DB_PATH});
			id = (await sqlite.get('SELECT rowid FROM daily WHERE name = \'Test1\'')).rowid;
		});

		it('should return true if found', async function() {
			const result = await db.update('daily', {
				id,
				lastUpdated: new Date().toISOString(),
				name: 'Test Change',
				completed: true
			});
			result.should.be.ok();
		});

		it('should return false if not found', async function() {
			const result = await db.update('daily', {
				id: 'ajkldfjl9',
				lastUpdated: new Date().toISOString(),
				name: 'Test Change',
				completed: true
			});
			result.should.not.be.ok();
		});

		it('should update', async function() {
			const now = new Date().toISOString();

			await db.update('daily', {
				id,
				lastUpdated: now,
				name: 'Test Change',
				completed: false
			});

			const result = await sqlite.get('SELECT rowid, lastUpdated, name, completed FROM daily WHERE rowid = ?', id);
			result.rowid.should.eql(id);
			result.lastUpdated.should.eql(now);
			result.name.should.eql('Test Change');
		});

		it('should convert completed true to 1', async function() {
			await db.update('daily', {
				id,
				lastUpdated: new Date().toISOString(),
				name: 'Test Change',
				completed: true
			});

			const result = await sqlite.get('SELECT * FROM daily WHERE rowid = ?', id);
			result.completed.should.eql(1);
		});

		it('should convert completed false to 0', async function() {
			await db.update('daily', {
				id,
				lastUpdated: new Date().toISOString(),
				name: 'Test Change',
				completed: false
			});

			const result = await sqlite.get('SELECT * FROM daily WHERE rowid = ?', id);
			result.completed.should.eql(0);
		});
	});

	describe('#insert', function() {
		afterEach(clearEntries);

		beforeEach(async function() {
			db = new TasksDb();
			await db.open({sqlite: DB_PATH});
		});

		it('should return id on insert', async function() {
			const result = await db.insert('daily', {
				lastUpdated: new Date().toISOString(),
				name: 'New Name',
				completed: false
			});

			const realId = (await sqlite.get('SELECT rowid FROM daily')).rowid;
			result.should.eql(realId);
		});

		it('should add new row', async function() {
			const now = new Date().toISOString();

			await db.insert('daily', {
				lastUpdated: now,
				name: 'New Name',
				completed: false
			});
			
			const result = await sqlite.get('SELECT lastUpdated, name FROM daily');
			result.lastUpdated.should.eql(now);
			result.name.should.eql('New Name');
		});

		it('should convert completed true to 1', async function() {
			await db.insert('daily', {
				lastUpdated: new Date().toISOString(),
				name: 'New Name',
				completed: true
			});

			const result = await sqlite.get('SELECT completed FROM daily');
			result.completed.should.equal(1);
		});

		it('should convert completed false to 0', async function() {
			await db.insert('daily', {
				lastUpdated: new Date().toISOString(),
				name: 'New Name',
				completed: false
			});

			const result = await sqlite.get('SELECT completed FROM daily');
			result.completed.should.eql(0);
		});
	});

	describe('#del', function() {
		var id;

		beforeEach(loadEntries);
		afterEach(clearEntries);

		beforeEach(async function() {
			db = new TasksDb();
			await db.open({sqlite: DB_PATH});
			id = (await sqlite.get('SELECT rowid FROM daily WHERE name = \'Test1\'')).rowid;
		});

		it('should return true if found', async function() {
			const result = await db.del('daily', {id});
			result.should.be.ok();
		});

		it('should return false if not found', async function() {
			const result = await db.del('daily', {id: 'djkslj3lf'});
			result.should.not.be.ok();
		});

		it('should remove row on success', async function() {
			await db.del('daily', {id});
			const result = await sqlite.get('SELECT * FROM daily WHERE name = \'Test 1\'');
			should(result).not.be.ok();
		});

		it('should handle unusual criteria', async function() {
			await db.del('daily', {completed: 0});

			const completeCnt = testEntries.reduce((sum,x) => x.completed);
			const result = await sqlite.run('SELECT COUNT(*) as cnt FROM daily');
			result.changes.should.eql(completeCnt);
		});
	});
});
