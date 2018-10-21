
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');
const { SettingsManager } = require('../../utils/settings-manager');

const settingsManager = new SettingsManager();

const messageHideWaitDuration = 3000;

const props = new WeakMap();

exports.SettingsEditor = class SettingsEditor extends HTMLElement {
	constructor() {
		super();

		const _props = {
			statusHideTimer: null,
			shadow: initShadow(this, {
				html: loadFile(__dirname, 'settings-editor.html'),
				css: [
					loadFile(__dirname, '../../styles/reset.css'),
					loadFile(__dirname, '../../styles/buttons.css'),
					loadFile(__dirname, '../../styles/inputs.css'),
					loadFile(__dirname, 'settings-editor.css')
				]
			})
		};

		_props.wrapper = _props.shadow.querySelector('.wrapper');
		_props.settings = _props.shadow.querySelector('#settings');
		_props.saveButton = _props.shadow.querySelector('#save');
		_props.closeButton = _props.shadow.querySelector('#close');
		_props.saveStatus = _props.shadow.querySelector('#status');

		// Set the initial settings content
		_props.settings.innerHTML = JSON.stringify(settingsManager.settings, null, '    ');

		// Set the save button event listener
		_props.saveButton.addEventListener('click', () => this.save());

		// Set the close button event listener
		_props.closeButton.addEventListener('click', () => this.close());

		props.set(this, _props);
	}

	close() {
		this.dispatchEvent(new CustomEvent('close-container', { bubbles: true }));
	}

	save() {
		const _props = props.get(this);

		if (_props.statusHideTimer) {
			clearTimeout(_props.statusHideTimer);
			_props.statusHideTimer = null;
		}

		_props.saveButton.disabled = true;
		_props.saveStatus.innerHTML = '<ws-icon value="spin4"></ws-icon> Saving';
		_props.saveStatus.className = 'visible';

		const hideStatus = () => {
			_props.saveStatus.className = '';
			_props.statusHideTimer = null;
		};

		const settingsRaw = _props.settings.value;
		const settings = parseJsonSafe(settingsRaw);

		if (settings == null || typeof settings !== 'object') {
			_props.saveButton.disabled = false;
			_props.saveStatus.innerHTML = '<ws-icon value="cancel"></ws-icon> Settings Invalid';
			_props.saveStatus.className = 'visible';
			_props.statusHideTimer = setTimeout(hideStatus, messageHideWaitDuration);

			return;
		}

		console.log('Saving new settings', settings);

		const onSave = () => {
			settingsManager.removeListener('change', onSave);
			_props.saveButton.disabled = false;
			_props.saveStatus.innerHTML = '<ws-icon value="ok"></ws-icon> New Settings Saved';
			_props.saveStatus.className = 'visible';
			_props.statusHideTimer = setTimeout(hideStatus, messageHideWaitDuration);
		};

		settingsManager.on('change', onSave);
		settingsManager.update(settings);
	}
};

const parseJsonSafe = (json) => {
	try {
		return JSON.parse(json);
	}

	catch (error) {
		return void 0;
	}
};
