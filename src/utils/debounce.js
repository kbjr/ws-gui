
exports.debounce = (ms, func) => {
	let timeout;
	let needsCall = false;

	const call = () => {
		func();

		needsCall = false;
		timeout = setTimeout(afterDebounce, ms);
	};

	const afterDebounce = () => {
		timeout = null;

		if (needsCall) {
			call();
		}
	};

	return () => {
		if (! timeout) {
			call();
		}

		else {
			needsCall = true;
		}
	};
};
