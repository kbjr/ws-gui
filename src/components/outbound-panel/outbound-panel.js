
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');
const { ipcRenderer } = require('electron');

const props = new WeakMap();

let nextMessageId = 1;

exports.OutboundPanel = class OutboundPanel extends HTMLElement {
	constructor() {
		super();

		const _props = {
			state: 'closed',
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
		_props.urlInput = _props.shadow.querySelector('#url');
		_props.openCloseButton = _props.shadow.querySelector('#open-close');
		_props.messageTextarea = _props.shadow.querySelector('#message');
		_props.sendButton = _props.shadow.querySelector('#send');

		// Bind the open/close socket button event
		_props.openCloseButton.addEventListener('click', () => this.toggleOpen());

		// Bind the send message button event
		_props.sendButton.addEventListener('click', () => this.sendMessage());

		// Bind the on open event
		ipcRenderer.on('socket.open', () => {
			_props.state = 'open';
			_props.openCloseButton.disabled = false;
			_props.sendButton.disabled = false;
			_props.messageTextarea.disabled = false;
			_props.openCloseButton.innerHTML = 'Close';
		});

		// Bind the on open event
		ipcRenderer.on('socket.closed', () => {
			_props.state = 'closed';
			_props.openCloseButton.disabled = false;
			_props.openCloseButton.innerHTML = 'Open';
			_props.urlInput.disabled = false;
		});

		props.set(this, _props);
	}

	toggleOpen() {
		const _props = props.get(this);

		switch (_props.state) {
			// If it's open, then close the socket
			case 'open':
				_props.state = 'closing';
				_props.openCloseButton.disabled = true;
				_props.sendButton.disabled = true;
				_props.messageTextarea.disabled = true;

				ipcRenderer.send('socket.close', { code: 1000, reason: 'Close requested by user' });
				break;

			// If it's closed, then open the socket
			case 'closed':
				_props.state = 'opening';
				_props.openCloseButton.disabled = true;
				_props.urlInput.disabled = true;

				ipcRenderer.send('socket.open', { url: _props.urlInput.value });
				break;
		}
	}

	sendMessage() {
		const _props = props.get(this);

		ipcRenderer.send('socket.send', {
			id: nextMessageId++,
			message: _props.messageTextarea.value
		});
	}
};
