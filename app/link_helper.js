const wurl = require('wurl');

// Check the link if it's inetrnal
function linkIsInternal(currentUrl, newUrl) {
    var currentDomain = wurl('domain', currentUrl);
    var newDomain = wurl('domain', newUrl);
    return currentDomain === newDomain;
}

exports = module.exports = {
	linkIsInternal
};