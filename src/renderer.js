
const { EventEmitter } = require('events');
const { debounce } = require('./utils/debounce');

exports = module.exports = new EventEmitter();

exports.appRoot = () => document.querySelector('ws-app-root');

window.addEventListener('resize', debounce(50, () => exports.emit('resize')));
