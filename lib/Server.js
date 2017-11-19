class Server {
	constructor(config, restSrv) {
		this.port = config.port;
		this.restSrv = restSrv;
	}

	start() {
		this.restSrv.listen(this.port, () => {
			console.log(`Tasker API listening at ${this.restSrv.url}`);
		});
	}
}

module.exports = Server;
