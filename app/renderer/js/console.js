const NodeConsole = require('console').Console;
const fs = require('fs');
const isDev = require('electron-is-dev');
const { initSetUp } = require('./utils/default-util');

initSetUp();
let app = null;
if (process.type === 'renderer') {
	app = require('electron').remote.app;
} else {
	app = require('electron').app;
}

const browserConsole = console;
const logDir = `${app.getPath('userData')}/Logs`;

function customConsole(opts, type, ...args) {
	const { nodeConsole, timestamp } = opts;
	if (timestamp) {
		args.unshift(timestamp());
	}

	if (!isDev) {
		const nodeConsoleLog = nodeConsole[type] || nodeConsole.log;
		nodeConsoleLog.apply(null, args);
	}
	browserConsole[type].apply(null, args);
}

function getTimestamp() {
	const date = new Date();
	const timestamp =
		`${date.getMonth()}/${date.getDate()} ` +
		`${date.getMinutes()}:${date.getSeconds()}`;
	return timestamp;
}

function setConsoleProto(type) {
	Object.defineProperty(this, type, {
		value(...args) {
			const { timestamp, nodeConsole } = this;
			const opts = {
				timestamp,
				nodeConsole
			};
			customConsole.apply(null, [].concat(opts, type, args));
		}
	});
}

class Console {
	constructor(opts = {}) {
		let { timestamp, file } = opts;
		file = `${logDir}/${file || 'console.log'}`;
		if (timestamp === true) {
			timestamp = getTimestamp;
		}

		const fileStream = fs.createWriteStream(file, { flags: 'a' });
		const nodeConsole = new NodeConsole(fileStream);
		this.nodeConsole = nodeConsole;
		this.timestamp = timestamp;
		this.setUpConsole();
	}

	setUpConsole() {
		for (const type in browserConsole) {
			setConsoleProto.call(this, type);
		}
	}
}

module.exports = Console;
