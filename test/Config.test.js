const TEST_PATH = `${__dirname}/config.example.json`;

const should = require('should'),
	jsonfile = require('jsonfile'),
	fs = require('fs'),
	Config = require('../lib/Config');

const sampleConfig = {
	port: 69420,
	sqlite: 'nice'
};

describe('Config', function() {
	describe('#ctor', function() {
		beforeEach(function(done) {
			jsonfile.writeFile(TEST_PATH, sampleConfig, done);
		});

		afterEach(function() {
			delete process.env.SQLITE;
			delete process.env.PORT;
			fs.unlinkSync(TEST_PATH);
		});

		it('should load config file', function() {
			const config = new Config(TEST_PATH);
			config.sqlite.should.eql(sampleConfig.sqlite);
			config.port.should.eql(sampleConfig.port);
		});

		it('should work without config file', function() {
			should.doesNotThrow(function() { new Config(TEST_PATH); });
		});

		it('should prefer process.env settings', function() {
			process.env.SQLITE = 'test2';
			process.env.PORT = 4;
			
			const config = new Config(TEST_PATH);
			config.sqlite.should.eql('test2');
			config.port.should.eql(4);
		});

		it('should fall back to defaults', function() {
			const config = new Config();
			config.sqlite.should.be.ok();
			config.port.should.be.greaterThan(0);
		});
	});
});
