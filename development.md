# Development guide

## Prerequisites

* [Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Node.js](https://nodejs.org) >= v6.9.0
* [python](https://www.python.org/downloads/release/python-2713/) (v2.7.x recommended)
* [node-gyp](https://github.com/nodejs/node-gyp#installation)


## System specific dependencies

### Linux

Install following packages:
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
It will start the packaging process for the operating system you are running this command on. The ready for distribution file (e.g. dmg, windows installer, deb package) will be outputted to the `dist` directory.

You can create a Windows installer only when running on Windows and similarly for Linux and OSX. So, to generate all three installers, you will need all three operating systems.

# Troubleshooting
If you have any problems running the app please see the [most common issues](./troubleshooting.md).
