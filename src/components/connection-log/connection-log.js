
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');
const { ipcRenderer } = require('electron');

const props = new WeakMap();

//
// TODO
//   - Implement render buffering
//   - Implement view virtualization
//   - UI prettifying
//

exports.ConnectionLog = class ConnectionLog extends HTMLElement {
	constructor() {
		super();

		const _props = {
			frames: [ ],
			needsRedraw: false,
			redrawDebounce: null,
			shadow: initShadow(this, {
				html: loadFile(__dirname, 'connection-log.html'),
				css: [
					loadFile(__dirname, '../../styles/reset.css'),
					loadFile(__dirname, 'connection-log.css')
				]
			})
		};

		_props.wrapper = _props.shadow.querySelector('.wrapper');

		this.onEvents = this.onEvents.bind(this);

		ipcRenderer.on('socket.events', this.onEvents);

		props.set(this, _props);
	}

	onEvents(event, { events }) {
		const { frames } = props.get(this);

		const newFrames = events.map(drawFrame);

		frames.push(...newFrames);
		this.redraw();
	}

	redraw() {
		const _props = props.get(this);

		if (_props.redrawDebounce) {
			_props.needsRedraw = true;
		}

		else {
			redrawComponent(this, _props);
		}
	}

	isScrolledToBottom() {
		const { scrollTop, scrollHeight, offsetHeight } = this;

		return (scrollTop + offsetHeight) >= scrollHeight;
	}

	clear() {
		const { frames } = props.get(this);

		frames.length = 0;

		this.redraw();
	}
};

const redrawComponent = (connectionLog, _props) => {
	const isAtBottom = connectionLog.isScrolledToBottom();

	_props.wrapper.innerHTML = _props.frames.join('');

	if (isAtBottom) {
		connectionLog.scrollTop = connectionLog.scrollHeight;
	}
};

const drawFrame = (event) => {
	const { type, time } = event;

	switch (type) {
		case 'socket-open':
			return `<ws-event time="${time}" type="socket-open">Socket open url=${event.url}</ws-event>`;

		case 'message-out':
			return `<ws-event time="${time}" type="message-out">${event.message}</ws-event>`;

		case 'message-in':
			return `<ws-event time="${time}" type="message-in">${event.message}</ws-event>`;

		case 'socket-close':
			return `<ws-event time="${time}" type="socket-closed">
				Socket closed url=${event.url} code=${event.code} reason=${event.reason}
			</ws-event>`;

		case 'socket-error': {
			const { error } = event;

			return `<ws-event time="${time}" type="socket-error">
				Socket error url=${event.url} error=${error}
			</ws-event>`;
		}
	}
};
