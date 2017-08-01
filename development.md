# Development setup

This is a guide to running the Zulip desktop app from a source tree,
in order to contribute to developing it.

## Prerequisites

To build and run the app from source, you'll need the following:

* [Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Node.js](https://nodejs.org) >= v6.9.0
  * [NPM](https://www.npmjs.com/get-npm) and
    [node-gyp](https://github.com/nodejs/node-gyp#installation),
    if they don't come bundled with your Node.js installation
* [Python](https://www.python.org/downloads/release/python-2713/)
  (v2.7.x recommended)
* Development headers for the libXext, libXtst, and libxkbfile libraries

### Debian/Ubuntu and friends

On a system running Debian, Ubuntu, or another Debian-based Linux
distribution, you can install all dependencies through the package
manager (see [here][nodesource-install] for more on the first command):

```sh
$ curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
$ sudo apt install git nodejs python build-essential libxext-dev libxtst-dev libxkbfile-dev
```

[nodesource-install]: https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

### Other OSes

Other developers run the app on Windows, macOS, and possibly other OSes.
PRs to add specific instructions to this doc are welcome!

## Download, build, and run

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
