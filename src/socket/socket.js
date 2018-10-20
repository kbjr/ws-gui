
const WebSocket = require('ws');
const { app } = require('electron');
const EventEmitter = require('events');
const { formatJson } = require('../utils/prism');
const { escapeHtml } = require('../utils/escape-html');
const { SettingsManager } = require('../utils/settings-manager');

const props = new WeakMap();

const settingsManager = new SettingsManager({
	emitPerSetting: false,
	watch: [
		'highlightMessages',
		'socketMaxBufferSize',
		'socketMaxBufferWait'
	]
});

// We cache the settings here because this code is all hot path and
// we don't want to waste time doing more complex lookups
const settings = {
	highlightMessages: settingsManager.get('highlightMessages'),
	socketMaxBufferSize: settingsManager.get('socketMaxBufferSize'),
	socketMaxBufferWait: settingsManager.get('socketMaxBufferWait')
};

// When one of the settings we care about changes, update our cache
settingsManager.on('watched-change', () => {
	settings.highlightMessages = settingsManager.get('highlightMessages');
	settings.socketMaxBufferSize = settingsManager.get('socketMaxBufferSize');
	settings.socketMaxBufferWait = settingsManager.get('socketMaxBufferWait');
});

/**
 * Uses `ws.WebSocket` to make the actual outbound connection
 *
 * @see {@link https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocket}
 */

exports.Socket = class Socket extends EventEmitter {
	constructor(url, { highDetail = false } = { }) {
		super();

		console.log(`Attempting to open socket url=${url}`);

		// TODO - Find a better way to handle this (rejectUnauthorized) while notifying the user of what happened
		const ws = new WebSocket(url, { rejectUnauthorized: false });

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

		this.pushToBuffer('message-out', { id, message, isJson: isJson(message) });

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
		const { maxBufferSize, maxBufferWait } = settings;

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

		const events = _props.buffer.splice(0, _props.buffer.length);

		if (settings.highlightMessages) {
			events.forEach((event) => {
				if (event.message) {
					if (event.isJson) {
						event.formatted = formatJson(event.message);
					}

					else {
						event.formatted = escapeHtml(event.message);
					}
				}
			});
		}

		else {
			events.forEach((event) => {
				if (event.message) {
					event.formatted = escapeHtml(event.message);
				}
			});
		}

		app.send('socket.events', { events });
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
	socket.pushToBuffer('message-in', { message, isJson: isJson(message) });
};

const onClose = (socket) => (code, reason) => {
	const { url } = props.get(socket);

	console.log(`Socket closed code=${code} reason=${reason}`);

	app.send('socket.closed', { code, reason });
	socket.pushToBuffer('socket-close', { code, reason, url });
	socket.emit('close');
};

const onError = (socket) => (error) => {
	const { url } = props.get(socket);

	console.log(`Socket error encountered url=${url}`);
	console.log(error);

	app.send('socket.error', { error: error.message });
	socket.pushToBuffer('socket-error', { url, error: error.message });
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

const isJson = (message) => {
	try {
		JSON.parse(message);
	}

	catch (error) {
		return false;
	}

	return true;
};
