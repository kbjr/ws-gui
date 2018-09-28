
const { Socket } = require('./socket');
const { states } = require('./states');
const { closeCodes } = require('./close-codes');
const { ipcMain, app } = require('electron');

let activeSocket;
let highDetail = false;

exports.closeSocketForShutdown = () => {
	if (activeSocket) {
		activeSocket.close(closeCodes.goingAway, 'Client app shutting down');
		activeSocket = null;
	}
};

ipcMain.on('socket.open', (event, { url }) => {
	if (activeSocket) {
		app.send('socket.openError', {
			error: 'Cannot open socket, a socket is already open'
		});

		return;
	}

	const socket = activeSocket = new Socket(url, { highDetail });

	activeSocket.on('close', () => {
		if (activeSocket === socket) {
			activeSocket = null;
		}
	});
});

ipcMain.on('socket.close', (event, { code, reason }) => {
	if (! activeSocket || activeSocket.readyState >= states.closing) {
		app.send('socket.closeError', {
			error: 'Cannot close socket, no socket is open'
		});

		return;
	}

	activeSocket.close(code, reason);
	activeSocket = null;
});

ipcMain.on('socket.send', (event, { id, message }) => {
	if (! activeSocket || activeSocket.readyState !== states.open) {
		app.send('socket.sendError', {
			id,
			error: 'Cannot send message, no socket is open'
		});

		return;
	}

	activeSocket.send(id, message);
});

ipcMain.on('socket.set:highDetail', (event, { value }) => {
	highDetail = value;
});
