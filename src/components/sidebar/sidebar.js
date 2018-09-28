
const { loadFile } = require('../../utils/load-file');

const props = new WeakMap();

exports.Sidebar = class Sidebar extends HTMLElement {
	constructor() {
		super();

		const _props = { };

		_props.shadow = this.attachShadow({ mode: 'open' });

		_props.shadow.innerHTML = `
			<style>${loadFile(__dirname, 'sidebar.css')}</style>
			${loadFile(__dirname, 'sidebar.html')}`;

		props.set(this, _props);
	}
};
