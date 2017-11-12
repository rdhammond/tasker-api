const BASE_URL = '/api/v1/:type';

const restify = require('restify');

const BadRequestError = restify.errors.BadRequestError,
	NotFoundError = restify.errors.NotFoundError,
	InternalServerError = restify.errors.InternalServerError;

class TasksRouter {
	constructor(db) {
		// Note that our custom DB object will scrub types for
		// us to prevent injection attacks.
		//
		this.db = db;
	}

	addTo(apiServer) {
		const server = apiServer.server;
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
		if (!req.params.type) {
			return next(new BadRequestError('Task type required.'));
		}
	}

	async get(req, res, next) {
		const tasks = await db.get(req.params.type);
		res.send({tasks});
		next();
	}

	async put(req, res, next) {
		if (!this.params.id || !this.allExist(req.body, 'name', 'completed')) {
			return next(new BadRequestError());
		}

		const task = {
			id: this.params.id,
			lastUpdate: new Date().toISOString(),
			name: req.body.name,
			completed: req.body.completed
		};

		const success = await db.update(req.params.type, task);
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

		const id = await db.insert(req.params.type, task);
		task.id = id;
		res.send(task);
		next();
	}

	async del(req, res, next) {
		if (!this.params.id) {
			return next(new BadRequestError());
		}

		const success = await db.del(req.params.type, req.params.id);
		if (!success) {
			return next(new NotFoundError());
		}
		res.send(200);
		next();
	}

	async delCompleted(req, res, next) {
		await db.custom(`DELETE FROM ${req.params.type} WHERE completed = 1`);

		const tasks = await db.get(req.params.type);
		res.send({tasks});
		next();
	}
}

module.exports = TasksRouter;
