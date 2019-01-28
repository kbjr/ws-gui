
const { app, BrowserWindow } = require('electron');
const { closeSocketForShutdown } = require('./socket');

require('./utils/settings');

const createWindow = () => {
	app.window = new BrowserWindow({
		width: 1260,
		height: 900,
		minWidth: 1260,
		minHeight: 700,
		// frame: false,
		title: 'WS GUI',
		// icon: '',
		webPreferences: {
			backgroundThrottling: false,
			textAreasAreResizable: false
		}
	});

	app.window.loadFile('src/main.html');

	// app.window.webContents.openDevTools({ mode: 'detach' });

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
