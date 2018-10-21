
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');
const { sleep } = require('../../utils/promise');

// Milliseconds spent in the animations showing and hiding the modals
const transitionSpeed = 150;

const props = new WeakMap();

exports.Modal = class Modal extends HTMLElement {
	static async open(contents) {
		const modal = document.createElement('ws-modal');
		const container = document.querySelector('#modal-root');

		if (typeof contents === 'string') {
			modal.innerHTML = contents;
		}

		else if (contents instanceof HTMLElement) {
			modal.appendChild(contents);
		}

		container.appendChild(modal);

		await sleep(10);
		await modal.show();

		return modal;
	}

	constructor() {
		super();

		window.modal = this;

		const _props = {
			state: 'hidden',
			showPromise: null,
			hidePromise: null,
			shadow: initShadow(this, {
				html: loadFile(__dirname, 'modal.html'),
				css: [
					loadFile(__dirname, '../../styles/reset.css'),
					loadFile(__dirname, '../../styles/buttons.css'),
					loadFile(__dirname, '../../styles/inputs.css'),
					loadFile(__dirname, 'modal.css')
				]
			})
		};

		_props.wrapper = _props.shadow.querySelector('.wrapper');

		// Listen for events from any children requesting the modal to close
		_props.wrapper.addEventListener('close-container', () => {
			this.close();
		});

		props.set(this, _props);
	}

	get state() {
		return props.get(this).state;
	}

	async close() {
		const _props = props.get(this);

		switch (_props.state) {
			case 'closed': return;

			case 'showing':
				await this.show();
				// fall through

			case 'shown':
			case 'hiding':
				await this.hide();
				// fall through

			case 'hidden':
				_props.state = 'closed';

				if (this.parentElement) {
					this.parentElement.removeChild(this);
				}

				break;
		}
	}

	async show() {
		const _props = props.get(this);

		switch (_props.state) {
			case 'shown':
			case 'closed':
				return;

			case 'hiding':
				await _props.hidePromise;
				// fall through

			case 'hidden':
				_props.showPromise = showModal(this);
				// fall through

			case 'showing':
				return _props.showPromise;
		}
	}

	async hide() {
		const _props = props.get(this);

		switch (_props.state) {
			case 'hidden':
			case 'closed':
				return;

			case 'showing':
				await _props.showPromise;
				// fall through

			case 'shown':
				_props.hidePromise = hideModal(this);
				// fall through

			case 'hiding':
				return _props.hidePromise;
		}
	}
};

const showModal = (modal) => new Promise((resolve) => {
	const _props = props.get(modal);

	_props.state = 'showing';
	_props.wrapper.className = 'wrapper showing';

	const onShown = () => {
		_props.state = 'shown';
		_props.wrapper.className = 'wrapper shown';

		resolve();
	};

	setTimeout(onShown, transitionSpeed);
});

const hideModal = (modal) => new Promise((resolve) => {
	const _props = props.get(modal);

	_props.state = 'hiding';
	_props.wrapper.className = 'wrapper hiding';

	const onShown = () => {
		_props.state = 'hidden';
		_props.wrapper.className = 'wrapper hidden';

		resolve();
	};

	setTimeout(onShown, transitionSpeed);
});
