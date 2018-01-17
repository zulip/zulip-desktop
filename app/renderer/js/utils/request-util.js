const {
  remote: { net }
} = require('electron');

// this function must not be used before
// app.on ready event
function request(url) {
	const Request = net.request(url);
	const response = {};

	return new Promise((resolve, reject) => {
		Request.on('response', async res => {
			if (res.statusCode > 399) {
				const err = new Error(`Server responded with error code: ${res.statusCode}`);
				reject(err);
			}

			response.headers = res.headers;
			response.statusCode = res.statusCode;
			response.body = '';
			await res.on('data', chunk => {
				response.body = chunk.toString();
				resolve(response);
			});
		});

		Request.on('error', error => {
			const err = new Error(error);
			error.data = {
				headers: response.headers,
				statusCode: response.statusCode,
				url
			};
			reject(err);
		});

		Request.end();
	});
}

module.exports = request;
