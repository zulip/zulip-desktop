import {ClientRequest, IncomingMessage, app, net} from 'electron';
import fs from 'fs';
import path from 'path';
import stream from 'stream';
import util from 'util';

import getStream from 'get-stream';

import {ServerConf} from '../renderer/js/utils/domain-util';
import Logger from '../renderer/js/utils/logger-util';
import * as Messages from '../resources/messages';

export async function fetchResponse(request: ClientRequest): Promise<IncomingMessage> {
	return new Promise((resolve, reject) => {
		request.on('response', resolve);
		request.on('abort', () => {
			reject(new Error('Request aborted'));
		});
		request.on('error', reject);
		request.end();
	});
}

const pipeline = util.promisify(stream.pipeline);

/* Request: domain-util */

const defaultIconUrl = '../renderer/img/icon.png';

const logger = new Logger({
	file: 'domain-util.log',
	timestamp: true
});

const generateFilePath = (url: string): string => {
	const dir = `${app.getPath('userData')}/server-icons`;
	const extension = path.extname(url).split('?')[0];

	let hash = 5381;
	let {length} = url;

	while (length) {
		hash = (hash * 33) ^ url.charCodeAt(--length);
	}

	// Create 'server-icons' directory if not existed
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	return `${dir}/${hash >>> 0}${extension}`;
};

export const _getServerSettings = async (domain: string, session: Electron.session): Promise<ServerConf> => {
	const response = await fetchResponse(net.request({
		url: domain + '/api/v1/server_settings',
		session
	}));
	if (response.statusCode !== 200) {
		throw new Error(Messages.invalidZulipServerError(domain));
	}

	const {realm_name, realm_uri, realm_icon} = JSON.parse(await getStream(response));
	if (
		typeof realm_name !== 'string' ||
			typeof realm_uri !== 'string' ||
			typeof realm_icon !== 'string'
	) {
		throw new TypeError(Messages.noOrgsError(domain));
	}

	return {
		// Some Zulip Servers use absolute URL for server icon whereas others use relative URL
		// Following check handles both the cases
		icon: realm_icon.startsWith('/') ? realm_uri + realm_icon : realm_icon,
		url: realm_uri,
		alias: realm_name
	};
};

export const _saveServerIcon = async (url: string, session: Electron.session): Promise<string> => {
	try {
		const response = await fetchResponse(net.request({url, session}));
		if (response.statusCode !== 200) {
			logger.log('Could not get server icon.');
			return defaultIconUrl;
		}

		const filePath = generateFilePath(url);
		await pipeline(response, fs.createWriteStream(filePath));
		return filePath;
	} catch (error: unknown) {
		logger.log('Could not get server icon.');
		logger.log(error);
		logger.reportSentry(error);
		return defaultIconUrl;
	}
};

/* Request: reconnect-util */

export const _isOnline = async (url: string, session: Electron.session): Promise<boolean> => {
	try {
		const response = await fetchResponse(net.request({
			url: `${url}/static/favicon.ico`,
			session
		}));
		const isValidResponse = response.statusCode >= 200 && response.statusCode < 400;
		return isValidResponse;
	} catch (error: unknown) {
		logger.log(error);
		return false;
	}
};
