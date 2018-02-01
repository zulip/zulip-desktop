// This script sets up the pre-push
// git hook which will be used to lint
// commits

const fs = require('fs');
const path = require('path');

const gitHooks = '../../.git/hooks';
const postCommitPath = path.resolve(__dirname, `${gitHooks}/post-commit`);
const prePushPath = path.resolve(__dirname, `${gitHooks}/pre-push`);

function scriptTemplate(cmds) {
	cmds = cmds.join('');
	const script = [
		'#!/bin/sh',
		'set -e',
		'echo running gitlint...',
		cmds,
		'exit $?'
	];

	return script.join('\n');
}

const postCommitFile = scriptTemplate`node scripts/gitlint`;
const prePushFile = scriptTemplate`node scripts/gitlint --all-commits`;

function writeAndChmod(file, data) {
	fs.writeFile(file, data, err => {
		if (err) {
			throw err;
		}

		fs.chmod(file, '777', err => {
			if (err) {
				const msg =
					'chmod post-commit, pre-push hooks, at .git/hooks 0777 so they work!';
				console.error(msg);
			}
		});
	});
}

[postCommitPath, prePushPath].forEach((file, index) => {
	fs.open(file, 'w+', err => {
		if (err && err.code !== 'EEXIST') {
			throw err;
		}

		const data = index === 0 ? postCommitFile : prePushFile;
		writeAndChmod(file, data);
	});
});

// Remove .sample files since
// sometimes the hooks do not work
const postCommitSampleFile = `${postCommitPath}.sample`;
const prePushSampleFile = `${prePushPath}.sample`;
function removeSampleFile(file) {
	fs.unlink(file, err => {
		if (err) {
			throw err;
		}
	});
}

[postCommitSampleFile, prePushSampleFile].forEach(file => {
	fs.exists(file, exists => {
		if (exists) {
			removeSampleFile(file);
		}
	});
});
