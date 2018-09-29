
const { AppRoot } = require('./app');

// Load in the child components
require('../connection-log');
require('../control-panel');
require('../sidebar');

customElements.define('ws-app-root', AppRoot);
