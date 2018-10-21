
const renderer = require('../renderer');
const { SettingsManager } = require('./settings-manager');

const settingsManager = new SettingsManager({
	watch: [ 'outputFontSize' ]
});

let blockChar;
let inlineChar;

// The amount of total width (width of the connection log) that is not available inside the pre
// that actually renders content. This is used when calculating the number of columns available
// for rendering text
const frameWidthPadding = 235;

const charSize = { };

exports.charSize = {
	get width() {
		return charSize.width;
	},

	get height() {
		return charSize.height;
	},

	get cols() {
		return charSize.cols;
	}
};

exports.recalculateCharSize = () => {
	if (! blockChar) {
		blockChar = document.querySelector('.test-character.block');
		inlineChar = document.querySelector('.test-character.inline');
	}

	charSize.width = inlineChar.offsetWidth;
	charSize.height = blockChar.offsetHeight;
	charSize.cols = Math.floor((renderer.appRoot().connectionLog.offsetWidth - frameWidthPadding) / charSize.width);
};

// When the app is resized, we need to recalculate to make sure we have an accurate column count
renderer.on('resize', exports.recalculateCharSize);
settingsManager.on('outputFontSize.change', this.completeRedraw);
