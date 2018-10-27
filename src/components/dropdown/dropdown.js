
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');

const props = new WeakMap();

exports.Dropdown = class Dropdown extends HTMLElement {
	constructor() {
		super();

		const _props = {
			shadow: initShadow(this, {
				html: loadFile(__dirname, 'dropdown.html'),
				css: [
					loadFile(__dirname, '../../styles/reset.css'),
					loadFile(__dirname, '../../styles/buttons.css'),
					loadFile(__dirname, 'dropdown.css')
				]
			})
		};

		_props.wrapper = _props.shadow.querySelector('.wrapper');
		_props.label = _props.shadow.querySelector('.label');

		_props.label.addEventListener('click', () => {
			this.toggle();
		});

		props.set(this, _props);
	}

	get disabled() {
		return this.getAttribute('disabled') != null;
	}

	set disabled(value) {
		if (value) {
			this.close();
			this.setAttribute('disabled', '');
		}

		else {
			this.removeAttribute('disabled');
		}
	}

	open() {
		if (! this.disabled) {
			const { wrapper } = props.get(this);

			wrapper.classList.add('open');
		}
	}

	close() {
		const { wrapper } = props.get(this);

		wrapper.classList.remove('open');
	}

	toggle() {
		if (! this.disabled) {
			const { wrapper } = props.get(this);

			wrapper.classList.toggle('open');
		}
	}
};
