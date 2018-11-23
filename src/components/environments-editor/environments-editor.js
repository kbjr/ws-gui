
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');
const { environments, environmentColors } = require('../../utils/settings');

const messageHideWaitDuration = 3000;

// TODO - When handling name changes, will have to find a way of dealing with
// the fact that the name is used as the key in the `environmentData` map, so
// collisions could occur if renaming "A" to "B" and then creating a new
// environment called "A" (which would essentially delete "B")

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
			}),
			environmentData: getEnvironmentData()
		};

		_props.wrapper = _props.shadow.querySelector('.wrapper');
		_props.environments = _props.shadow.querySelector('#environments');
		_props.editor = _props.shadow.querySelector('#editor');
		_props.closeButton = _props.shadow.querySelector('#close');
		_props.saveButton = _props.shadow.querySelector('#save');
		_props.statusArea = _props.shadow.querySelector('#status');

		// Set the close button event listener
		_props.closeButton.addEventListener('click', () => this.close());
		_props.saveButton.addEventListener('click', () => this.save());

		props.set(this, _props);

		this.renderEnvironmentList();
		this.renderEditor();
	}

	close() {
		this.dispatchEvent(new CustomEvent('close-container', { bubbles: true }));
	}

	renderEnvironmentList() {
		const _props = props.get(this);

		const environmentList = Object.keys(_props.environmentData).map((key) => {
			const { name } = _props.environmentData[key];
			const className = name === _props.currentEnvironment ? 'selected' : '';

			return `<li class="${className}" data-name="${name}">${name}</li>`;
		});

		_props.environments.innerHTML = '';
		_props.environments.innerHTML = environmentList.join('');

		const items = [ ..._props.environments.querySelectorAll('li') ];

		items.forEach((item) => {
			const { env } = _props.environmentData[item.getAttribute('data-name')];

			item.addEventListener('click', () => this.selectEnvironment(env));
		});
	}

	renderEditor() {
		const _props = props.get(this);
		const env = _props.environmentData[_props.currentEnvironment];

		const colors = environmentColors.map((color) => {
			const className = color === env.color ? 'selected' : '';

			return `<li class="${className}" data-color="${color}" style="background-color: var(--color-${color})"></li>`;
		});

		_props.editor.innerHTML = '';
		_props.editor.innerHTML = `
			<h3>${env.name}</h3>
			<ul id="color-selector">${colors.join('')}</ul>
			<textarea id="content">${env.content}</textarea>
		`;

		const colorItems = _props.editor.querySelectorAll('#color-selector li');

		colorItems.forEach((item) => {
			item.addEventListener('click', () => {
				colorItems.forEach((item) => item.className = '');
				item.className = 'selected';
				env.color = item.getAttribute('data-color');
			});
		});

		const textarea = _props.editor.querySelector('#content');

		textarea.addEventListener('blur', () => {
			const rawContent = textarea.value;
			const parsedContent = parseJsonSafe(rawContent);

			env.content = rawContent;

			if (parsedContent == null || typeof parsedContent !== 'object') {
				this.showStatus(`<ws-icon value="cancel"></ws-icon> Environment "${env.name}" Invalid`, { autoHide: false });
			}

			else {
				this.hideStatus();
			}
		});
	}

	selectEnvironment(env) {
		props.get(this).currentEnvironment = env.name;

		this.renderEnvironmentList();
		this.renderEditor();
	}

	async save() {
		const _props = props.get(this);

		if (! this.validate()) {
			return;
		}

		_props.saveButton.disabled = true;
		_props.closeButton.disabled = true;
		this.showStatus('<ws-icon value="spin4"></ws-icon> Saving', { autoHide: false });

		Object.keys(_props.environmentData).forEach((key) => {
			const { env, name, color, content } = _props.environmentData[key];
			const parsedContent = parseJsonSafe(content);

			// TODO - Handle creates/deletes
			// TODO - If the color of the selected environment changes, need to update
			// the UI for the environment selector

			env.name = name;
			env.color = color;
			env.update(parsedContent);
		});

		console.log('Saving new environments');

		try {
			await environments.writeToFile();

			_props.saveButton.disabled = false;
			_props.closeButton.disabled = false;
			this.showStatus('<ws-icon value="ok"></ws-icon> Environments Saved');
		}

		catch (error) {
			_props.saveButton.disabled = false;
			_props.closeButton.disabled = false;
			this.showStatus('<ws-icon value="cancel"></ws-icon> Failed to Save Environments');
		}
	}

	showStatus(content, { autoHide = true } = { }) {
		const _props = props.get(this);

		if (_props.statusHideTimer) {
			clearTimeout(_props.statusHideTimer);
			_props.statusHideTimer = null;
		}

		_props.statusArea.innerHTML = content;
		_props.statusArea.className = 'visible';

		if (autoHide) {
			_props.statusHideTimer = setTimeout(() => this.hideStatus(), messageHideWaitDuration);
		}
	}

	hideStatus() {
		const _props = props.get(this);

		_props.statusArea.className = '';
		_props.statusHideTimer = null;
	}

	validate() {
		const { environmentData } = props.get(this);

		return Object.keys(environmentData).every((name) => {
			const { content } = environmentData[name];
			const parsedContent = parseJsonSafe(content);

			if (parsedContent == null || typeof parsedContent !== 'object') {
				this.showStatus(`<ws-icon value="cancel"></ws-icon> Environment "${name}" Invalid`, { autoHide: false });

				return false;
			}

			return true;
		});
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

const getEnvironmentData = () => {
	const envs = { };

	environments.environments.forEach((env) => {
		envs[env.name] = {
			env,
			name: env.name,
			color: env.color,
			content: JSON.stringify(env.content, null, '  ')
		};
	});

	return envs;
};
