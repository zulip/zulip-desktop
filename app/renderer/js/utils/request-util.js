const {
  remote: { net }
} = require('electron');

// this function must not be used before
// app.on ready event
async function request(url) {
	const Request = net.request(url);
	const response = {};
	await Request.on('response', res => {
		if (res.statusCode > 399) {
			throw new Error(`Server responded with error code: ${res.statusCode}`);
		}

		response.headers = res.headers;
		response.statusCode = res.statusCode;
		response.response = '';
		res.on('data', chunk => {
			response.response += chunk;
		});
	});

	Request.on('error', error => {
		throw new Error(error);
	});

	Request.end();
	return response;
}

module.exports = request;
