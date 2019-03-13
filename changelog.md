# Version History

All notable changes to the Zulip desktop app are documented in this file.

### v2.3.82 --2018-09-25

**New features**:
* UI enhancements.
* Updated some menu items.

**Fixes**:
* Fix about page not opening up.

<hr>

### v2.3.8 --2018-09-25

**New features**:
* Auto hide menubar on Windows/Linux. Add a setting option for the same.
* Improve design of setting page.
* Toggle app on clicking the tray icon (Linux).
* Update sidebar realm name when it's changed in webapp.
* left-sidebar: Add initial character of realm name instead of default icon.

**Fixes**:
* linux: Fix ALT+SHIFT opening menu items on Linux.
* sentry: Add ignore errors to sentry configuration.
* Linux: Add label for help menu item.
* file-attachments: Allow multiple downloads of same file name.

**Module Updates**
* electron: Update electron to v2.0.9.


<hr>


### v2.3.7-beta --2018-09-03

**New features**:
* Add a feature to show and view pdf file in the app.

**Fixes**:
* Use package reload instead of custom reload. This is an experimental fix for setting files getting corrupted issue.
* Unescape server name in window menu item.

<hr>

### v2.3.6 --2018-08-27

**New features**:
* Add proxy details while validating a server. This fixes the server validating issue for users who are using the proxy settings. 


**Fixes**:

* Fix youtube video not playing in lightbox. 
* Fix realm name not escaped properly.

<hr>

### v2.3.5 --2018-08-03

**New features**:
* Add a setting option to show downloaded file in file manager.
* Added electron bridge to communicate with webapp in real time.

**Fixes**:

* Fix failing attached file downloads.
* Fix page_params error.
* gulpfile: Update syntax and methods for gulp v4.x.

<hr>

### v2.3.4-beta --2018-07-24

**Fixes**:
* Fix downloading functionality of file attachments.
* Fix null of downloadPath when settings.json fails.

<hr>

### v2.3.3 --2018-07-14

**Enhancements**:
* Add dock bounce effect on macOS
* Add a setting option to use the system proxy settings
* Add support for self/custom signed certificate
* Add Sentry support to get the bug reports
* Show a notification when a user clicks on file attachments and open the same in default native app 


**Fixes**:
* Fix auto-updates on Windows
* Fix image attachments not opening up in the app
* Security fix - Do proper HTML escaping for server data to avoid XSS attacks 
* Other minor fixes

**Updated dependencies**:

electron-builder: v20.20.4

electron-updater: v2.23.3

<hr>

### v2.3.2 --2018-05-28


This is a quick release since we recently updated the certificate for code signing the app and we want to make sure the previous versions of the app get auto-updates without any conflicts.

  <hr>

### v2.3.1 --2018-05-23

**Enhancements**:

* Add a new setting to disable auto-updates

* Add a menu item to check for updates manually

* Other minor improvements

**Fixes**:

* Fix app not rendering colors properly

*  **Security fix** - Do proper HTML escaping for server data to avoid XSS attacks

* Fix loading indicator when server is loaded
* Other minor fixes




**Updated dependencies**:

electron - `v2.0.1`

electron-builder - `v20.13.4`

electron-updater - `v2.21.10`

<hr>


### v2.2.0-beta --2018-05-08



**Enhancements**:

* Added do not disturb feature

* New DMG installer image

* Minor improvements



**Fixes**:

* Fix download functionality of file attachment links

* Fix tray icon not showing unread counts




**Updated dependencies**:

electron - `v2.0.0`

electron-builder - `v2.21.10`

electron-updater - `v2.21.8`


<hr>

### v2.0.0 -- 2018-04-20

**Enhancements**:

*  [Snap](https://snapcraft.io/zulip) support for Linux

* Add an option to download the file attachments instead of opening it in the browser

* Open image link in webapp lightbox

* Add scrollbar for list of organizations on overflow

* Better report issue UX

* Add F5 shortcut for reloading the app

* Responsive UI for connected orgs in smaller window sizes

* Minor improvements




**Fixes**:



* Remove unused shortcuts

* Update toggle sidebar shortcut to CMD/CTRL+SHIFT+S

* Warning dialog box for Reset App Settings

* Fix reinstall script for working across all platforms

* Other minor fixes



**Updated dependencies**:

* Update electron-builder to `v20.8.1`
<hr>



### v1.9.0 --2018-03-23

**Enhancements**:

* Major UI changes in the add new server and setting page

* Some users wanted to change the look of the Zulip. Now you have the power. Feel free to add your own CSS using the all-new setting option **Add Custom CSS**

* Added i18n locale helper script. Internalization is coming in the next release

* Added **What's new** in `help` submenu so that you can see all the latest changes in the app

* Other small improvements



**Fixes**:

* Add Zulip binary link to the bin. It was a regression we missed somehow. You can now start the app using `zulip` from a terminal [Linux]

* Fix app settings overriding issue. This bug was unnoticed from `v1.4.0`. The bug was overriding the app settings which was pretty bad. Don't worry this works as expected now



* Prevent drag and drop events to avoid few security risks

* Do not allow running insecure contents in the app

* The ugly white flickering in the webview is now fixed

* Fix position of left-sidebar on toggle

* Fix actions tooltip not visible on hover

* Other small fixes




**Updated dependencies**:

* electron - `v1.8.4`

* Spectron - `v3.8.0`



<hr>

### v1.8.2 --2018-02-27

**Enhancements**:

* Add bots mention support to reply option

* Show a notification when a new update available [Linux]

* Add back button in left-sidebar

* Add a Loading indication for new server button

* Improve help menu

* Add menu-item to reveal app logs in file manager

* Setting page and left-sidebar UI improvements

* Other minor improvements




**Fixes**:

* Fix broken last active tab

* Fix Zoom In shortcut

* Check whether the internet is working before reloading

* New organization link overlapping existing servers

* Disable electron-connect when it's run from npm start

* Do not auto-reload app when the system comes back from sleep

* Only toggle the setting state if the element is present

* Other minor fixes



**Updated dependencies**:

* electron - `v1.8.2`



<hr>

### v1.8.1 --2018-01-19

**Enhancements**:

* Reply from notifications [macOS]

* Add a setting option to start the app in the background

* 32-bit Debian installer

* 32-bit AppImage installer

* Automatically add apt-repo and GPG public keys on installing Debian file [Linux]

* Remove app data, config files etc on uninstalling Debian installer [Linux]

* Add logger utility for debugging that makes easier to sharing the apps



**Fixes**:

* Handle corrupted config files

* Reload full app on system hibernation
* Load default icon if organization icon is not available

* Focus app when a notification is triggered

* Reflect changes in the preference page (#362)

* Set the default value of flash taskbar setting [Windows]

* Rename Zoom In keyboard shortcut

* Fix checkDomain, so it checks all error codes

* Disable hardware acceleration to decrease the load on GPU

* Minor bug fixes



**Updated dependencies**:

* electron - `v1.7.10`

* electron-builder - `v19.53.6`

* electron-updater - `v2.18.2`


<hr>



### v1.7.0 --2017-11-24

**Enhancements**:

* Updated to Electron `v1.6.15`, electron-builder `v19.46.4`

* Improved setting page for new users

* On the developer side, we have added few tests to make sure app doesn't fail

* Minor improvements


<hr>


### 1.6.0-beta --2017-11-16

**Enhancements**:

* Added setting option to enable/disable spellcheck

* Added setting option to control Windows taskbar flashing [Windows]

* Auto-updates for Linux [AppImage]

* Better tray icons for retina display

* Reset app settings from Menu item

* Show detailed error message on invalid Zulip server



**Fixes**:

* Fixed a bug which was caused by app's shortcuts. From now on our shortcuts won't hijack other apps shortcuts

* Removed [electron-localshortcut](https://github.com/parro-it/electron-localshortcut) completely. Now we only depend on menu accelerators for keyboard shortcuts

* Handle certificate issue properly

* Other minor fixes

<hr>


### v1.5.0 --2017-10-11

**Enhancements**:

* Added an option to clear app data

* Added an option to show/hide desktop notifications

* Redesigned setting page

* Red dot over dock icon for PM [macOS]

* Show server-info on hovering the server icon




**Fixes**:

* Fetch correct organization icon from server_settings API

* Minor improvements


<hr>

### v1.4.0 --2017-09-04

**Enhancements**:

* Added proxy support

* Added setting option for badges

* Start app at login setting option

* Added app category for Linux

* Minor improvements in settings page

* apt-repo on bintray for linux - [here](https://bintray.com/zulip/debian/zulip-elec)



**Fixes**

* Fixed auto-updates

* Better warning message on certificate error

* Don't allow duplicate servers

<hr>


### 1.3.0-beta -- 2017-08-09

**Enhancements**:

* Added back/forward option under `History` submenu

* Added taskbar overlay icon [Windows]

* Added `Window` submenu by which users can switch to other servers

* Added flashing taskbar icon on incoming message [Windows]

* Option to hide the left sidebar

* Staged rollouts

* Minor style improvements




**Fixes**

* Handle focus event properly

* Open external links in default browser

* Allow user to change installation directory

* Fixed server-icon path error [Windows]

* Fixed server validation error

* Fetch server details from Zulip api

* Added tooltip in left sidebar

* Added publisher name in windows installer



**Updated dependencies**:

* electron - `v1.6.11`

* spellchecker - `v1.2.0`

* electron-builder - `v19.9.1`


<hr>

### v1.2.0-beta -- 2017-07-12

**Enhancements**:



* Added new setting page

* Setting for beta-updates. You can opt in for beta updates via selecting it from setting page

* Added Keyboard shortcuts to switch between multiple servers

* Desktop notifications support on Windows



**Fixes**

* Unregister keyboard shortcuts on windows close

* Show warning dialog while deleting server

* Allow server which is signed by root cert

* Other minor bug fixes

<hr>


### v1.1.0-beta --2017-06-23

**Enhancements**:

* New network error page. App will auto-reload once the network comes back
* Quit shortcut - CTRL+Q [Windows]
* Improved preferences



**Fixes**:

* Fixed power-monitor module error
* Fixed code signing error [macOS]

<hr>



### v1.0.0-beta --2017-06-21

**Enhancements**:

* Sign in to multiple teams
* Windows 7 desktop notification support
* Show badge count for each Zulip server
* Toggle window on clicking tray icon [Windows]

* Windows installer is properly code signed using [DigiCert](https://www.digicert.com/) certificate. You may get a warning regarding the certificate, please make it false positive


**Fixes**:

* Close/hide app properly
* Keep app running in background on clicking X


<hr>

### v0.5.10 --2017-05-12

**Enhancements**:

* Added self-signed server support
* Unread message counts in tray icon



<hr>

### v0.5.9 --2017-04-12

**Enhancements**:

* Properly signed app for macOS
* Toggle tray icon
* Better error handling when no internet connection



**Fixes**:

* Fixed permission issue on windows
* Fixed wrong keyboard shortcuts


<hr>

### v0.5.8 --2017-02-13

**Enhancements**:
Smaller Windows installer size

<hr>

### v0.5.7 --2017-02-08

Minor improvements



<hr>

### v0.5.6 --2017-02-07


**Enhancement**:

- Using NSIS instead of [Squirrel.Windows](https://github.com/Squirrel/Squirrel.Windows) on Windows

- Autoupdates: now using [electron-updater](https://www.npmjs.com/package/electron-updater)

- Removed nuts dependency


**Fixes**:

- Windows installer error
- Compile and build error in native node modules + spellchecker [Windows]
- Missing icon on installing [Windows]

<hr>


### v0.5.4 --2017-01-09

**Fixes**:
- Fixed :
    - Auto-updates
    - Spellchecker
    - Zooming functionality

- Removed unused node modules
- Using stable version for node modules
- Added icon for AppImage

<hr>


### v0.5.3 --2016-12-24
**Enhancements**:
- 🎉 Added automatic update support on Windows

**Fixes**:

- Fixed  javascript error when electron has been left running and try to right-click

- Fixed error - Unregister Spellchecker while window is closed

- Fixed - Keyboard shortcuts not getting unregistered

- Minor UI Changes


<hr>

### v0.5.2 --2016-12-13

**Enhancements**:

- ⚡️ Added automatic app updates for macOS
- Added windows installer for 32 bit machine

- Better tray icons

**Fixes**:
- Blurry Unity icon fixed



<hr>

### v0.5.1 --2016-11-23

**Enhancement**:

- Added Spellchecker support with correct spell suggestions

- Added Code-Signing on MAC

- Added Win/linux/Mac installers

- Added Continuous Integration on travis and appveyor

- Open internal links in app only and external in default browser

- Better icons

- Electron version updated to `v1.4.7`

- Using two package.json structure

- Node integration disabled in main window due to jquery error

- Now using electron-builder for packaging instead of electron-packager

- Removed electron-context-menu and simple-spellchecker dependency



**Fixes**:

- Better error handling when user enters wrong zulip server

- Fixed close Zulip window JavaScript error

- Fixed opening image in default browser

- Fixed native notifications issue on linux


<hr>

### v0.0.1-alpha -- 2016-08-31

**Enhancement**:

* Added DMG installer for macOS
