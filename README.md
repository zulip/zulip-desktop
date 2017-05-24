# Zulip Desktop Client 
[![Build Status](https://travis-ci.org/zulip/zulip-electron.svg?branch=master)](https://travis-ci.org/zulip/zulip-electron)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/zulip/zulip-electron?branch=master&svg=true)](https://ci.appveyor.com/project/akashnimare/zulip-electron/branch/master)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

Desktop client for Zulip. Available for Mac, Linux and Windows. 

<img src="http://i.imgur.com/bDtK47q.png"/>

# Download
You can download the latest version from the [Releases](https://github.com/zulip/zulip-electron/releases/latest) page.

## Prerequisites
* node >= v6.3.1
> Use [nvm](https://github.com/creationix/nvm) to install the current stable version of node


* python (v2.7.x recommended)
* If you're on Debian or Ubuntu, you'll need to install following packages:
```sh
$ sudo apt-get install build-essential libxext-dev libxtst-dev libxkbfile-dev
```

## Installation

Clone the source locally:

```sh
$ git clone https://github.com/zulip/zulip-electron
$ cd zulip-electron
```

Install project dependencies:

```sh
$ npm install
```
Start the app:

```sh
$ npm start
```

Start and watch changes  

```sh
$ npm run dev
```
# Making a release

To package app into an installer use command:
```
npm run dist
```
It will start the packaging process for operating system you are running this command on. Ready for distribution file (e.g. dmg, windows installer, deb package) will be outputted to `dist` directory.

You can create Windows installer only when running on Windows, the same is true for Linux and OSX. So to generate all three installers you need all three operating systems.


## Features
* Multiple Zulip server support
* Native desktop Notifications
* SpellChecker
* OSX/Win/Linux installers
* Automatic Updates (macOS/Windows)
* Keyboard shortcuts

Description            | Keys
-----------------------| -----------------------
Default shortcuts      | <kbd>Cmd/Ctrl</kbd> <kbd>k</kbd>
Manage Zulip Servers    | <kbd>Cmd/Ctrl</kbd> <kbd>,</kbd>
Back                   | <kbd>Cmd/Ctrl</kbd> <kbd>[</kbd>
Forward                | <kbd>Cmd/Ctrl</kbd> <kbd>]</kbd>


## Contribute

If you want to contribute please make sure to read [our documentation about contributing](docs/CONTRIBUTING.md) first.

* [Issue Tracker](https://github.com/zulip/zulip-electron/issues)
* [Source Code](https://github.com/zulip/zulip-electron/)

## Troubleshooting
If you have any problems running the app please see the [most common issues](docs/troubleshooting.md).
