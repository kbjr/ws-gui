
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');
const { ipcRenderer } = require('electron');
const { Frame } = require('./frame');

const props = new WeakMap();

const redrawDebounceInterval = 100;

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

		const newFrames = events.map((event) => new Frame(event));

		frames.push(...newFrames);
		undrawnFrames.push(...newFrames);
		this.redraw();
	}

	redraw() {
		const _props = props.get(this);

		if (_props.redrawDebounce) {
			_props.needsRedraw = true;

			// Hint to the browser that we're about to change the contents
			this.style.willChange = 'content';
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
	_props.redrawDebounce = true;
	_props.needsRedraw = false;

	const isAtBottom = connectionLog.isScrolledToBottom();

	_props.undrawnFrames.forEach((frame) => {
		_props.wrapper.appendChild(frame.node);
	});

	_props.undrawnFrames.length = 0;

	if (isAtBottom) {
		connectionLog.scrollTop = connectionLog.scrollHeight;
	}

	// We're done redrawing, we can remove the render hint
	connectionLog.style.willChange = 'auto';

	setTimeout(() => {
		_props.redrawDebounce = false;

		if (_props.needsRedraw) {
			connectionLog.redraw();
		}
	}, redrawDebounceInterval);
};
