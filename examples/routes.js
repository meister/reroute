module.exports = [
	// Specific domain name to another one
	{
		host: /^old-domain\.com$/,
		path: /.*/,
		code: 301,
		location: 'https://new-domain.com/${path}'
	},
	// In multi-env setup, one might do,
	// which retains any matched top level domain
	{
		host: /^old-domain\.(local|dev|test|com)$/,
		path: /.*/,
		location: 'https://new-domain.${tld}/${path}'
	},
	// And fallback
	{
		host: /.*/,
		path: /.*/,
		location: 'http://google.com'
	}
];