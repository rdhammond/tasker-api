const defaults = {
	sqlite: './tasker.sqlite',
	port: 8888
};

class Config {
	constructor(path) {
		let config = {};

		try {
			config = require(path);
		}
		catch(e) {
			// Don't care
		}

		this.sqlite = process.env.SQLITE || config.sqlite || defaults.sqlite;
		this.port = parseInt(process.env.PORT || config.port || defaults.port, 10);
	}
}

module.exports = Config;
