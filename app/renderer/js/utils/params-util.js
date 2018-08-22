// This util function returns the page params if they're present else returns null
function isPageParams() {
	let webpageParams = null;
	try {
		// eslint-disable-next-line no-undef, camelcase
		webpageParams = page_params;
	} catch (err) {
		webpageParams = null;
	}
	return webpageParams;
}

module.exports = {
	isPageParams
};
