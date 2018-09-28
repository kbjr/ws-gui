
const { resolve } = require('path');
const { readFileSync } = require('fs');

const cache = { };

exports.loadFile = (...paths) => {
	const path = resolve(...paths);

	if (! cache[path]) {
		cache[path] = readFileSync(path, 'utf8');
	}

	return cache[path];
};
