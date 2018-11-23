
const { EventEmitter } = require('events');
const { debounce } = require('./utils/debounce');
const { settings } = require('./utils/settings');

exports = module.exports = new EventEmitter();

exports.appRoot = () => document.querySelector('ws-app-root');

// Handle window resize events
window.addEventListener('resize', debounce(50, () => exports.emit('resize')));

settings.on('change.outputFontSize', ({ newValue }) => {
	const { documentElement } = document;

	documentElement.style.setProperty('--font-size-output', newValue);
});

settings.on('change.textareaFontSize', ({ newValue }) => {
	const { documentElement } = document;

	documentElement.style.setProperty('--font-size-textarea', newValue);
});
