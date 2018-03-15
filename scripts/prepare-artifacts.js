#!/usr/bin/env node

if (!process.env.TRAVIS_OS_NAME === 'linux') {
  process.exit(0);
}

const fs = require('fs');
const path = require('path');

// go to dist directory
process.chdir(path.resolve(__dirname, '../dist'));

const extensions = /\.deb|\.AppImage|\.zip/;
const files = fs.readdirSync(process.cwd()).filter(file => file.includes);

function changeFileName(file) {
  file = file.replace(/^z/, 'Z');
  file = file.replace(/_{2}/, '-');
  return file;
}

// Change file name to what we want
// eg zulip_1.8.2_amd64.deb -> Zulip-1.8.2-amd64.deb
// and change file name
files.map(file => {
  const newFileName = changeFileName(file);
  fs.renameSync(file, newFileName);
});
