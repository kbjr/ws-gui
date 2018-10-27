
const { mergeRecursive } = require('../merge-recursive');

const props = new WeakMap();

const variableRegex = /\{\{([^}]*)}}/g;

exports.markSelected = (env, bool) => {
	props.get(env).selected = bool;
};

exports.Environment = class Environment {
	constructor(manager, { name, color, content, selected }, defaultContent = { }) {
		props.set(this, {
			manager,
			name,
			color,
			content,
			selected,
			mergedContent: mergeRecursive({ }, defaultContent, content)
		});
	}

	get selected() {
		return !! props.get(this).selected;
	}

	get name() {
		return props.get(this).name;
	}

	set name(value) {
		props.get(this).name = value;
	}

	get color() {
		return props.get(this).color;
	}

	set color(value) {
		props.get(this).color = value;
	}

	get(path) {
		const { mergedContent } = props.get(this);

		return getByPath(mergedContent, path);
	}

	parseEnvironmentVariables(string) {
		return string.replace(variableRegex, (match, $1) => this.get($1));
	}

	toJSON() {
		const { name, color, selected, content } = props.get(this);

		return { name, color, selected, content };
	}
};

const getByPath = (object, path) => {
	const segments = path.trim().split('.');

	let current = object;

	while (segments.length) {
		const property = segments.shift();

		if (! current.hasOwnProperty(property)) {
			return '';
		}

		current = current[property];
	}

	if (current == null) {
		return '';
	}

	if (typeof current === 'object') {
		return JSON.stringify(current);
	}

	return String(current);
};
