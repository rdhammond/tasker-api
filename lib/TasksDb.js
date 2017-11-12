const TYPES = ['daily', 'weekly', 'longterm'];

class TasksDb {
	constructor(config) {
		this.sqlite = sqlite.open(config.sqlite, {Promise, cached: true});
	}

	checkType(type) {
		return TYPES.indexOf(type) < 0;
	}

	async get(type) {
		const results = await this.sqlite.all(`SELECT rowid as id, lastUpdated, name, completed FROM ${type}`);

		return results.map(x => {
			x.completed = (x.completed !== 0);
			return x;
		});
	}

	async update(type, task) {
		const {id, lastUpdated, name} = task;
		const completed = task.completed ? 1 : 0;

		const results = await this.sqlite.run(
			`UPDATE ${type} SET lastUpdated = ?, name = ?, completed = ? WHERE rowid = ?`,
			[lastUpdated, name, completed, id]
		);
		return results.changes > 0;
	}

	async insert(type, task) {
		const {lastUpdated, name} = task;
		const completed = task.completed ? 1 : 0;

		const results = await this.sqlite.run(
			`INSERT INTO ${type}(lastUpdated, name, completed) VALUES(?, ?, ?)`,
			[lastUpdated, name, completed]
		);
		return results.lastID;
	}

	async del(type, id) {
		const results = await this.sqlite.run(`DELETE FROM ${type} WHERE rowid = ?`, id);
		return results.changes > 0;
	}

	custom(str, ...params) {
		return this.sqlite.run(str, ...params);
	}
}

module.exports = TasksDb;