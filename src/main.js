
const { app, BrowserWindow } = require('electron');
const { closeSocketForShutdown } = require('./socket');

const createWindow = () => {
	app.window = new BrowserWindow({
		width: 1200,
		height: 900
	});

	app.window.loadFile('src/main.html');

	app.window.webContents.openDevTools({ mode: 'detach' });

	app.window.on('closed', () => {
		closeSocketForShutdown();
		app.window = null;
	});
};

app.send = (...args) => {
	app.window.webContents.send(...args);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (! app.window) {
		createWindow();
	}
});
