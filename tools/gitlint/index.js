#!/usr/bin/env node

const helpers = require('./helpers');
const getCICmd = require('./ci');

let checkAllCommits = false;
let ciMode = false;
if (process.argv[2]) {
	checkAllCommits = process.argv[2].includes('-a');
	ciMode = process.argv[2] === '--ci-mode';
}

let cmd;
if (ciMode) {
	cmd = getCICmd();
} else {
	cmd =
    checkAllCommits ? 'git log upstream/master...HEAD' : 'git log -1 HEAD';
}

const commits = helpers.run(cmd);
const commitsArray = helpers.getAllCommits(commits);
let lintFailed = false;
commitsArray.forEach(commit => {
	const res = helpers.parseCommit(commit);
	if (res.failed) {
		helpers.error(res.reason);
		helpers.error(res.commitMsg);
		lintFailed = true;
	} else {
		helpers.logSuccess('Commit[s] follow the zulip-electron commit rules.');
	}
});

if (lintFailed) {
	helpers.warn('Run with --no-verify flag to skip the commit-linter\n\n');
	process.exit(1);
}
