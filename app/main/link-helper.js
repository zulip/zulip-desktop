const wurl = require('wurl');

// Check link if it's internal/external
function linkIsInternal(currentUrl, newUrl) {
	const currentDomain = wurl('domain', currentUrl);
	const newDomain = wurl('domain', newUrl);
	return currentDomain === newDomain;
}

// We'll be needing this to open images in default browser
const skipImages = '.jpg|.gif|.png|.jpeg|.JPG|.PNG';

exports = module.exports = {
	linkIsInternal, skipImages
};
