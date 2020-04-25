const { EOL } = require('os');
const { inspect } = require('util');
const clc = require('cli-color-tty')();

const color = {
	green: clc.xterm(34),
	lightGreen: clc.xterm(40),
	red: clc.xterm(196),
	blue: clc.xterm(33),
	yellow: clc.xterm(214),
	muted: clc.xterm(242)
};

const prefixMap = {
	301: color.lightGreen,
	302: color.green,
	404: color.red,
	err: color.red,
	info: color.blue,
	warn: color.yellow
};

class Print {
	constructor(io) {
		this.io = io;
	}

	print(...args) {
		args.forEach((arg, i) => {
			if (i > 0) {
				this.io.write(' ');
			}

			this.io.write(typeof arg === 'object' ? inspect(arg) : arg);
		});

		this.io.write(EOL);
	}

	debug(...args) {
		if (process.env.DEBUG) {
			this.print.apply(this, args);
		}
	}

	log(prefix, ...args) {
		const col = prefixMap[prefix] || color.muted;

		this.io.write(`${col(prefix)} `);
		this.print.apply(this, args);
	}
}

module.exports = {
	out: new Print(process.stdout),
	err: new Print(process.stderr),
	color
};