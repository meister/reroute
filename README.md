# Reroute!

[![Build Status](https://travis-ci.org/meister/reroute.svg?branch=master)](https://travis-ci.org/meister/reroute) [![Greenkeeper badge](https://badges.greenkeeper.io/meister/reroute.svg)](https://greenkeeper.io/)

Reroute! is a single purpose service intended to redirect incoming requests
based on their domain name and path.

It's main use case for this service is to be use as a fallback service that
can redirect users to live pages. Consider if you are using a reverse proxy
and some service or domain or path is being deprecated, then this service
will act as a regression handler.

## Installation

Installation and starting the service:
```
npm install -g reroute
```

### Configure routes

You should have in your project root folder a configuration of routes,
example:
```javascript
// routes.js
module.exports = [{
  host: /^my\.domain$/,
  path: /.*/,
  location: 'http://new.domain/'
},
{
  host: /^foo\.bar$/,
  path: /.*/,
  code: 301,
  location: '//another.domain/${path}'
}];
```


Read Configuration section in the documentation.
### Run server
Then run in your terminal:
```
reroute
```

### Running in Docker
With docker, simply run:

```
docker run -d -v $(pwd)/routes.js:/app/routes.js -p 8000:80 meistr/reroute
```

### Specifying custom routes path
Add `ENV` variable:

```
REROUTE_CONFIG=/your-path-to/routes.js reroute
```

### Test the running server
Run a curl against your local service and see if it redirects you properly.
```
❯ curl -i -H "Host: my.domain" localhost:8000/some-path
HTTP/1.1 302 Found
Location: http://new.domain/
Date: Wed, 13 Dec 2017 15:36:38 GMT
Connection: keep-alive
Content-Length: 0
```