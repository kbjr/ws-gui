
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');

const props = new WeakMap();

exports.AppRoot = class AppRoot extends HTMLElement {
	constructor() {
		super();

		const _props = {
			shadow: initShadow(this, {
				html: loadFile(__dirname, 'app.html'),
				css: [
					loadFile(__dirname, '../../styles/reset.css'),
					loadFile(__dirname, 'app.css')
				]
			})
		};

		_props.sidebar = _props.shadow.querySelector('ws-sidebar');
		_props.outboundPanel = _props.shadow.querySelector('ws-outbound-panel');
		_props.connectionLog = _props.shadow.querySelector('ws-connection-log');

		props.set(this, _props);
	}

	get sidebar() {
		return props.get(this).sidebar;
	}

	get outboundPanel() {
		return props.get(this).outboundPanel;
	}

	get connectionLog() {
		return props.get(this).connectionLog;
	}
};
