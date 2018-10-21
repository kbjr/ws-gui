
const { app } = require('electron');
const { writeFile } = require('fs');
const { resolve: resolvePath } = require('path');

const { dialog } = process.type === 'renderer'
	? require('electron').remote
	: require('electron');

/*
saveFile({
	defaultFileName: 'export.csv',
	title: 'Export Message Log',
	fileExtentions: [
		{ name: 'CSV', extensions: [ 'csv' ] }
	],
	contents: '...'
})
*/

exports.saveFile = ({ defaultFileName, title, contents, fileExtensions }) => new Promise(async (resolve, reject) => {
	const defaultPath = resolvePath(app.getPath('desktop'), defaultFileName);

	const filePath = await showSaveDialog({
		defaultPath,
		title,
		filters: fileExtensions
	});

	if (filePath) {
		writeFile(filePath, contents, 'utf8', (error) => {
			if (error) {
				return reject(error);
			}

			resolve();
		});
	}
});

const showSaveDialog = (options) => new Promise((resolve) => {
	dialog.showSaveDialog(options, ({ filename }) => resolve(filename));
});
