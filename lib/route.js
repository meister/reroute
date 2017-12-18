const at = require('lodash.at');

class Route {
	constructor(route) {
		this.props = route;
	}

	match(request) {
		return this.parseRequest(request) &&
			this.matchHost() &&
			this.matchPath();
	}

	matchHost() {
		return (this.request.host.match(this.props.host));
	}

	matchPath() {
		return (this.request.url.match(this.props.path));
	}

	parseRequest(request) {
		this._lastRequest = request;

		const host = at(request, 'headers.host');
		const url = at(request, 'url');

		this.request = {
			host: host[0],
			path: url[0].substring(1),
			url: url[0],
			tld: ''
		};

		if (this.request.host) {
			let match = this.request.host.match(/.+\.([a-z]{2,})(:\d{2,})?$/);

			if (match) {
				this.request.tld = match[1];
			}
		} else if (this.props.host) {
			return false;
		}

		return (this.request.host && this.request.path);
	}

	get code() {
		return this.props.code || 302;
	}

	get location() {
		return this.props.location;
	}

	get matchedLocation() {
		return this.props.location
			.replace('${path}', this.request.path)
			.replace('${tld}', this.request.tld);
	}
}

module.exports = Route;