const io = require('../lib/io');
const RouteList = require('../lib/route-list');
const Server = require('./server');
const { resolve } = require('path');
const configPath = resolve(process.env.REROUTE_CONFIG || 'routes.js');

let routes;

try {
    routes = new RouteList(configPath);
} catch (err) {
    io.err.print('Could not find route configuration.');
    io.err.debug(err);
    process.exit(1);
}

const server = new Server(routes.get());

server.start()
    .then(port => {
        io.out.print('Started server at port', io.color.green(port));
    })
    .catch((err, port) => {
        io.err.print('Could not start server at port', port);
        io.err.debug(err);
        process.exit(2);
    });