const wurl = require('wurl');

// Check link if it's internal/external
function linkIsInternal(currentUrl, newUrl) {
	const currentDomain = wurl('domain', currentUrl);
	const newDomain = wurl('domain', newUrl);
	return currentDomain === newDomain;
}

exports = module.exports = {
	linkIsInternal
};
