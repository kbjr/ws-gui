
const WebSocket = require('ws');
const { app } = require('electron');
const EventEmitter = require('events');
const { formatJson } = require('../utils/prism');
const { escapeHtml } = require('../utils/escape-html');
const { settings } = require('../utils/settings');
const { prettifyJson } = require('../utils/prettify-json');

const props = new WeakMap();

// We cache the settings here because this code is all hot path and
// we don't want to waste time doing more complex lookups
const settingsCache = {
	highlightMessages: settings.get('highlightMessages'),
	socketMaxBufferSize: settings.get('socketMaxBufferSize'),
	socketMaxBufferWait: settings.get('socketMaxBufferWait'),
	prettyJSON: settings.get('prettyJSON')
};

// When one of the settings we care about changes, update our cache
settings.on('change.highlightMessages', () => {
	settingsCache.highlightMessages = settings.get('highlightMessages');
});

settings.on('change.socketMaxBufferSize', () => {
	settingsCache.socketMaxBufferSize = settings.get('socketMaxBufferSize');
});

settings.on('change.socketMaxBufferWait', () => {
	settingsCache.socketMaxBufferWait = settings.get('socketMaxBufferWait');
});

settings.on('change.prettyJSON', () => {
	settingsCache.prettyJSON = settings.get('prettyJSON');
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
		const { maxBufferSize, maxBufferWait } = settingsCache;

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

		for (let i = 0; i < events.length; i++) {
			const event = events[i];

			if (event.message) {
				if (event.isBinary) {
					const formatted = formatHex(event.message);

					event.lineNumbers = formatted.lineNumbers;
					event.hex = formatted.hex;
					event.ascii = formatted.ascii;
					event.formatted = formatted.formatted;
				}

				else {
					if (event.isJson) {
						if (settingsCache.prettyJSON) {
							event.message = prettifyJson(event.message);
						}

						if (settingsCache.highlightMessages) {
							event.formatted = formatJson(event.message);
						}

						else {
							event.formatted = event.message;
						}
					}

					else {
						event.formatted = escapeHtml(event.message);
					}

					event.lineLengths = [ ];

					const lines = event.message.split('\n');

					for (let i = 0; i < lines.length; i++) {
						event.lineLengths.push(Array.from(lines[i]).length);
					}
				}
			}
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
	if (message instanceof ArrayBuffer) {
		socket.pushToBuffer('message-in', {
			isBinary: true,
			message: new Uint8Array(message),
		});
	}

	else {
		socket.pushToBuffer('message-in', { message, isJson: isJson(message) });
	}
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
	console.log('Recieved unexpected response', req, res);
	socket.pushToBuffer('unexpected-response');
};

const onUpgrade = (socket) => (res) => {
	console.log('Recieved socket upgrade response', res);
	socket.pushToBuffer('socket-upgrade');
};

const isJson = (message) => {
	if (typeof message !== 'string') {
		return false;
	}

	try {
		JSON.parse(message);
	}

	catch (error) {
		return false;
	}

	return true;
};

const formatHex = (message) => {
	const lineNumbers = [ ];
	const hex = [ ];
	const ascii = [ ];

	let lineIndex = 0;

	const endLine = () => {
		if (hex[lineIndex]) {
			hex[lineIndex] = hex[lineIndex].join(' ');
			ascii[lineIndex] = escapeHtml(ascii[lineIndex].join(''));
			lineIndex++;
		}
	};

	for (let i = 0; i < message.length; i++) {
		if (! hex[lineIndex]) {
			lineNumbers[lineIndex] = (lineIndex * 24).toString(16).padStart(8, '0');
			hex[lineIndex] = [ ];
			ascii[lineIndex] = [ ];
		}

		const hexLine = hex[lineIndex];
		const asciiLine = ascii[lineIndex];

		const byte = message[i];
		let hexByte = byte.toString(16);

		hexLine.push(hexByte.length < 2 ? '0' + hexByte : hexByte);

		if (byte < 32 || byte > 126) {
			asciiLine.push('\u2022');
		}

		else {
			asciiLine.push(String.fromCharCode(message[i]));
		}

		if (hexLine.length === 24) {
			endLine();
		}
	}

	endLine();

	const formatted = `
		<div class="binary-message">
			<div class="line-numbers">
				${lineNumbers.join('<br />')}
			</div>
			<div class="hex">
				${hex.join('<br />')}
			</div>
			<div class="ascii">
				${ascii.join('<br />')}
			</div>
		</div>
	`;

	return {
		lineNumbers,
		hex,
		ascii,
		formatted
	};
};
