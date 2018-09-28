
const WebSocket = require('ws');
const { app } = require('electron');
const EventEmitter = require('events');

const props = new WeakMap();

// Controls buffering to enable the render process to remain unblocked, even while receiving
// large numbers of messages
const maxBufferSize = 25;
const maxBufferWait = 50;

let testInterval;

/**
 * Uses `ws.WebSocket` to make the actual outbound connection
 *
 * @see {@link https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocket}
 */

exports.Socket = class Socket extends EventEmitter {
	constructor(url, { highDetail = false } = { }) {
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

		ws.send(message, (error) => {
			if (error) {
				app.send('socket.sendError', { id/*, error*/ });
			}

			else {
				app.send('socket.sendSuccess', { id });
			}
		});
	}

	flushBuffer() {
		const _props = props.get(this);

		if (_props.bufferTimeout) {
			clearTimeout(_props.bufferTimeout);
			_props.bufferTimeout = null;
		}


		app.send('socket.messages', {
			messages: _props.buffer.splice(0, _props.buffer.length)
		});
	}
};

const onOpen = (socket) => () => {
	const time = Date.now();

	console.log('Socket open');

	app.send('socket.open', { time });

	testInterval = setInterval(() => {
		console.log('sending test message');
		socket.send(1, 'test');
	}, 2000);
};

const onMessage = (socket) => (data) => {
	const time = Date.now();
	const _props = props.get(socket);

	_props.buffer.push({ time, data });

	if (_props.buffer.length >= maxBufferSize) {
		socket.flushBuffer();
	}

	else if (! _props.bufferTimeout) {
		_props.bufferTimeout = setTimeout(() => socket.flushBuffer(), maxBufferWait);
	}
};

const onClose = (/*socket*/) => (code, reason) => {
	console.log(`Socket closed code=${code} reason=${reason}`);

	clearInterval(testInterval);
};

const onError = (/*socket*/) => (error) => {
	console.log('Socket error encountered');
	console.log(error);
	app.send('socket.error', { error });
};

const onPing = (socket) => () => {
	console.log('Recieved ping');
};

const onPong = (socket) => () => {
	console.log('Recieved pong');
};

const onUnexpectedResponse = (socket) => (req, res) => {
	//
};

const onUpgrade = (socket) => (res) => {
	//
};
