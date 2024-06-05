# How to install

**Note:** If you download from the [releases page](https://github.com/zulip/zulip-desktop/releases), be careful what version you pick. Releases that end with `-beta` are beta releases and the rest are stable.

- **beta:** these releases are the right balance between getting new features early while staying away from nasty bugs.
- **stable:** these releases are more thoroughly tested; they receive new features later, but there's a lower chance that things will go wrong.

[lr]: https://github.com/zulip/zulip-desktop/releases

## macOS

**DMG or zip**:

1. Download [Zulip-x.x.x.dmg][lr] or [Zulip-x.x.x-mac.zip][lr]
2. Open or unzip the file and drag the app into the `Applications` folder
3. Done! The app will update automatically

**Using brew**:

1. Run `brew install --cask zulip` in your terminal
2. The app will be installed in your `Applications`
3. Done! The app will update automatically (you can also use `brew update && brew upgrade zulip`)

## Windows

**Installer (recommended)**:

1. Download [Zulip-Web-Setup-x.x.x.exe][lr]
2. Run the installer, wait until it finishes
3. Done! The app will update automatically

**Portable**:

1. Download [zulip-x.x.x-arch.nsis.7z][lr] [*here arch = ia32 (32-bit), x64 (64-bit)*]
2. Extract the zip wherever you want (e.g. a flash drive) and run the app from there

## Linux

**Ubuntu, Debian 8+ (deb package)**:

1. Download [Zulip-x.x.x-amd64.deb][lr]
2. Double click and install, or run `dpkg -i Zulip-x.x.x-amd64.deb` in the terminal
3. Start the app with your app launcher or by running `zulip` in a terminal
4. Done! The app will NOT update automatically, but you can still check for updates

**Other distros (Fedora, CentOS, Arch Linux etc)** :

1. Download Zulip-x.x.x-x86_64.AppImage[LR]
2. Make it executable using chmod a+x Zulip-x.x.x-x86_64.AppImage
3. Start the app with your app launcher

**You can also use `apt-get` (recommended)**:

- First download our signing key to make sure the deb you download is correct:

```bash
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv 69AD12704E71A4803DCA3A682424BE5AE9BD10D9
```

- Add the repo to your apt source list :

```bash
echo "deb [arch=amd64] https://download.zulip.com/desktop/apt stable main" |
  sudo tee -a /etc/apt/sources.list.d/zulip.list
```

- Now install the client :

```bash
sudo apt-get update
sudo apt-get install zulip
```
