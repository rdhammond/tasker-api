const Config = require('./lib/Config'),
	TasksDb = require('./lib/TasksDb'),
	Server = require('./lib/Server'),
	TasksRouter = require('./lib/TasksRouter');

const config = new Config(`${__dirname}/config.json`);

async function init() {
	const db = new TasksDb();
	await db.open(config);

	const restSrv = restify.createServer();
	const server = new Server(config, restSrv);
	const tasks = new TasksRouter(db);
	tasks.addTo(server.api);
	server.start();
}
