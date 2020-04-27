const Route = require('../lib/route');

function fakeReq(url) {
	const [host, ...path] = url.split('/');

	return {
		headers: {
			host
		},
		url: `/${path.join('/')}`
	};
}

const routes = [
	{
		host: /^old-domain\.com$/,
		path: /.*/,
		code: 301,
		location: 'https://new-domain.com/${path}'
	},
	// In multi-env setup, one might do,
	// which retains any matched top level domain
	{
		host: /^old-domain\.(local|dev|test)$/,
		path: /.*/,
		location: 'https://new-domain.${tld}/${path}'
	},
	{
		host: /old-domain\.(local|dev|test)$/,
		path: /\/api\/.*/,
		location: 'https://new-domain.${tld}/${path}'
	},
	{
		host: /.*/,
		path: /.*/,
		location: 'https://new-domain.com/v1/${path}'
	}
];

it('expects route to permanently redirect', () => {
	const r = new Route(routes[0]);

	const m = r.match(fakeReq('old-domain.com/mypath'));

	expect(m).toBe(true);
	expect(r.code).toBe(301);
	expect(r.matchedLocation).toBe('https://new-domain.com/mypath');
});

it('expects route to redirect and keep TLD', () => {
	const r = new Route(routes[1]);

	const m = r.match(fakeReq('old-domain.dev/mypath'));

	expect(m).toBe(true);
	expect(r.code).toBe(302);
	expect(r.matchedLocation).toBe('https://new-domain.dev/mypath');
});

it('does not match subdomains', () => {
	const r1 = new Route(routes[1]);
	const r2 = new Route(routes[2]);

	const m1 = r1.match(fakeReq('sub.old-domain.dev/mypath'));
	const m2 = r2.match(fakeReq('sub.old-domain.dev/api/mypath'));

	expect(m1).toBe(false);

	expect(m2).toBe(true);

	expect(r2.code).toBe(302);
	expect(r2.matchedLocation).toBe('https://new-domain.dev/api/mypath');
});

it('matches wildcard routes', () => {
	const r = new Route(routes[3]);

	let m = r.match(fakeReq('sub.old-domain.dev/mypath'));

	expect(m).toBe(true);
	expect(r.matchedLocation).toBe('https://new-domain.com/v1/mypath');

	m = r.match(fakeReq('any.random.domain.com/mypath'));
	expect(m).toBe(true);
	expect(r.matchedLocation).toBe('https://new-domain.com/v1/mypath');

	m = r.match(fakeReq('my.domain.com/'));
	expect(m).toBe(true);
	expect(r.matchedLocation).toBe('https://new-domain.com/v1/');
});
