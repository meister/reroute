module.exports = {
	out: {
		log: jest.fn(),
		print: jest.fn()
	},
	err: {
		log: jest.fn(),
		print: jest.fn()
	},
	color: {
		yellow: jest.fn((str) => str)
	}
};