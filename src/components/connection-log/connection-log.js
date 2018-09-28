
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');

const props = new WeakMap();

exports.ConnectionLog = class ConnectionLog extends HTMLElement {
	constructor() {
		super();

		const _props = {
			messages: [ ],
			shadow: initShadow(this, {
				css: loadFile(__dirname, 'connection-log.css'),
				html: loadFile(__dirname, 'connection-log.html')
			})
		};

		_props.pre = _props.shadow.querySelector('pre');

		props.set(this, _props);
	}

	addMessages(messages) {
		props.get(this).pre.innerHTML += `${messages.map(m => `${m.time} - ${m.data}`).join('\n')}\n`;
	}
};
