class Server {
	constructor(config) {
		this.port = config.port;
		this.api = restify.createServer();
	}

	start() {
		this.server.listen(this.port, () => {
			console.log(`Tasker API listening at ${this.server.url}`);
		});
	}
}

module.exports = Server;
