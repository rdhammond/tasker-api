class Server {
	constructor(config) {
		this.port = config.port;
		this.server = restify.createServer();
	}

	start() {
		this.server.listen(this.port, () => {
			console.log(`Tasker API listening at ${this.server.url}`);
		});
	}
}

module.exports = Server;
