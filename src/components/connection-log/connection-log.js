
const renderer = require('../../renderer');
const { loadFile } = require('../../utils/load-file');
const { initShadow } = require('../../utils/init-shadow');
const { debounce } = require('../../utils/debounce');
const { SettingsManager } = require('../../utils/settings-manager');
const { ipcRenderer } = require('electron');
const { Frame } = require('./frame');

const props = new WeakMap();

const settingsManager = new SettingsManager({
	watch: [ 'redrawDebounceInterval', 'outputFileSize' ]
});

// The height, in pixels, of a single line frame, used to calculate the minimum
// number of frames that need to be rendered at any given time for virtualization
const minimumFrameHeight = 47;

exports.ConnectionLog = class ConnectionLog extends HTMLElement {
	constructor() {
		super();

		const _props = {
			frames: [ ],
			newFrames: [ ],
			needsRedraw: false,
			redrawDebounce: null,
			shadow: initShadow(this, {
				html: loadFile(__dirname, 'connection-log.html'),
				css: [
					loadFile(__dirname, '../../styles/reset.css'),
					loadFile(__dirname, 'connection-log.css'),
					loadFile(__dirname, 'prism.css')
				]
			})
		};

		_props.wrapper = _props.shadow.querySelector('.wrapper');
		_props.upperBuffer = _props.shadow.querySelector('.upper-buffer');
		_props.lowerBuffer = _props.shadow.querySelector('.lower-buffer');
		_props.content = _props.shadow.querySelector('.content');

		// The minimum amount of time (milliseconds) between redraws
		const redrawDebounceInterval = settingsManager.get('redrawDebounceInterval');

		this.onEvents = this.onEvents.bind(this);

		// These are never called directly, only through the debounced versions below
		this._redraw = this.redraw.bind(this);
		this._onDebouncedRedraw = this.onDebouncedRedraw.bind(this);
		this._completeRedraw = this.completeRedraw.bind(this);

		this.redraw = debounce(redrawDebounceInterval, this._redraw, this._onDebouncedRedraw);
		this.completeRedraw = debounce(redrawDebounceInterval, this._completeRedraw);

		// When the `redrawDebounceInterval` setting changes, update the debounce timers
		settingsManager.on('redrawDebounceInterval.change', () => {
			const redrawDebounceInterval = settingsManager.get('redrawDebounceInterval');

			this.redraw = debounce(redrawDebounceInterval, this._redraw, this._onDebouncedRedraw);
			this.completeRedraw = debounce(redrawDebounceInterval, this._completeRedraw);
		});

		// When the `outputFontSize` setting changes, trigger a redraw
		settingsManager.on('outputFileSize.change', this.completeRedraw);

		// Add all of the event listeners waiting for input to redraw
		renderer.on('resize', this.completeRedraw);
		this.addEventListener('scroll', this.redraw);
		ipcRenderer.on('socket.events', this.onEvents);

		props.set(this, _props);
	}

	onEvents(event, { events }) {
		const { newFrames } = props.get(this);

		newFrames.push(...events.map((event) => new Frame(event)));
		this.redraw();
	}

	// This is called when we attempt to redraw, but we get debounced
	onDebouncedRedraw() {
		// Hint to the browser that we're about to change the contents
		this.style.willChange = 'content';
	}

	// This clears out the existing height calculations before redrawing
	completeRedraw() {
		props.get(this).frames.forEach((frame) => {
			frame.reset();
		});
	}

	redraw() {
		console.log('Redrawing output panel');
		console.time('redraw');

		const _props = props.get(this);
		const { scrollTop, scrollHeight, offsetHeight } = this;

		// The amount of extra frames to render on each side
		const frameBufferSize = settingsManager.get('frameBufferSize');

		// If we have new frames, we need to check if we're scrolling with the adds, or staying put
		const scrollToBottom = _props.newFrames.length && (scrollTop + offsetHeight) >= scrollHeight;

		// Push the new frames into the main frame list
		for (let i = 0; i < _props.newFrames.length; i++) {
			_props.frames[_props.frames.length] = _props.newFrames[i];
		}

		_props.newFrames.length = 0;

		if (! _props.frames.length) {
			console.log('No frames to draw');
			console.timeEnd('redraw');

			return;
		}

		// Find the specific set of frames we're going to draw
		const neededFrames = Math.ceil(offsetHeight / minimumFrameHeight) + frameBufferSize * 2;
		const framesToDraw = getFramesToDraw(_props.frames, neededFrames, scrollTop, scrollToBottom);

		// Get the first and last frame to be drawn so we can calculate around them
		const firstFrame = framesToDraw[0];
		const lastFrame = framesToDraw[framesToDraw.length - 1];

		// Find out how large the buffers need to be to accurately represent the frames not drawn
		const { upperBufferHeight, lowerBufferHeight } = calculateBufferAroundFrames(_props.frames, firstFrame, lastFrame);

		// Update the buffer nodes to the correct new height
		_props.upperBuffer.style.height = `${upperBufferHeight}px`;
		_props.lowerBuffer.style.height = `${lowerBufferHeight}px`;

		// Grab all of the currently rendered frames
		const renderedFrames = [ ..._props.content.querySelectorAll('ws-event') ];

		// If there are no rendered frames, we can just dump in our new frames and be done
		if (! renderedFrames.length) {
			for (let i = 0; i < framesToDraw.length; i++) {
				_props.content.appendChild(framesToDraw[i].node);
			}
		}

		else {
			const firstRendered = renderedFrames[0];
			const lastRendered = renderedFrames[renderedFrames.length - 1];

			// Remove any extra frames above us
			if (firstRendered.index < firstFrame.index) {
				removeFramesUntil(renderedFrames, firstFrame.index);
			}

			// Add in any extra frames at the top
			else if (firstRendered.index > firstFrame.index) {
				addFramesUntil(framesToDraw, firstRendered);
			}

			// Remove any extra frames below us
			if (lastRendered.index > lastFrame.index) {
				removeFramesAfter(renderedFrames, lastFrame.index);
			}

			// Add in any extra frames at the bottom
			else if (lastRendered.index < lastFrame.index) {
				appendFramesAfter(framesToDraw, lastRendered, _props.content);
			}
		}

		// If we're supposed to be at the bottom, make sure we get there
		if (scrollToBottom) {
			this.scrollTop = this.scrollHeight;
		}

		// We're done redrawing, we can remove the render hint if one was set
		this.style.willChange = 'auto';

		console.timeEnd('redraw');
	}

	clear() {
		const { frames, content, upperBuffer, lowerBuffer } = props.get(this);

		frames.length = 0;
		content.innerHTML = '';
		upperBuffer.style.height = '0px';
		lowerBuffer.style.height = '0px';
	}
};

const getFramesToDraw = (frames, neededFrames, scrollTop, scrollToBottom) => {
	// The amount of extra frames to render on each side
	const frameBufferSize = settingsManager.get('frameBufferSize');

	// If we are viewing from the bottom, start grabbing frames from the end of the list
	if (scrollToBottom) {
		return frames.slice(-neededFrames);
	}

	// If we are currently scrolled near the top, just pull frames from the start of the list
	if (scrollTop <= minimumFrameHeight * frameBufferSize) {
		return frames.slice(0, neededFrames);
	}

	let top = 0;

	// Otherwise, we're somewhere in the middle. Iterate through the frames adding up the height
	// of the frames until we find the scrollTop position.
	for (let i = 0; i < frames.length; i++) {
		top += frames[i].height;

		if (top >= scrollTop) {
			const start = Math.max(0, i - frameBufferSize);

			return frames.slice(start, neededFrames + start);
		}
	}

	console.error('getFramesToDraw: Failed to find the starting frame; added all frames and could not reach the scrollTop');

	return frames.slice();
};

const calculateBufferAroundFrames = (frames, start, stop) => {
	let upperBufferHeight = 0;
	let lowerBufferHeight = 0;

	let i = 0;

	// Iterate through the frames until we reach the first rendered frame, adding each frame's
	// height to the upper buffer height
	for (; i < frames.length && frames[i] !== start; i++) {
		upperBufferHeight += frames[i].height;
	}

	// Continue iterating from where we left off (first rendered frame) until we find the last
	// rendered frame, doing nothing with each frame (we just want to skip over these)
	for (; i < frames.length && frames[i] !== stop; i++);

	// Continue iterating from where we left off (last rendered frame) adding the height of all
	// the remaining frames to the lower buffer height
	for (i++; i < frames.length; i++) {
		lowerBufferHeight += frames[i].height;
	}

	return { upperBufferHeight, lowerBufferHeight };
};

const removeFramesUntil = (frames, stopIndex) => {
	for (let i = 0; i < frames.length; i++) {
		const frame = frames[i];

		if (frame.index >= stopIndex) {
			break;
		}

		frame.parentNode.removeChild(frame);
	}
};

const addFramesUntil = (framesToDraw, stopNode) => {
	const parent = stopNode.parentNode;
	const stopIndex = stopNode.index;

	for (let i = 0; i < framesToDraw.length; i++) {
		const frame = framesToDraw[i];

		if (frame.index >= stopIndex) {
			break;
		}

		parent.insertBefore(frame.node, stopNode);
	}
};

const removeFramesAfter = (frames, startIndex) => {
	for (let i = 0; i < frames.length; i++) {
		const frame = frames[i];

		if (frame.index > startIndex) {
			frame.parentNode.removeChild(frame);
		}
	}
};

const appendFramesAfter = (framesToDraw, startNode, parent) => {
	const startIndex = startNode.index;

	for (let i = 0; i < framesToDraw.length; i++) {
		const frame = framesToDraw[i];

		if (frame.index > startIndex) {
			parent.appendChild(frame.node);
		}
	}
};
