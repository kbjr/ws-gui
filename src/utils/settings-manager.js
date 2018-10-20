
const { EventEmitter } = require('events');
const { defaultSettings } = require('./default-settings');

const props = new WeakMap();

exports.SettingsManager = class SettingsManager extends EventEmitter {
	constructor({ watch = [ ], emitPerSetting = true } = { }) {
		super();

		const _props = {
			watched: watch,
			emitPerSetting
		};

		this.onChange = this.onChange.bind(this);

		// This is the main process, bind directly to the raw settings util
		if (process.type === 'browser') {
			const { settings, events } = require('./settings');

			_props.current = settings();
			_props.getSettings = () => settings();
			_props.unbind = () => {
				events.removeListener('settings.applied', this.onChange);
			};

			events.on('settings.applied', this.onChange);
		}

		// This is the renderer process, bind to the renderer wrappers
		else {
			const renderer = require('../renderer');

			_props.current = renderer.settings();
			_props.getSettings = () => renderer.settings();
			_props.unbind = () => {
				renderer.removeListener('settings.applied', this.onChange);
			};

			renderer.on('settings.applied', this.onChange);
		}

		props.set(this, _props);
	}

	watch(...settings) {
		const _props = props.get(this);

		const watched = new Set([ ...settings, ..._props.watched ]);

		_props.watched = [ ...watched ];
	}

	destroy() {
		props.get(this).unbind();
		props.set(this, null);
	}

	get settings() {
		return props.get(this).current;
	}

	get(setting) {
		return this.settings[setting] || defaultSettings[setting];
	}

	onChange() {
		const _props = props.get(this);
		const newSettings = _props.getSettings();
		const { current } = _props;

		_props.current = newSettings;

		// Emit an event any time new settings are loaded / applied
		this.emit('change', {
			oldSettings: current,
			newSettings
		});

		let hasChanges = false;

		// Check if any of the watched settings have changed, and emit events if they have
		_props.watched.forEach((setting) => {
			if ((current[setting] || defaultSettings[setting]) !== (newSettings[setting] || defaultSettings[setting])) {
				hasChanges = true;

				if (_props.emitPerSetting) {
					this.emit(`${setting}.change`, ({
						setting,
						oldValue: current[setting] || defaultSettings[setting],
						newValue: newSettings[setting] || defaultSettings[setting]
					}));
				}
			}
		});

		// If any of the watched settings have changed, emit a generic event
		if (hasChanges) {
			this.emit('watched-change', {
				oldSettings: current,
				newSettings
			});
		}
	}
};
