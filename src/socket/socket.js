
const WebSocket = require('ws');
const { app } = require('electron');
const EventEmitter = require('events');

const props = new WeakMap();

// Controls buffering to enable the render process to remain unblocked, even while receiving
// large numbers of messages
const maxBufferSize = 25;
const maxBufferWait = 50;

/**
 * Uses `ws.WebSocket` to make the actual outbound connection
 *
 * @see {@link https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocket}
 */

exports.Socket = class Socket extends EventEmitter {
	constructor(url, { highDetail = true } = { }) {
		super();

		console.log(`Attempting to open socket url=${url}`);

		const ws = new WebSocket(url);

		ws.on('open', onOpen(this));
		ws.on('message', onMessage(this));
		ws.on('close', onClose(this));
		ws.on('error', onError(this));

		if (highDetail) {
			ws.on('ping', onPing(this));
			ws.on('pong', onPong(this));
			ws.on('unexpected-response', onUnexpectedResponse(this));
			ws.on('upgrade', onUpgrade(this));
		}

		props.set(this, {
			url,
			ws,
			highDetail,
			buffer: [ ]
		});
	}

	get readyState() {
		return props.get(this).ws.readyState;
	}

	close(code, reason) {
		console.log(`Attempting to close socket code=${code} reason=${reason}`);

		const { ws } = props.get(this);

		ws.close(code, reason);
	}

	send(id, message) {
		const { ws } = props.get(this);

		this.pushToBuffer('message-out', { id, message });

		ws.send(message, (error) => {
			if (error) {
				app.send('socket.sendError', { id, error, time: Date.now() });
			}

			else {
				app.send('socket.sendSuccess', { id, time: Date.now() });
			}
		});
	}

	pushToBuffer(type, attrs) {
		const _props = props.get(this);

		const event = Object.assign(attrs || { }, {
			type,
			time: Date.now()
		});

		_props.buffer.push(event);

		if (_props.buffer.length >= maxBufferSize) {
			this.flushBuffer();
		}

		else if (! _props.bufferTimeout) {
			_props.bufferTimeout = setTimeout(() => this.flushBuffer(), maxBufferWait);
		}
	}

	flushBuffer() {
		const _props = props.get(this);

		if (_props.bufferTimeout) {
			clearTimeout(_props.bufferTimeout);
			_props.bufferTimeout = null;
		}


		app.send('socket.events', {
			events: _props.buffer.splice(0, _props.buffer.length)
		});
	}
};

const onOpen = (socket) => () => {
	const time = Date.now();
	const { url } = props.get(socket);

	console.log(`Socket open url=${url}`);

	app.send('socket.open', { time });
	socket.pushToBuffer('socket-open', { url });
};

const onMessage = (socket) => (message) => {
	socket.pushToBuffer('message-in', { message });
};

const onClose = (socket) => (code, reason) => {
	const { url } = props.get(socket);

	console.log(`Socket closed code=${code} reason=${reason}`);

	app.send('socket.closed', { code, reason });
	socket.pushToBuffer('socket-close', { code, reason, url });
};

const onError = (socket) => (error) => {
	const { url } = props.get(socket);

	console.log(`Socket error encountered url=${url}`);
	console.log(error);

	app.send('socket.error', { error });
	socket.pushToBuffer('socket-error', { error });
};

const onPing = (socket) => () => {
	console.log('Recieved ping');

	socket.pushToBuffer('ping');
};

const onPong = (socket) => () => {
	console.log('Recieved pong');

	socket.pushToBuffer('pong');
};

const onUnexpectedResponse = (socket) => (req, res) => {
	//
};

const onUpgrade = (socket) => (res) => {
	console.log('Recieved socket upgrade response', res);
	socket.pushToBuffer('socket-upgrade');
};
