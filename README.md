# Zulip Desktop Client

This is an experimental replacement for the [Zulip Desktop
app](https://github.com/zulip/zulip-desktop) implemented in
[Electron](http://electron.atom.io/).

The goal is to achieve feature-compatibility with the old desktop app
and then start adding cool features like easy support for
multi-account, auto-updates etc.

## Installation

Clone the source locally:

```sh
$ git clone https://github.com/zulip/zulip-electron
$ cd zulip-electron
```
If you're on Debian or Ubuntu, you'll also need to install
`nodejs-legacy`:

Use your package manager to install `npm`.

```sh
$ sudo apt-get install npm nodejs-legacy
```

Install project dependencies:

```sh
$ npm install
```
Start the app:

```sh
$ npm start
```
## Features

- [x] Native Notifications
- [x] Spell Checker
- [x] Keyboard Shortcuts
- Default shortcuts - <kbd>cmdOrctrl + k </kbd>
- Change Zulip Server: <kbd>cmdOrctrl + ,</kbd>
- Back: <kbd>cmdOrctrl + [</kbd>
- Forward: <kbd>cmdOrctrl + ]</kbd>
- [ ] OSX/Win/Linux installer
- [ ] Launch on OS startup
- [ ] Automatic Updates

## Contribute

If you want to contribute please make sure to read [our documentation about contributing](./CONTRIBUTING.md) first.

* [Issue Tracker](https://github.com/zulip/zulip-electron/issues)
* [Source Code](https://github.com/zulip/zulip-electron/)
