#!/usr/bin/env node
const {exec} = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const command = path.join(__dirname, `reinstall-node-modules${isWindows ? '.cmd' : ''}`);

const proc = exec(command, error => {
	if (error) {
		console.error(error);
	}
});

proc.stdout.on('data', data => console.log(data.toString()));
proc.stderr.on('data', data => console.error(data.toString()));
proc.on('exit', code => {
	process.exit(code);
});
