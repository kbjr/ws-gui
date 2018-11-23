
const { EventEmitter } = require('events');

const props = new WeakMap();

class SettingsEvents extends EventEmitter {
	constructor() {
		super();

		const _props = { };

		if (process.type === 'browser') {
			const { app, ipcMain } = require('electron');

			_props.sendToOther = (...args) => app.send('settings-event', { args });

			ipcMain.on('settings-event', (event, { args }) => super.emit(...args));
		}

		else {
			const { ipcRenderer } = require('electron');

			_props.sendToOther = (...args) => ipcRenderer.send('settings-event', { args });

			ipcRenderer.on('settings-event', (event, { args }) => super.emit(...args));
		}

		props.set(this, _props);
	}

	emit(...args) {
		super.emit(...args);
		props.get(this).sendToOther(...args);
	}
}

module.exports = new SettingsEvents();
