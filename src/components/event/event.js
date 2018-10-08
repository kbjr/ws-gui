
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');

const props = new WeakMap();

exports.Event = class Event extends HTMLElement {
	static get observedAttributes() {
		return [ 'time', 'type' ];
	}

	constructor() {
		super();

		const _props = {
			shadow: initShadow(this, {
				html: loadFile(__dirname, 'event.html'),
				css: [
					loadFile(__dirname, '../../styles/reset.css'),
					loadFile(__dirname, 'event.css')
				]
			})
		};

		_props.time = _props.shadow.querySelector('.time');
		_props.type = _props.shadow.querySelector('.type');

		props.set(this, _props);
	}

	get index() {
		return props.get(this).index;
	}

	set index(value) {
		props.get(this).index = value;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		const _props = props.get(this);

		switch (name) {
			case 'time':
				_props.time.innerHTML = (new Date(parseInt(newValue))).toISOString();
				break;

			case 'type':
				_props.type.innerHTML = newValue;
				break;
		}
	}
};
