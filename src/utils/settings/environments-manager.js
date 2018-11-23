
const events = require('./events');
const { EventEmitter } = require('events');
const { Environment, markSelected, updateEnvironment } = require('./environment');

const { readFile, writeFile } = process.type === 'browser'
	? require('./file-io')
	: require('./renderer-io');

const props = new WeakMap();

exports.EnvironmentsManager = class EnvironmentsManager extends EventEmitter {
	constructor() {
		super();

		console.log('Initializing environments manager');

		props.set(this, {
			environments: [ ],
			currentEnvironment: 'Default',
			readFile: () => readFile('environments'),
			writeFile: (environments) => writeFile('environments', environments)
		});

		events.on('new-environments', ({ environments }) => this.onChange(environments));

		// Read in the environments at app load
		if (process.type === 'renderer') {
			readFile('environments');
		}
	}

	get environments() {
		return props.get(this).environments.slice();
	}

	get currentEnvironment() {
		const { environments, currentEnvironment } = props.get(this);

		return environments.find((environment) => environment.name === currentEnvironment);
	}

	getEnvironment(name) {
		return props.get(this).environments.find((env) => env.name === name);
	}

	setEnvironment(name) {
		const _props = props.get(this);
		const environment = this.getEnvironment(name);

		if (! environment) {
			throw new Error(`Invalid environment selection "${name}"`);
		}

		_props.currentEnvironment = name;
		_props.environments.forEach((env) => markSelected(env, env === environment));
		this.writeToFile();

		this.emit('change');
	}

	reload() {
		readFile('environments');
	}

	writeToFile() {
		const { environments, writeFile } = props.get(this);

		const data = environments.map((env) => env.toJSON());

		writeFile(data);
	}

	onChange(newEnvironments) {
		console.log('Processing new environments', newEnvironments);

		const _props = props.get(this);
		const existingEnvs = _props.environments;
		const defaultEnv = newEnvironments.find((environment) => environment.name === 'Default');

		_props.environments = newEnvironments.map((env) => {
			if (env.selected) {
				_props.currentEnvironment = env.name;
			}

			const existing = existingEnvs.find((environment) => environment.name === env.name);

			if (existing) {
				updateEnvironment(existing, env, env === defaultEnv ? { } : defaultEnv.content);

				return existing;
			}

			return new Environment(this, env, env === defaultEnv ? { } : defaultEnv.content);
		});

		this.emit('change');
	}

	parseEnvironmentVariables(string) {
		const { environments, currentEnvironment } = props.get(this);

		const env = environments.find((env) => env.name === currentEnvironment);

		return env.parseEnvironmentVariables(string);
	}

	createEnvironment(name) {
		//
	}
};
