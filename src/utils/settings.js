
const { app, ipcMain } = require('electron');
const { resolve } = require('path');
const { readFile, writeFile, access, constants: { F_OK } } = require('fs');
const { defaultSettings } = require('./default-settings');
const { EventEmitter } = require('events');

let latestSettings = { };

exports.settings = () => latestSettings;

exports.events = new EventEmitter();

exports.loadSettings = async () => {
	const settings = latestSettings = await loadSettings();

	app.send('settings.loaded', { settings });
	app.send('settings.applied', { settings });
	exports.events.emit('settings.loaded', { settings });
	exports.events.emit('settings.applied', { settings });
};

exports.writeSettings = async (settings) => {
	await writeSettings(settings);

	latestSettings = settings;

	app.send('settings.applied', { settings });
	exports.events.emit('settings.applied', { settings });
};

const getSettingsFile = () => resolve(app.getPath('userData'), 'settings.json');

const stringifySettings = (settings) => JSON.stringify(settings, null, '\t');

const ensureSettingsFileExists = () => {
	return new Promise((resolve, reject) => {
		const settingsFile = getSettingsFile();

		access(settingsFile, F_OK, (error) => {
			if (error) {
				console.log('settings file does not exist, creating...');

				writeFile(settingsFile, stringifySettings(defaultSettings), 'utf8', (error) => {
					if (error) {
						console.warn('failed to create settings file');
						console.warn(error);

						return reject(error);
					}

					console.log('create settings file successfully');
					resolve();
				});
			}

			resolve();
		});
	});
};

const loadSettings = () => new Promise(async (resolve) => {
	const settingsFile = getSettingsFile();

	await ensureSettingsFileExists();

	readFile(settingsFile, 'utf8', (error, content) => {
		if (error) {
			console.warn('Failed to load settings');
			console.warn(error);

			app.send('settings.read-error', { });
			resolve({ });

			return;
		}

		try {
			const settings = JSON.parse(content);

			console.log('settings loaded successfully');
			resolve(settings);
		}

		catch (error) {
			console.warn('Failed to parse settings file');
			console.warn(error);

			app.send('settings.parse-error', { });
			resolve({ });
		}
	});
});

const writeSettings = (settings) => new Promise((resolve, reject) => {
	const settingsFile = getSettingsFile();
	const settingsData = stringifySettings(settings);

	writeFile(settingsFile, settingsData, 'utf8', (error) => {
		if (error) {
			app.send('settings.write-error', { });

			return reject(error);
		}

		app.send('settings.written', { });
		resolve();
	});
});

// Listen for read/write requests from the renderer process
ipcMain.on('settings.load', () => exports.loadSettings());
ipcMain.on('settings.write', (settings) => exports.writeSettings(settings));

console.log(`settings file: ${getSettingsFile()}`);
