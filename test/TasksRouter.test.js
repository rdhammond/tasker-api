const should = require('should'),
	errors = require('restify-errors'),
	sinon = require('sinon'),
	TasksRouter = require('../lib/TasksRouter');

require('should-sinon');

const BadRequestError = errors.BadRequestError;
const NotFoundError = errors.NotFoundError;

function next(err) {
	if (err)
		throw err;
}

describe('TasksRouter', function() {
	describe('#addTo', function() {
		var server;

		beforeEach(function() {
			server = sinon.mock({
				use: function() {},
				get: function() {},
				put: function() {},
				post: function() {},
				del: function() {}
			});
		});

		it('should hook local middleware', function() {
			server.expects('use').once();
			
			const router = new TasksRouter({});
			router.addTo(server.object);
			server.verify();
		});

		it('should add to server', function() {
			server.expects('get').once();
			server.expects('put').once();
			server.expects('post').once();
			server.expects('del').twice();

			const router = new TasksRouter({});
			router.addTo(server.object);
			server.verify();
		});
	});

	describe('#typeCheck', function() {
		var router;

		beforeEach(function() {
			router = new TasksRouter({});
		});

		it('should return error on empty type', function() {
			const req = {params: {type: ''}};
			should.throws(() => router.typeCheck(req, {}, next), BadRequestError);
		});

		it('should return error on null type', function() {
			const req = {params: {type: null}};
			should.throws(() => router.typeCheck(req, {}, next), BadRequestError);
		});

		it('should return error on undefined type', function() {
			const req = {params: {}};
			should.throws(() => router.typeCheck(req, {}, next), BadRequestError);
		});

		it('should return an error when type unknown', function() {
			const req = {params: {type: 'afjkdlajf'}};
			should.throws(() => router.typeCheck(req, {}, next), BadRequestError);
		});

		it('should pass if type known', function() {
			const req = {params: {type: 'daily'}};
			should.doesNotThrow(() => router.typeCheck(req, {}, next));
		});

		it('should be case sensitive', function() {
			const req = {params: {type: 'Daily'}};
			should.throws(() => router.typeCheck(req, {}, next), BadRequestError);
		});
	});

	describe('#get', async function() {
		it('should return tasks', async function() {
			const tasks = [];
			const db = {
				get: sinon.stub().resolves(tasks)
			};

			const router = new TasksRouter(db);
			const req = {params: {type: 'daily'}};
			const res = {send: sinon.stub()};
			await router.get(req, res, next);

			res.send.should.be.calledOnce();
			res.send.getCall(0).args[0].should.match({tasks});
		});
	});

	describe('#put', async function() {
		var req, res, db, router;

		beforeEach(function() {
			req = {
				params: {id: 1, type: 'daily'},
				body: {name: 'xyz', completed: false}
			};
			res = {send: sinon.stub()};
			db = {update: sinon.stub().resolves(true)};
			router = new TasksRouter(db);
		});

		it('should error if no id param', async function() {
			req.params = {};
			await router.put(req, res, next).should.be.rejectedWith(BadRequestError);
		});

		it('should error if name missing', async function() {
			delete req.body.name;
			await router.put(req, res, next).should.be.rejectedWith(BadRequestError);
		});

		it('should error if completed missing', async function() {
			delete req.body.completed;
			await router.put(req, res, next).should.be.rejectedWith(BadRequestError);
		});

		it('should error if update fails', async function() {
			const db = { update: sinon.stub().resolves(false) };
			const router = new TasksRouter(db);
			await router.put(req, res, next).should.be.rejectedWith(NotFoundError);
		});

		it('should update db on success', async function() {
			await router.put(req, res, next);
			db.update.should.be.calledOnce();
		});

		it('should return task on success', async function() {
			await router.put(req, res, next);
			res.send.should.be.calledOnce();

			const task = res.send.getCall(0).args[0];
			task.should.be.ok();
			task.id.should.eql(req.params.id);
			task.name.should.eql(req.body.name);
			task.lastUpdate.should.be.ok();
			task.completed.should.eql(req.body.completed);
		});

		it('should set timestamp on success', async function() {
			await router.put(req, res, next);
			res.send.should.be.calledOnce();
			
			const task = res.send.getCall(0).args[0];
			task.lastUpdate.should.be.ok();
			new Date(task.lastUpdate).should.be.Date;
		});
	});

	describe('#post', async function() {
		var req, res, db, router;

		beforeEach(function() {
			req = {
				params: {type: 'daily'},
				body: {name: 'test'}
			};
			res = {send: sinon.stub()};
			db = {insert: sinon.stub().resolves(1)};
			router = new TasksRouter(db);
		});

		it('should error if no name', async function() {
			delete req.body.name;
			await router.post(req, res, next).should.be.rejectedWith(BadRequestError);
		});

		it('should insert into the db', async function() {
			await router.post(req, res, next);
			db.insert.should.be.calledOnce();
		});

		it('should return new task', async function() {
			await router.post(req, res, next);
			res.send.should.be.calledOnce();

			const task = res.send.getCall(0).args[0];
			task.should.be.ok();
			task.id.should.be.ok();
			task.name.should.eql(req.body.name);
			task.lastUpdate.should.be.ok();
			task.completed.should.be.Boolean;
		});

		it('should set new id if successful', async function() {
			await router.post(req, res, next);
			res.send.should.be.calledOnce();

			const task = res.send.getCall(0).args[0];
			task.id.should.eql(1);
		});

		it('should default to completed false', async function() {
			await router.post(req, res, next);
			res.send.should.be.calledOnce();

			const task = res.send.getCall(0).args[0];
			task.completed.should.eql(false);
		});

		it('should set timestamp', async function() {
			await router.post(req, res, next);
			res.send.should.be.calledOnce();

			const task = res.send.getCall(0).args[0];
			new Date(task.lastUpdate).should.be.Date;
		});
	});
	
	describe('#del', async function() {
		var req, res, db, router;

		beforeEach(function() {
			req = {params: {type: 'daily', id: 1}};
			res = {send: sinon.stub()};
			db = {del: sinon.stub().returns(true)};
			router = new TasksRouter(db);
		});

		it('should error when id missing', async function() {
			delete req.params.id;
			await router.del(req, res, next).should.be.rejectedWith(BadRequestError);
		});

		it('should error if not found', async function() {
			const db = {del: sinon.stub().returns(false)};
			const router = new TasksRouter(db);
			await router.del(req, res, next).should.be.rejectedWith(NotFoundError);
		});

		it('should delete from database if successful', async function() {
			await router.del(req, res, next);
			db.del.should.be.calledOnce();
		});

		it('should return 200 if successful', async function() {
			await router.del(req, res, next);
			res.send.should.be.calledOnce();
			res.send.getCall(0).args[0].should.eql(200);
		});
	});

	describe('#delCompleted', async function() {
		var records, req, res, db;

		const resultTask = {
			id: 1,
			name: 'Test',
			completed: false,
			lastUpdate: new Date().toISOString()
		};

		beforeEach(function() {
			req = {params: {type: 'daily'}};
			res = {send: sinon.stub()};
			db = {
				get: sinon.stub().returns([resultTask]),
				del: sinon.stub()
			};
			router = new TasksRouter(db);
		});

		it('should remove completed items from the database', async function() {
			await router.delCompleted(req, res, next);
			db.del.should.be.calledOnce();
			db.del.should.be.calledWithExactly('daily', {completed: 1});
		});

		it('should return remaining tasks', async function() {
			await router.delCompleted(req, res, next);
			res.send.should.be.calledOnce();

			const result = res.send.getCall(0).args[0];
			result.tasks.should.be.Array();
			result.tasks.length.should.eql(1);
			result.tasks[0].should.deepEqual(resultTask);
		});
	});
});
