
const { EventEmitter } = require('events');
const { debounce } = require('./utils/debounce');
const { ipcRenderer } = require('electron');
const { defaultSettings } = require('./utils/default-settings');

let latestSettings = { };

exports = module.exports = new EventEmitter();

exports.appRoot = () => document.querySelector('ws-app-root');

exports.settings = () => latestSettings;

exports.loadSettings = () => {
	ipcRenderer.send('settings.load', { });
};

exports.writeSettings = (settings) => {
	ipcRenderer.send('settings.write', { settings });
};

exports.applySettings = (settings) => {
	const { documentElement } = document;

	console.log('applying settings', settings);

	latestSettings = settings;

	// Set any global style settings
	documentElement.style.setProperty('--font-size-output', settings.outputFontSize || defaultSettings.outputFontSize);
	documentElement.style.setProperty('--font-size-textarea', settings.textareaFontSize || defaultSettings.textareaFontSize);

	// Emit an event when new settings are applied
	exports.emit('settings.applied', { settings });
};

// Handle window resize events
window.addEventListener('resize', debounce(50, () => exports.emit('resize')));

// Handle settings applied events by implementing the new settings
ipcRenderer.on('settings.applied', (event, { settings }) => {
	exports.applySettings(settings);
});

// Load the settings when the app starts
ipcRenderer.send('settings.load', { });
