
exports.defaultSettings = {
	// Font size of the output panel
	outputFontSize: '12px',

	// Font size of the input text areas panel
	textareaFontSize: '12px',

	// The minimum amount of time (milliseconds) between redraws
	redrawDebounceInterval: 100,

	// Should messages be syntax highlighted?
	highlightMessages: true,

	// Auto-formats JSON messages
	prettyJSON: false,

	// The amount of extra frames to render before and after the "visible" area
	frameBufferSize: 10,

	// Controls buffering to enable the render process to remain unblocked, even while receiving
	// large numbers of messages
	socketMaxBufferSize: 25,
	socketMaxBufferWait: 50
};
