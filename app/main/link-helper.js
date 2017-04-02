const wurl = require('wurl');

// Check link if it's internal/external
function linkIsInternal(currentUrl, newUrl) {
	const currentDomain = wurl('hostname', currentUrl);
	const newDomain = wurl('hostname', newUrl);
	return currentDomain === newDomain;
}

// We'll be needing this to open images in default browser
const skipImages = '.jpg|.gif|.png|.jpeg|.JPG|.PNG';

module.exports = {
	linkIsInternal, skipImages
};
