
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
			undrawnFrames: [ ],
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
		const { frames, undrawnFrames } = props.get(this);

		const newFrames = events.map(processFrames);

		frames.push(...newFrames);
		undrawnFrames.push(...newFrames);
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
		const { frames, wrapper } = props.get(this);

		frames.length = 0;
		wrapper.innerHTML = '';

		this.redraw();
	}
};

const redrawComponent = (connectionLog, _props) => {
	const isAtBottom = connectionLog.isScrolledToBottom();

	_props.undrawnFrames.forEach((frame) => {
		_props.wrapper.appendChild(frame.node);
	});

	_props.undrawnFrames.length = 0;

	if (isAtBottom) {
		connectionLog.scrollTop = connectionLog.scrollHeight;
	}
};

const processFrames = (event) => {
	const { time, type } = event;

	const node = document.createElement('ws-event');

	node.setAttribute('time', time);
	node.setAttribute('type', type);

	switch (type) {
		case 'socket-open':
			node.innerHTML = `Socket open url=${event.url}`;
			break;

		case 'message-out':
			node.innerHTML = event.message;
			break;

		case 'message-in':
			node.innerHTML = event.message;
			break;

		case 'socket-close':
			node.innerHTML = `Socket closed url=${event.url} code=${event.code} reason=${event.reason}`;
			break;

		case 'socket-error':
			node.innerHTML = `Socket error url=${event.url} error=${event.error}`;
			break;
	}

	return { time, node };
};
