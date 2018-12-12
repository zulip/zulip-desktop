/* To make the util runnable in both main and renderer process */
const electron = require('electron');
const path = require('path');
const tsNode = require('ts-node');

const { app } = process.type === 'renderer' ? electron.remote : electron;
tsNode.register({
	cacheDirectory: path.join(app.getPath('userData'), 'ts-node-cache')
});
