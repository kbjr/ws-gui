
const { charSize, recalculateCharSize } = require('../../utils/char-size');

let index = 1;

// The minimum height at which to render any frame
const frameMinHeight = 47;

// The amount of extra padding added vertically around the pre that render content. This is used
// when calculating the height of a rendered frame
const frameHeightPadding = 10;

exports.Frame = class Frame {
	constructor(event) {
		const { time, type } = event;

		this.index = index++;
		this.time = time;
		this.type = type;
		this.event = Object.freeze(event);
		this.isJson = event.isJson;
		this.isFormatted = event.formatted != null;

		this._node = null;
		this._height = null;
	}

	reset() {
		this._height = null;
	}

	get height() {
		if (! this._height) {
			switch (this.type) {
				case 'message-in':
				case 'message-out': {
					let lines = 0;

					if (! charSize.width) {
						recalculateCharSize();
					}

					for (let i = 0; i < this.event.lineLengths.length; i++) {
						lines += Math.ceil(this.event.lineLengths[i] / charSize.cols);
					}

					const contentHeight = lines * charSize.height + frameHeightPadding;

					// _props.height = Math.max(contentHeight, frameMinHeight);
					this._height = Math.max(contentHeight, frameMinHeight);
					break;
				}

				default:
					// _props.height = frameMinHeight;
					this._height = frameMinHeight;
					break;
			}
		}

		// return _props.height;
		return this._height;
	}

	get node() {
		if (! this._node) {
			this._node = drawNode(this);
		}

		return this._node;
	}

	get isDrawn() {
		return this._node && this._node.parentElement;
	}
};

const drawNode = (frame) => {
	const { time, type, event } = frame;
	const node = document.createElement('ws-event');

	node.index = frame.index;

	node.setAttribute('time', time);
	node.setAttribute('type', type);

	switch (type) {
		case 'socket-open':
			node.innerHTML = `Socket open url=${event.url}`;
			break;

		case 'message-in':
		case 'message-out':
			node.innerHTML = event.formatted ? `<pre>${event.formatted}</pre>` : event.message;
			break;

		case 'socket-close':
			node.innerHTML = `Socket closed url=${event.url} code=${event.code} reason=${event.reason}`;
			break;

		case 'socket-error':
			node.innerHTML = `Socket error url=${event.url} error=${event.error}`;
			break;
	}

	return node;
};
