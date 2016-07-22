const wurl = require('wurl');

// Check link if it's internal/external
function linkIsInternal(currentUrl, newUrl) {
    var currentDomain = wurl('domain', currentUrl);
    var newDomain = wurl('domain', newUrl);
    return currentDomain === newDomain;
}

exports = module.exports = {
	linkIsInternal
};
