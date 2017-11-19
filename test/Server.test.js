const should = require('should'),
	sinon = require('sinon'),
	Server = require('../lib/Server');

require('should-sinon');

describe('Server', function() {
	describe('#ctor', function() {
		it('should save port', function() {
			const server = new Server({port: 8888}, {});
			server.port.should.eql(8888);
		});

		it('should set server', function() {
			const restSrv = {};
			const server = new Server({port: 8888}, restSrv);
			server.restSrv.should.eql(restSrv);
		});
	});

	describe('#start', function() {
		it('should start server with proper port', function() {
			const restSrv = sinon.mock({listen: () => {}});
			restSrv.expects('listen').once().withArgs(8888);

			const server = new Server({port: 8888}, restSrv.object);
			server.start();
			restSrv.verify();
		});
	});
});
