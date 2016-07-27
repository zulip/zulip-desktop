# Zulip Desktop Client

This is an experimental replacement for the [Zulip Desktop
app](https://github.com/zulip/zulip-desktop) implemented in
[Electron](http://electron.atom.io/).

The goal is to achieve feature-compatibility with the old desktop app
and then start adding cool features like easy support for
multi-account.

## Installation

Clone the source locally:

```sh
$ git clone https://github.com/zulip/zulip-electron
$ cd zulip-electron
```

Use your package manager to install `npm`.

If you're on Debian or Ubuntu, you'll also need to install
`nodejs-legacy`:

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
