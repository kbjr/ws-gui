
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');
const { environments } = require('../../utils/settings');

const props = new WeakMap();

exports.Sidebar = class Sidebar extends HTMLElement {
	constructor() {
		super();

		const _props = {
			shadow: initShadow(this, {
				html: loadFile(__dirname, 'sidebar.html'),
				css: [
					loadFile(__dirname, '../../styles/reset.css'),
					loadFile(__dirname, '../../styles/buttons.css'),
					loadFile(__dirname, 'sidebar.css')
				]
			})
		};

		_props.environments = _props.shadow.querySelector('#environments');

		props.set(this, _props);

		environments.on('change', () => this.updateEnvironmentsDropdown());
	}

	updateEnvironmentsDropdown() {
		const _props = props.get(this);
		const { documentElement } = document;
		const { currentEnvironment } = environments;

		_props.environments.innerHTML = '';

		const envButtons = environments.environments.map((env) => {
			return `<button slot="button" data-environment="${env.name}">${env.name}</button>`;
		});

		_props.environments.innerHTML = `
			<span slot="label">${currentEnvironment.name}</span>
			${envButtons.join('')}
		`;

		[ ..._props.environments.querySelectorAll('button') ].forEach((button) => {
			button.addEventListener('click', (event) => this.onEnvironmentSelection(event));
		});

		documentElement.style.setProperty('--color-current-environment', `var(--color-${currentEnvironment.color}, var(--color-grey-2))`);

		//
	}

	onEnvironmentSelection(event) {
		const _props = props.get(this);
		const button = event.target;
		const env = button.getAttribute('data-environment');

		environments.setEnvironment(env);
		_props.environments.close();

		const { documentElement } = document;
		const { currentEnvironment } = environments;

		documentElement.style.setProperty('--color-current-environment', `var(--color-${currentEnvironment.color}, var(--color-grey-2))`);
	}
};
