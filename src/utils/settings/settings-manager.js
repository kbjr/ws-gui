
const events = require('./events');
const { EventEmitter } = require('events');
const { settings: defaultSettings } = require('./defaults');

const { readFile, writeFile } = process.type === 'browser'
	? require('./file-io')
	: require('./renderer-io');

const props = new WeakMap();

exports.SettingsManager = class SettingsManager extends EventEmitter {
	constructor() {
		super();

		console.log('Initializing settings manager');

		props.set(this, {
			settings: Object.freeze({ }),
			readFile: () => readFile('settings'),
			writeFile: (settings) => writeFile('settings', settings)
		});

		events.on('new-settings', ({ settings }) => this.onChange(settings));

		// Read in the settings at app load
		if (process.type === 'renderer') {
			readFile('settings');
		}
	}

	get(setting) {
		if (! setting) {
			return props.get(this).settings;
		}

		const value = props.get(this).settings[setting];

		return value == null ? defaultSettings[setting] : value;
	}

	async set(setting, value) {
		const _props = props.get(this);
		const newSettings = Object.assign({ }, _props.settings, {
			[setting]: value
		});

		await _props.writeFile(newSettings);
	}

	async update(newSettings) {
		await props.get(this).writeFile(newSettings);
	}

	onChange(newSettings) {
		console.log('Processing new settings', newSettings);

		const _props = props.get(this);
		const { settings: current } = _props;

		_props.settings = Object.freeze(newSettings);

		let hasChanges = false;

		// Check if any of the watched settings have changed, and emit events if they have
		Object.keys(defaultSettings).forEach((setting) => {
			const oldValue = current[setting] == null ? defaultSettings[setting] : current[setting];
			const newValue = newSettings[setting] == null ? defaultSettings[setting] : newSettings[setting];

			if (oldValue !== newValue) {
				hasChanges = true;

				this.emit(`change.${setting}`, ({ setting, oldValue, newValue }));
			}
		});

		// If any of the watched settings have changed, emit a generic event
		if (hasChanges) {
			this.emit('change', {
				oldSettings: current,
				newSettings
			});
		}
	}
};
