const TYPES = ['daily', 'weekly', 'longterm'];

const sqlite = require('sqlite');

class TasksDb {
	async open(config) {
		this.sqlite = await sqlite.open(config.sqlite, {Promise, cached: true});
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

	async del(type, match) {
		if (!match) {
			return new Error('Safety feature: can\'t delete without criteria');
		}

		const columns = [],
			vars = [];

		for (const key in match) {
			columns.push(key !== 'id' ? key : 'rowid');
			vars.push(match[key]);
		}

		const where = columns.map(x => `${x} = ?`).join(' AND ');
		const results = await this.sqlite.run(`DELETE FROM ${type} WHERE ${where}`, vars);
		return results.changes > 0;
	}
}

module.exports = TasksDb;
