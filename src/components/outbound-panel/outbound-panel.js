
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');
const { ipcRenderer } = require('electron');

const props = new WeakMap();

exports.OutboundPanel = class OutboundPanel extends HTMLElement {
	constructor() {
		super();

		const _props = {
			shadow: initShadow(this, {
				html: loadFile(__dirname, 'outbound-panel.html'),
				css: [
					loadFile(__dirname, '../../styles/reset.css'),
					loadFile(__dirname, '../../styles/buttons.css'),
					loadFile(__dirname, '../../styles/inputs.css'),
					loadFile(__dirname, 'outbound-panel.css')
				]
			})
		};

		// Find the core elements we'll be working with
		_props.openButton = _props.shadow.querySelector('#open');
		_props.closeButton = _props.shadow.querySelector('#close');

		// Bind the open socket button event
		_props.openButton.addEventListener('click', () => {
			ipcRenderer.send('socket.open', { url: 'wss://echo.websocket.org' });
		});

		// Bind the close socket button event
		_props.closeButton.addEventListener('click', () => {
			ipcRenderer.send('socket.close', { code: 1000, reason: 'Close requested by user' });
		});

		props.set(this, _props);
	}
};
