
exports.initShadow = (component, { css, html }) => {
	const shadow = component.attachShadow({ mode: 'open' });
	const styles = Array.isArray(css) ? css.map(buildStyleTag).join('') : buildStyleTag(css);

	shadow.innerHTML = `${styles}${html}`;

	return shadow;
};

const buildStyleTag = (content) => `<style>${content}</style>`;
