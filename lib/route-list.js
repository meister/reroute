const Route = require('./route');

class RouteList {
	constructor(configPath) {
		this.configPath = configPath;
		this.loadRoutes();
	}

	loadRoutes() {
		const routes = require(this.configPath);

		this.routes = routes.map(route => new Route(route));
	}

	get() {
		return this.routes;
	}
}

module.exports = RouteList;