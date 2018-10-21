
exports.defer = () => {
	const deferred = { };

	deferred.promise = new Promise((resolve, reject) => {
		deferred.resolve = resolve;
		deferred.reject = reject;
	});

	return deferred;
};

exports.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
