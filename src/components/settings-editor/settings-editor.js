
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');
const { SettingsManager } = require('../../utils/settings-manager');

const settingsManager = new SettingsManager();

const props = new WeakMap();

exports.SettingsEditor = class SettingsEditor extends HTMLElement {
	constructor() {
		super();

		const _props = {
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

		// Set the initial settings content
		_props.settings.innerHTML = JSON.stringify(settingsManager.settings, null, '    ');

		// Set the close button event listener
		_props.closeButton.addEventListener('click', () => this.close());

		props.set(this, _props);
	}

	close() {
		this.dispatchEvent(new CustomEvent('close-container', { bubbles: true }));
	}
};
