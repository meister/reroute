const io = require('./io');

const defaultOptions = {
	redirectProtocol: '//',
	port: 8000,
	httpFactory: null
};

function isHealthCheck(request) {
	return (request.headers['x-health-check'] === 'true');
}

class Server {
	constructor(routes, opts = {}) {
		this.routes = routes;
		this.options = Object.assign({}, defaultOptions, opts);
	}

	start() {
		return new Promise((resolve, reject) => {
			if (!this.routes || !this.routes.length) {
				return reject(new Error('Routes not provided. Shutting down server.'));
			}

			const http = this.options.httpFactory;

			if (!http || typeof http.createServer !== 'function') {
				return reject(new Error('Server factory not provided.'));
			}

			if (http.globalAgent) {
				http.globalAgent.maxSockets = Infinity;
			}

			this.server = http.createServer(this.requestHandler.bind(this));
			this.server.listen(this.options.port, (err) => {
				if (err) {
					io.err.print('Something bad happened', err);
					err._port = this.options.port;

					return reject(err);
				}

				resolve(this.options.port);
			});
		});
	}

	stop() {
		return new Promise((resolve, reject) => {
			this.server.on('close', (hadError) => hadError ? reject(hadError) : resolve());
			this.server.close();
		});
	}

	findRedirect(request) {
		return this.routes.find(route => route.match(request));
	}

	requestHandler(request, response) {
		if (isHealthCheck(request)) {
			response.statusCode = 200;
			response.setHeader('Connection', 'close');
			response.setHeader('Content-Type', 'text/plain');
			response.end('ok');

			io.out.log(
				200,
				`(health)`,
				io.color.yellow('->'),
				'ok'
			);

			return;
		}

		const redirect = this.findRedirect(request);

		if (redirect) {
			response.statusCode = redirect.code;
			response.setHeader('Location', redirect.matchedLocation);
			response.end(redirect.matchedLocation);

			io.out.log(
				redirect.code,
				`${request.headers.host}${request.url}`,
				io.color.yellow('->'),
				`${redirect.matchedLocation}`
			);
		} else {
			response.statusCode = 404;
			response.end('Not Found');

			io.out.log(404, `${request.headers.host}${request.url}`);
		}
	}
}

module.exports = Server;