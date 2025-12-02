# Development Setup

This is a guide to running the Zulip desktop app from source,
in order to contribute to developing it.

## Prerequisites

To build and run the app from source, you'll need the following:

- [Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
  - Use our [Git Guide](https://zulip.readthedocs.io/en/latest/git/setup.html) to get started with Git and GitHub.
- [Node.js](https://nodejs.org) (latest LTS version)
- [pnpm](https://pnpm.io/installation)
- [Python](https://www.python.org/downloads/)
- A C++ compiler

### Ubuntu/Linux and other Debian-based distributions

On a system running Debian, Ubuntu, or another Debian-based Linux
distribution, you can install all dependencies through the package
manager (see [here][node-debian] for more on the first command):

```sh
$ curl -sL https://deb.nodesource.com/setup_24.x | sudo -E bash -
$ sudo apt install git nodejs python build-essential
$ corepack enable
```

[node-debian]: https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

### MacOS

On a system running MacOS, you can refer to [official nodejs docs][node-mac] to
install nodejs. To ensure Node.js has been installed, run `node -v` in terminal to know your node version.

[node-mac]: https://nodejs.org/en/download/package-manager/#macos

### Windows

- Download Node.js for Windows and install it. You can refer to the official docs [here][node-windows] to do so. To ensure Node.js has been installed, run `node -v` in Git Bash to know your node version.

[node-windows]: https://nodejs.org/en/download/package-manager/#windows

- Also, install Windows-Build-Tools to compile native node modules by using
  ```sh
  $ npm install --global windows-build-tools
  ```

## Download, build, and run

Clone the source locally:

```sh
$ git clone https://github.com/zulip/zulip-desktop
$ cd zulip-desktop
```

Install project dependencies:

```sh
$ pnpm install
```

Start the app:

```sh
$ node --run start
```

Run tests:

```sh
$ node --run test
```

## How to contribute?

Feel free to fork this repository, test it locally and then report any bugs
you find in the [issue tracker](https://github.com/zulip/zulip-desktop/issues).

You can read more about making contributions in our [Contributing Guide](./CONTRIBUTING.md).

## Making a release

To package the app into an installer:

```sh
node --run dist
```

This command will produce distributable packages or installers for the
operating system you're running on:

- on Windows, a .7z nsis file and a .exe WebSetup file
- on macOS, a `.dmg` file
- on Linux, a plain `.zip` file as well as a `.deb` file, `.snap` file and an
  `AppImage` file.

To generate all three types of files, you will need all three operating
systems.

The output distributable packages appear in the `dist/` directory.
