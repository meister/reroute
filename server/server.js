const http = require('http');
const io = require('../lib/io');

http.globalAgent.maxSockets = Infinity;

const defaultOptions = {
    port: process.env.PORT || 8000,
    redirectProtocol: '//'
};

class Server {
    constructor(routes, opts = {}) {
        this.routes = routes;
        this.options = Object.assign({}, defaultOptions, opts);
    }

    start() {
        return new Promise((resolve, reject) => {
            if (!this.routes.length) {
                return reject(new Error('Routes not provided. Shutting down server.'));
            }

            this.server = http.createServer(this.requestHandler.bind(this));
            this.server.listen(this.options.port, (err) => {
                if (err) {
                   io.err.print('Something bad happened', err);
                   return reject(err, this.options.port);
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