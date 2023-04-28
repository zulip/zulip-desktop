** Windows Set up instructions **

## Prerequisites

- [Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node.js](https://nodejs.org) >= v6.9.0
- [python](https://www.python.org/downloads/release/python-2713/) (v2.7.x recommended)
- [node-gyp](https://github.com/nodejs/node-gyp#installation) (installed via PowerShell)

## System specific dependencies

- use only 32bit or 64bit for all of the installers, do not mix architectures
- install using default settings
- open Windows PowerShell as Admin

```powershell
C:\Windows\system32> npm install --global --production windows-build-tools
```

## Installation

Clone the source locally:

```sh
$ git clone https://github.com/zulip/zulip-desktop
$ cd zulip-desktop
```

Install project dependencies:

```sh
$ npm install
```

Start the app:

```sh
$ npm start
```

### Making a release

To package app into an installer use command:

```
npm run pack
npm run dist
```

It will start the packaging process. The ready for distribution file (e.g. dmg, windows installer, deb package) will be outputted to the `dist` directory.
