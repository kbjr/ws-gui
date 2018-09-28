
exports.initShadow = (component, { css, html }) => {
	const shadow = component.attachShadow({ mode: 'open' });

	shadow.innerHTML = `<style>${css}</style>${html}`;

	return shadow;
};
