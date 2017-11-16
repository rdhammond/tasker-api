const should = require('should'),
	errors = require('restify-errors'),
	sinon = require('sinon'),
	TasksRouter = require('../lib/TasksRouter');

const BadRequestError = errors.BadRequestError;

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
		it('should return error on empty type', function() {
			const router = new TasksRouter({});
			const req = {params: {type: ''}};
			should.throws(() => router.typeCheck(req, {}, next), BadRequestError);
		});

		it('should return error on null type', function() {
			const router = new TasksRouter({});
			const req = {params: {type: null}};
			should.throws(() => router.typeCheck(req, {}, next), BadRequestError);
		});

		it('should return error on undefined type', function() {
			const router = new TasksRouter({});
			const req = {params: {}};
			should.throws(() => router.typeCheck(req, {}, next), BadRequestError);
		});

		it('should return an error when type unknown', function() {
			const router = new TasksRouter({});
			const req = {params: {type: 'afjkdlajf'}};
			should.throws(() => router.typeCheck(req, {}, next), BadRequestError);
		});

		it('should pass if type known', function() {
			const router = new TasksRouter({});
			const req = {params: {type: 'daily'}};
			should.doesNotThrow(() => router.typeCheck(req, {}, next));
		});

		it('should be case sensitive', function() {
			const router = new TasksRouter({});
			const req = {params: {type: 'Daily'}};
			should.throws(() => router.typeCheck(req, {}, next), BadRequestError);
		});
	});

	describe('#get', async function() {
		var res;

		it('should return tasks', async function() {
			const tasks = [];
			const db = {
				get: sinon.stub().returns(tasks)
			};

			const router = new TasksRouter(db);
			const req = {params: {type: 'daily'}};
			const res = {send: sinon.spy()};
			await router.get(req, res, next);

			res.send.calledOnce.should.be.ok();
			res.send.getCall(0).args[0].should.match({tasks});
		});
	});

	describe('#put', async function() {
	});

	describe('#post', async function() {
	});
	
	describe('#del', async function() {
	});

	describe('#delCompleted', async function() {
	});
});
