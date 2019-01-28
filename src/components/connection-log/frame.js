
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
		this.isBinary = event.isBinary;
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
					if (this.isBinary) {
						calcuateBinaryHeight(this);
					}

					else {
						calculateTextHeight(this);
					}
					break;
				}

				default:
					this._height = frameMinHeight;
					break;
			}
		}

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
			if (event.isBinary) {
				node.innerHTML = event.formatted;
			}

			else {
				node.innerHTML = event.formatted ? `<pre>${event.formatted}</pre>` : event.message;
			}
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

const calcuateBinaryHeight = (frame) => {
	const lines = frame.event.lineNumbers.length;
	const contentHeight = lines * charSize.height + frameHeightPadding;

	frame._height = Math.max(contentHeight, frameMinHeight);
};

const calculateTextHeight = (frame) => {
	let lines = 0;

	if (! charSize.width) {
		recalculateCharSize();
	}

	for (let i = 0; i < frame.event.lineLengths.length; i++) {
		lines += Math.ceil(frame.event.lineLengths[i] / charSize.cols);
	}

	const contentHeight = lines * charSize.height + frameHeightPadding;

	frame._height = Math.max(contentHeight, frameMinHeight);
};
