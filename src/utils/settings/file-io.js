
const events = require('./events');
const defaults = require('./defaults');
const { app } = require('electron');
const { resolve } = require('path');
const { readFile, writeFile, access, constants: { F_OK } } = require('fs');

exports.filePath = (file) => resolve(app.getPath('userData'), file);

exports.files = Object.freeze({
	settings: exports.filePath('settings.json'),
	bookmarks: exports.filePath('bookmarks.json'),
	environments: exports.filePath('environments.json')
});

exports.readFile = async (file) => {
	events.emit(`new-${file}`, {
		[file]: await readSettingsFile(file)
	});
};

exports.writeFile = async (file, contents) => {
	await writeSettingsFile(file, contents);

	events.emit(`new-${file}`, {
		[file]: contents
	});
};

events.on('read-file', async ({ id, file }) => {
	try {
		await exports.readFile(file);

		events.emit('read-file-success', { id });
	}

	catch (error) {
		events.emit('read-file-error', { id, error: error.toString() });
	}
});

events.on('write-file', async ({ id, file, contents }) => {
	try {
		await exports.writeFile(file, contents);

		events.emit('write-file-success', { id });
	}

	catch (error) {
		events.emit('write-file-error', { id, error: error.toString() });
	}
});

const readSettingsFile = (file) => new Promise(async (resolve, reject) => {
	if (! exports.files.hasOwnProperty(file)) {
		return reject(new Error('Invalid user settings file'));
	}

	const filePath = exports.files[file];

	console.warn(`Loading settings file ${filePath}...`);

	await ensureFileExists(filePath, defaults[file]);

	readFile(filePath, 'utf8', (error, content) => {
		if (error) {
			console.warn(`Failed to load settings file ${filePath}`);
			console.warn(error);
			resolve({ });

			return;
		}

		try {
			const settings = JSON.parse(content);

			console.log(`Settings file ${filePath} loaded successfully`);
			resolve(settings);
		}

		catch (error) {
			console.warn(`Failed to parse settings file ${filePath}`);
			console.warn(error);
			resolve({ });
		}
	});
});

const writeSettingsFile = (file, contents) => new Promise((resolve, reject) => {
	if (! exports.files.hasOwnProperty(file)) {
		return reject(new Error('Invalid user settings file'));
	}

	const data = stringify(contents);
	const filePath = exports.files[file];

	writeFile(filePath, data, 'utf8', (error) => {
		if (error) {
			return reject(error);
		}

		resolve();
	});
});

const stringify = (content) => JSON.stringify(content, null, '\t');

const ensureFileExists = (filePath, defaultContent) => new Promise((resolve, reject) => {
	access(filePath, F_OK, (error) => {
		if (error) {
			console.log(`Settings file ${filePath} does not exist, creating...`);

			writeFile(filePath, stringify(defaultContent), 'utf8', (error) => {
				if (error) {
					console.warn(`Failed to create settings file ${filePath}`);
					console.warn(error);

					return reject(error);
				}

				console.log(`Created settings file ${filePath} successfully`);
				resolve();
			});
		}

		resolve();
	});
});
