
const replacePattern = /[&<>"'`=/]/g;

const chars = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\'': '&#39;',
	'/': '&#x2F;',
	'`': '&#x60;',
	'=': '&#x3D;'
};

// Escapes a string to be safe for HTML injection
exports.escapeHtml = (string) => string.replace(replacePattern, (char) => chars[char]);
