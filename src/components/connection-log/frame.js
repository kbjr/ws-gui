
const props = new WeakMap();

let index = 1;

exports.Frame = class Frame {
	constructor(event) {
		const { time, type } = event;

		this.index = index++;
		this.time = time;
		this.type = type;
		this.event = Object.freeze(event);

		Object.freeze(this);

		props.set(this, {
			height: null,
			isJson: event.isJson,
			isFormatted: event.formatted != null
		});
	}

	reset() {
		const _props = props.get(this);

		_props.height = this.isDrawn ? _props.node.offsetHeight : null;
	}

	get height() {
		const _props = props.get(this);

		if (! _props.height) {
			switch (this.type) {
				case 'message-in':
				case 'message-out':
					_props.height = 65;
					break;

				default:
					_props.height = 47;
					break;
			}
		}

		return _props.height;
	}

	get node() {
		const _props = props.get(this);

		if (! _props.node) {
			_props.node = drawNode(this);
		}

		return _props.node;
	}

	get isJson() {
		return props.get(this).isJson;
	}

	get isFormatted() {
		return props.get(this).isFormatted;
	}

	get isDrawn() {
		const _props = props.get(this);

		return _props.node && _props.node.parentElement;
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

		case 'message-out':
			node.innerHTML = event.formatted ? `<pre>${event.formatted}</pre>` : event.message;
			break;

		case 'message-in':
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
