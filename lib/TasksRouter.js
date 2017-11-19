const BASE_URL = '/api/v1/:type';
const TASK_TYPES = ['daily', 'weekly', 'longterm'];

const errors = require('restify-errors');

const BadRequestError = errors.BadRequestError,
	NotFoundError = errors.NotFoundError,
	InternalServerError = errors.InternalServerError;

class TasksRouter {
	constructor(db) {
		this.db = db;
	}

	addTo(server) {
		server.use(this.typeCheck.bind(this));
		server.get(`${BASE_URL}`, this.get.bind(this));
		server.put(`${BASE_URL}/:id`, this.put.bind(this));
		server.post(`${BASE_URL}`, this.post.bind(this));
		server.del(`${BASE_URL}/:id`, this.del.bind(this));
		server.del(`${BASE_URL}/completed`, this.delCompleted.bind(this));
	}

	allExist(obj, ...fields) {
		for (const field of fields) {
			const val = obj[field];

			if (typeof val === 'undefined' || val === null) {
				return false;
			}
		}
		return true;
	}

	typeCheck(req, res, next) {
		if (TASK_TYPES.indexOf(req.params.type || '') < 0) {
			return next(new BadRequestError('Valid task type required.'));
		}
		next();
	}

	async get(req, res, next) {
		const tasks = await this.db.get(req.params.type);
		res.send({tasks});
		next();
	}

	async put(req, res, next) {
		if (!req.params.id || !this.allExist(req.body, 'name', 'completed')) {
			return next(new BadRequestError());
		}

		const task = {
			id: req.params.id,
			lastUpdate: new Date().toISOString(),
			name: req.body.name,
			completed: req.body.completed
		};

		const success = await this.db.update(req.params.type, task);
		if (!success) {
			return next(new NotFoundError());
		}
		res.send(task);
		next();
	}

	async post(req, res, next) {
		if (!this.allExist(req.body, 'name')) {
			return next(new BadRequestError());
		}

		const task = {
			lastUpdate: new Date().toISOString(),
			name: req.body.name,
			completed: false
		};

		const id = await this.db.insert(req.params.type, task);
		task.id = id;
		res.send(task);
		next();
	}

	async del(req, res, next) {
		if (!req.params.id) {
			return next(new BadRequestError());
		}

		const success = await this.db.del(req.params.type, {id: req.params.id});
		if (!success) {
			return next(new NotFoundError());
		}
		res.send(200);
		next();
	}

	async delCompleted(req, res, next) {
		await this.db.del(req.params.type, {completed: 1});

		const tasks = await this.db.get(req.params.type);
		res.send({tasks});
		next();
	}
}

module.exports = TasksRouter;
