
exports.debounce = (ms, func, onDebounce) => {
	let timeout;
	let lastArgs;
	let needsCall = false;

	const call = () => {
		func(...lastArgs);

		lastArgs = null;
		needsCall = false;
		timeout = setTimeout(afterDebounce, ms);
	};

	const afterDebounce = () => {
		timeout = null;

		if (needsCall) {
			call();
		}
	};

	return (...args) => {
		lastArgs = args;

		if (! timeout) {
			call();
		}

		else {
			needsCall = true;

			if (onDebounce) {
				onDebounce();
			}
		}
	};
};
