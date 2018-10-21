
const events = require('./events');
const { defer } = require('../promise');

let nextId = 1;
const waitingPromises = { };

exports.readFile = (file) => {
	const id = nextId++;
	const deferred = defer();

	waitingPromises[id] = deferred;

	events.emit('read-file', { id, file });

	return deferred.promise;
};

exports.writeFile = (file, contents) => {
	const id = nextId++;
	const deferred = defer();

	waitingPromises[id] = deferred;

	events.emit('write-file', { id, file, contents });

	return deferred.promise;
};

const onSuccess = ({ id }) => {
	const deferred = waitingPromises[id];

	if (deferred) {
		delete waitingPromises[id];

		deferred.resolve();
	}
};

const onError = ({ id, error }) => {
	const deferred = waitingPromises[id];

	if (deferred) {
		delete waitingPromises[id];

		deferred.reject(new Error(error));
	}
};

events.on('read-file-success', onSuccess);
events.on('write-file-success', onSuccess);
events.on('read-file-error', onError);
events.on('write-file-error', onError);
