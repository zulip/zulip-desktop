const wurl = require('wurl');

// Check link if it's internal/external
function linkIsInternal(currentUrl, newUrl) {
    var currentDomain = wurl('thisDomain', currentUrl);
    var newDomain = wurl('thisDomain', newUrl);
    return currentDomain === newDomain;
}

exports = module.exports = {
	linkIsInternal
};
