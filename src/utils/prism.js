
const prism = require('prismjs');

// Load the JSON formatter
require('prismjs/components/prism-json');

exports.formatJson = (json) => {
	return prism.highlight(json, prism.languages.json, 'json');
};
