
const events = require('./events');
const { EventEmitter } = require('events');
const { bookmarks: defaultBookmarks } = require('./defaults');

const { readFile, writeFile } = process.type === 'browser'
	? require('./file-io')
	: require('./renderer-io');

const props = new WeakMap();

exports.BookmarksManager = class BookmarksManager extends EventEmitter {
	constructor() {
		super();

		console.log('Initializing bookmarks manager');

		props.set(this, {
			bookmarks: Object.freeze({ }),
			readFile: () => readFile('bookmarks'),
			writeFile: (bookmarks) => writeFile('bookmarks', bookmarks)
		});

		events.on('new-bookmarks', ({ bookmarks }) => this.onChange(bookmarks));

		// Read in the bookmarks at app load
		if (process.type === 'renderer') {
			readFile('bookmarks');
		}
	}

	// get(setting) {
	// 	if (! setting) {
	// 		return props.get(this).settings;
	// 	}

	// 	const value = props.get(this).settings[setting];

	// 	return value == null ? defaultSettings[setting] : value;
	// }

	// async set(setting, value) {
	// 	const _props = props.get(this);
	// 	const newSettings = Object.assign({ }, _props.settings, {
	// 		[setting]: value
	// 	});

	// 	await _props.writeFile(newSettings);
	// }

	// async update(newSettings) {
	// 	await props.get(this).writeFile(newSettings);
	// }

	// onChange(newSettings) {
	// 	console.log('Processing new settings', newSettings);

	// 	const _props = props.get(this);
	// 	const { settings: current } = _props;

	// 	_props.settings = Object.freeze(newSettings);

	// 	let hasChanges = false;

	// 	// Check if any of the watched settings have changed, and emit events if they have
	// 	Object.keys(defaultSettings).forEach((setting) => {
	// 		const oldValue = current[setting] == null ? defaultSettings[setting] : current[setting];
	// 		const newValue = newSettings[setting] == null ? defaultSettings[setting] : newSettings[setting];

	// 		if (oldValue !== newValue) {
	// 			hasChanges = true;

	// 			this.emit(`change.${setting}`, ({ setting, oldValue, newValue }));
	// 		}
	// 	});

	// 	// If any of the watched settings have changed, emit a generic event
	// 	if (hasChanges) {
	// 		this.emit('change', {
	// 			oldSettings: current,
	// 			newSettings
	// 		});
	// 	}
	// }
};
