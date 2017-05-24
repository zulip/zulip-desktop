# Development guide

## Prerequisites

* [Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Node.js](https://nodejs.org) >= v6.3.1
* [node-gyp](https://github.com/nodejs/node-gyp#installation)
* [python](https://www.python.org/downloads/release/python-2713/) (v2.7.x recommended)

## System specific dependencies

### Linux
* Install following packages:
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
### Making a release

To package app into an installer use command:
```
npm run dist
```
It will start the packaging process for operating system you are running this command on. Ready for distribution file (e.g. dmg, windows installer, deb package) will be outputted to `dist` directory.

You can create Windows installer only when running on Windows, the same is true for Linux and OSX. So to generate all three installers you need all three operating systems.

