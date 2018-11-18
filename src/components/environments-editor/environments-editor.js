
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');
const { settings, environments, environmentColors } = require('../../utils/settings');

const messageHideWaitDuration = 3000;

const props = new WeakMap();

exports.EnvironmentsEditor = class EnvironmentsEditor extends HTMLElement {
	constructor() {
		super();

		const _props = {
			statusHideTimer: null,
			currentEnvironment: 'Default',
			shadow: initShadow(this, {
				html: loadFile(__dirname, 'environments-editor.html'),
				css: [
					loadFile(__dirname, '../../styles/reset.css'),
					loadFile(__dirname, '../../styles/buttons.css'),
					loadFile(__dirname, '../../styles/inputs.css'),
					loadFile(__dirname, 'environments-editor.css')
				]
			})
		};

		_props.wrapper = _props.shadow.querySelector('.wrapper');
		_props.environments = _props.shadow.querySelector('#environments');
		_props.editor = _props.shadow.querySelector('#editor');
		_props.closeButton = _props.shadow.querySelector('#close');

		// Set the close button event listener
		_props.closeButton.addEventListener('click', () => this.close());

		props.set(this, _props);

		this.renderEnvironmentList();
		this.renderEditor();
	}

	close() {
		this.dispatchEvent(new CustomEvent('close-container', { bubbles: true }));
	}

	renderEnvironmentList() {
		const envs = { };
		const _props = props.get(this);

		const environmentList = environments.environments.map((env) => {
			envs[env.name] = env;

			const className = env.name === _props.currentEnvironment ? 'selected' : '';

			return `<li class="${className}" data-name="${env.name}">${env.name}</li>`;
		});

		_props.environments.innerHTML = '';
		_props.environments.innerHTML = environmentList.join('');

		const items = [ ..._props.environments.querySelectorAll('li') ];

		items.forEach((item) => {
			const env = envs[item.getAttribute('data-name')];

			item.addEventListener('click', () => this.selectEnvironment(env));
		});
	}

	renderEditor() {
		const _props = props.get(this);
		const env = environments.getEnvironment(_props.currentEnvironment);

		const colors = environmentColors.map((color) => {
			const className = color === env.color ? 'selected' : '';

			return `<li class="${className}" data-color="${color}" style="background-color: var(--color-${color})"></li>`;
		});

		const content = JSON.stringify(env.content, null, '  ');

		_props.editor.innerHTML = '';
		_props.editor.innerHTML = `
			<h3>${env.name}</h3>
			<ul id="color-selector">${colors.join('')}</ul>
			<textarea id="content">${content}</textarea>
		`;
	}

	selectEnvironment(env) {
		props.get(this).currentEnvironment = env.name;

		this.renderEnvironmentList();
		this.renderEditor();
	}

	async save() {
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
		const newSettings = parseJsonSafe(settingsRaw);

		if (newSettings == null || typeof newSettings !== 'object') {
			_props.saveButton.disabled = false;
			_props.saveStatus.innerHTML = '<ws-icon value="cancel"></ws-icon> Settings Invalid';
			_props.saveStatus.className = 'visible';
			_props.statusHideTimer = setTimeout(hideStatus, messageHideWaitDuration);

			return;
		}

		console.log('Saving new settings', newSettings);

		try {
			await settings.update(newSettings);

			_props.saveButton.disabled = false;
			_props.saveStatus.innerHTML = '<ws-icon value="ok"></ws-icon> New Settings Saved';
			_props.saveStatus.className = 'visible';
			_props.statusHideTimer = setTimeout(hideStatus, messageHideWaitDuration);
		}

		catch (error) {
			_props.saveButton.disabled = false;
			_props.saveStatus.innerHTML = '<ws-icon value="cancel"></ws-icon> Failed to Save Settings';
			_props.saveStatus.className = 'visible';
			_props.statusHideTimer = setTimeout(hideStatus, messageHideWaitDuration);
		}
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
