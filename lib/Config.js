const defaults = {
	sqlite: './tasker.sqlite',
	port: 8888
};

class Config {
	constructor(path) {
		const config = {};

		try {
			config = require(path);
		}
		catch(e) {
			// Don't care
		}

		this.sqlite = process.env.SQLITE || config.sqlite || defaults.sqlite;
		this.port = process.env.PORT || config.port || defaults.port;
	}
}

module.exports = Config;
