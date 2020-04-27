// Require Class
const Server = require('../lib/server');

// Set up mocks
const { EventEmitter } = require('events');

jest.mock('../lib/io');

const ioMock = require('../lib/io');
const httpModule = jest.genMockFromModule('http');
const listenError = new Error('Invalid port');
const listenMock = jest.fn((port, cb) => {
	cb(port === 9000 ? null : listenError);
});
const stopMock = jest.fn((cb = (() => {})) => cb());
const fakeServer = new EventEmitter();

fakeServer.listen = listenMock;
fakeServer.close = stopMock;

httpModule.createServer.mockImplementation(() => fakeServer);

const defaultRoutes = [{
	host: /^old-domain\.com$/,
	path: /.*/,
	code: 301,
	location: 'https://new-domain.com/${path}'
}];

const startServer = () => {
	return new Server(defaultRoutes, {
		httpFactory: httpModule,
		port: 9000
	});
};

describe('#construct', () => {
	it('initialises server with default configuration', () => {
		const server = new Server();

		expect(server).toMatchObject({
			options: {
				port: 8000,
				redirectProtocol: '//',
				httpFactory: null
			}
		});
	});
});

describe('start()', () => {
	it('throws an error without routes', () => {
		const server = new Server();

		return expect(server.start()).rejects.toThrow(/Routes not provided/);
	});

	it('throws an error with empty routes', () => {
		const server = new Server([]);

		return expect(server.start()).rejects.toThrow(/Routes not provided/);
	});

	it('throws an error without missing http factory', () => {
		const server = new Server(defaultRoutes, {});

		return expect(server.start()).rejects.toThrow(/Server factory not provided/);
	});

	it('rejects start when createServer fails', async () => {
		const server = new Server(defaultRoutes, {
			port: 8000,
			httpFactory: httpModule
		});

		await expect(server.start()).rejects.toThrow();
		expect(ioMock.err.print).toHaveBeenLastCalledWith('Something bad happened', expect.any(Object));
	});

	it('ignores maxSockets setting when http implementation does not have globalAgent', () => {
		const server = new Server(defaultRoutes, {
			port: 9000,
			httpFactory: {
				createServer: httpModule.createServer
			}
		});

		return expect(server.start()).resolves.toBe(9000);
	});

	it('starts the server', async () => {
		const server = startServer();

		const result = await expect(server.start());

		expect(httpModule.createServer).toHaveBeenCalled();
		expect(listenMock).toHaveBeenCalled();
		expect(listenMock).toHaveBeenLastCalledWith(9000, expect.any(Function));
		result.resolves.toBe(9000);
	});
});

describe('stop()', () => {
	let server;

	beforeEach(() => {
		server = startServer();
		server.server = fakeServer;
	});

	afterEach(() => {
		server = null;
		fakeServer.removeAllListeners();
	});

	// eslint-disable-next-line jest/expect-expect
	it('resolves when stopping server', async () => {
		process.nextTick(() => {
			fakeServer.emit('close');
		});

		return server.stop();
	});

	it('rejects when stopping server with error', () => {
		const closeError = new Error('Server made a boo boo');

		expect.assertions(1);

		process.nextTick(() => {
			fakeServer.emit('close', closeError);
		});

		return server.stop().catch((err) => {
			expect(err).toBe(closeError);
		});
	});
});

describe('findRedirect()', () => {
	let server;

	beforeEach(() => {
		server = startServer();
	});

	afterEach(() => {
		server = null;
	});

	it('iterates over specified routes 3 times', () => {
		const match = jest.fn()
			.mockReturnValueOnce(false)
			.mockReturnValueOnce(false)
			.mockReturnValue(true);

		const routes = [{
			match,
			id: 1
		}, {
			match,
			id: 2
		}, {
			match,
			id: 3
		}];

		server.routes = routes;

		expect(server.findRedirect()).toBe(routes[2]);
		expect(match).toHaveBeenCalledTimes(3);
	});

	it('iterates once for first match', () => {
		const match = jest.fn()
			.mockReturnValueOnce(true)
			.mockReturnValue(false);

		const routes = [{
			match,
			id: 1
		}, {
			match,
			id: 2
		}, {
			match,
			id: 3
		}];

		server.routes = routes;

		expect(server.findRedirect()).toBe(routes[0]);
		expect(match).toHaveBeenCalledTimes(1);
	});
});

describe('requestHandler()', () => {
	let server,
		request,
		response;

	beforeEach(() => {
		server = startServer();
		request = {
			headers: {
				host: 'foo'
			},
			url: '/bar'
		};
		response = {
			end: jest.fn(),
			setHeader: jest.fn()
		};
	});

	afterEach(() => {
		server = null;
		request = null;
		response = null;
	});

	it('returns 404', () => {
		server.findRedirect = jest.fn().mockReturnValue();
		server.requestHandler(request, response);

		expect(response.end).toHaveBeenCalledTimes(1);
		expect(response.end).toHaveBeenLastCalledWith('Not Found');
		expect(ioMock.out.log).toHaveBeenLastCalledWith(404, 'foo/bar');
	});

	it('returns provided status code', () => {
		server.findRedirect = jest.fn().mockReturnValue({
			code: 245,
			matchedLocation: 'http://foo/bar'
		});
		server.requestHandler(request, response);

		expect(response.end).toHaveBeenCalledTimes(1);
		expect(response.end).toHaveBeenLastCalledWith('http://foo/bar');

		expect(ioMock.out.log).toHaveBeenLastCalledWith(
			245,
			'foo/bar',
			'->',
			'http://foo/bar'
		);
	});
});