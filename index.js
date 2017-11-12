const Config = require('./lib/Config'),
	TasksDb = require('./lib/TasksDb'),
	Server = require('./lib/Server'),
	TasksRouter = require('./lib/TasksRouter');

const config = new Config(`${__dirname}/config.json`);

const db = new TasksDb(config.sqlite);
await db.start();

const server = new Server(config);
new TasksRouter(db).addTo(server);
server.start();
