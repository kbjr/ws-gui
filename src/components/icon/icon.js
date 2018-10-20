
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');

const props = new WeakMap();

exports.Icon = class Icon extends HTMLElement {
	static get observedAttributes() {
		return [ 'value' ];
	}

	constructor() {
		super();

		const _props = {
			shadow: initShadow(this, {
				html: loadFile(__dirname, 'icon.html'),
				css: [
					loadFile(__dirname, '../../styles/reset.css'),
					loadFile(__dirname, 'icon.css')
				]
			})
		};

		_props.span = _props.shadow.querySelector('span');

		_props.span.className = this.getAttribute('value');

		props.set(this, _props);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		const _props = props.get(this);

		switch (name) {
			case 'value':
				_props.span.className = newValue;
				break;
		}
	}
};
