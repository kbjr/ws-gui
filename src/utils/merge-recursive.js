
exports.mergeRecursive = (host, ...donors) => {
	donors.forEach((donor) => {
		Object.keys(donor).forEach((property) => {
			if (isObject(donor[property])) {
				if (isObject(host[property])) {
					exports.mergeRecursive(host[property], donor[property]);
				}
				else {
					host[property] = exports.mergeRecursive({ }, donor[property]);
				}
			}

			else {
				host[property] = donor[property];
			}
		});
	});

	return host;
};

const isObject = (value) => value != null && typeof value === 'object' && ! Array.isArray(value);
