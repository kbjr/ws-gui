
const { AppRoot } = require('./app');

// Load in the child components
require('../connection-log');
require('../outbound-panel');
require('../sidebar');

customElements.define('ws-app-root', AppRoot);
