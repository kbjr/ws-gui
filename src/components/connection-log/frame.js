
const props = new WeakMap();

// The height, in pixels, of a single line frame, used to calculate the minimum
// number of frames that need to be rendered at any given time for virtualization
const minimumFrameHeight = 47;

exports.Frame = class Frame {
	static determineHeightOfFrame() {
		//
	}

	constructor(event) {
		const { time, type } = event;

		this.time = time;
		this.type = type;
		this.event = Object.freeze(event);
		this.node = document.createElement('ws-event');

		this.node.setAttribute('time', time);
		this.node.setAttribute('type', type);

		switch (type) {
			case 'socket-open':
				this.node.innerHTML = `Socket open url=${event.url}`;
				break;

			case 'message-out':
				this.node.innerHTML = event.message;
				break;

			case 'message-in':
				this.node.innerHTML = event.message;
				break;

			case 'socket-close':
				this.node.innerHTML = `Socket closed url=${event.url} code=${event.code} reason=${event.reason}`;
				break;

			case 'socket-error':
				this.node.innerHTML = `Socket error url=${event.url} error=${event.error}`;
				break;
		}

		Object.freeze(this);

		props.set(this, {
			height: null,
			isJson: null
		});
	}

	reset() {
		const _props = props.get(this);

		_props.height = null;
	}

	get height() {
		const _props = props.get(this);

		if (! _props.height) {
			//
		}

		return _props.height;
	}

	get isJson() {
		const _props = props.get(this);

		if (this.message && _props.isJson == null) {
			try {
				JSON.parse(this.message);
				_props.isJson = true;
			}

			catch (error) {
				_props.isJson = false;
			}
		}

		return _props.isJson;
	}
};
