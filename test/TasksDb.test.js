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

	// ** PICK UP HERE
});
