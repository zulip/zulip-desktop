# Version History

All notable changes to the Zulip desktop app are documented in this file.

### v5.4.3 --2020-09-10

**Security fixes**:
* CVE-2020-24582: Escape all strings interpolated into HTML to close cross-site scripting vulnerabilities that a malicious server could exploit.

**Dependencies**:
* Upgrade dependencies, including Electron 9.3.0.

### v5.4.2 --2020-08-12

**Potential Fixes**:
* macOS: Electron 9 upgrade is a potential fix for the ['grey screen issue'](https://chat.zulip.org/#narrow/stream/9-issues/topic/Grey.20Window.20on.20macOS) reported.

**Dependencies**:
* Upgrade all dependencies, including Electron 9.2.0.

### v5.4.1-beta --2020-07-29

**Fixes**:
* Resized the large application icon on macOS dock to be coherent with other icons.

**Potential Fixes**:
* macOS: Electron 9 upgrade is a potential fix for the ['grey screen issue'](https://chat.zulip.org/#narrow/stream/9-issues/topic/Grey.20Window.20on.20macOS) reported.

**Dependencies**:
* Upgrade all dependencies, including Electron 9.1.1.

### v5.4.0 --2020-07-21

**New features**:
* Added support for certificates from system store.
* Added support for Slovak as application language.

**Fixes**:
* Fix bug in *Copy Link* and add *Copy Email* option in context menu.
* Enable *Copy* option in context menu only when copying is possible.
* Remove leading and trailing separators in context menu on non-mac systems.
* ignoreCerts: Accommodate WebSocket URLs in certificate-error handler.

**Dependencies**:
* Upgrade all dependencies, including Electron 8.4.0.

**Deprecations**:
* This release supports certificates from Zulip store as well as system store. Zulip certificate store will be deprecated in the next release.
Users are hereby requested to move to system store. For more information, please see the [documentation](https://zulip.com/help/custom-certificates).

### v5.3.0 --2020-06-24

**Security fixes**:
* Remove the insecure ignoreCerts option.

**Fixes**:
* Windows: Turn off start at login by default.
* Fix zoom issues where some webviews would not get zoomed-out once zoomed-in.
* Fix overflowing contents on 'Add Organization' view.

**New features**:
* Add a cancel button in the report-issue modal.
* macOS: Use electron API to get dark tray icon instead of the green icon for the light theme.
* Remove 'Reset App Data' option. Factory Reset option has been moved to Settings → General.
* Support pkg installer on macOS.
* Use electron 8 built-in spellchecker. Linux and Windows users can now choose upto three spellchecker languages from Settings → General. On macOS, default spellchecker is used.
* Setup Transifex for better synchronization of translations. The application now supports 41 languages instead of 21.

**Dependencies**:
* Upgrade all dependencies, including Electron 8.3.3.

### v5.2.0 --2020-05-04

**Security fixes**:
* CVE-2020-12637: Do not ignore certificate errors in webviews unless the (unsupported, deprecated) `ignoreCerts` option is enabled.

**Fixes**:
* Avoid opening the file chooser dialog twice when downloading a file.

**New features**:
* Provide clipboard decryption helper for use in new social login flow.

**Dependencies**:
* Upgrade all dependencies, including Electron 8.2.5.

### v5.1.0 --2020-04-29

**Fixes**:
* macOS: If the app is in foreground, the app will no longer hide upon clicking on dock again.
* Synchronise debian scripts with electron-builder 22.4.1, thus fixing SUID sandbox binary issues.
* Dock icon on macOS used to be larger than the other applications, which is now updated to the appropriate size.
* Upon catching error in updating the server icon, the app will log the error and make a sentry report instead of triggering user-facing network error

**New features**:
* User can now set application language without changing the language on their operating system.

**Dependencies**:
* Upgrade all dependencies, including Electron 8.2.3.

### v5.0.0 --2020-03-30

**Security fixes**:
* CVE-2020-10856: Enable Electron context isolation. (Reported by Matt Austin.)
* CVE-2020-10857: Fix unsafe use of `shell.openExternal`/`shell.openItem`. (Reported by Matt Austin.)
  * Downloaded files will no longer be opened directly; the previous option to show downloaded files in the file manager is now always on.
* CVE-2020-10858: Add permission request handler to guard against audio/video recording by a malicious server. (Reported by Matt Austin.)

**New features**:
* Add an option to prompt for the location to save each downloaded file.

**Fixes**:
* Fix automatic launching at startup.
* Fix Undo and Redo functionality on macOS.

**Dependencies**:
* Upgrade all dependencies, including Electron 8.0.3.
* Remove `assert`, `cp-file`, `dotenv`, `electron-debug`, and `wurl`.

**Deprecations**:
* Since Electron upstream has discontinued support for 32-bit Linux, we will only provide 32-bit Linux builds on a best effort basis, and they will likely be removed in a future release.

### v4.0.3 --2020-02-29

**Security fixes**:
* CVE-2020-9443: Do not disable web security in the Electron webview. (Reported by Matt Austin.)

### v4.0.2-beta --2019-11-13

**New features**:
* Add support for MSI installers.
* Show badge count on Linux.
* Sync system presence info to web app.
* Add option to open notification settings from the context menu of organization icons in the sidebar. 
* Tackle network issues with each Zulip organization independently. 
* Add option to quit on closing the window.
* Make certificate location dynamic.
* Add option to specify network settings when adding a new organization.

**Enhancements**:
* Load last active tab before others, speeding up user experience and eliminating flashing of server icons. 
* Improve UX for notification settings.
* Set User-Agent from the main process for communication with the Zulip API.
* Add SSL troubleshooting guide in error message when adding an organization fails.

**Fixes**:
* Fix translations for `ru` locales.
* Fix trailing brackets in settings page. 
* Fix broken icon issue faced by the snap package on Linux. 
* Reactivate `network.js` script.
* Enable notarization for macOS Catalina. 

**Documentation**:
* Document enterprise configuration features. 
* Update the Electron tutorial guide. 
* Explicitly address where to report bugs in `README.md`. 
* Fix typo in the link to server/webapp repository in `README.md`. 
* Add documentation for translation.


### v4.0.0 --2019-08-08

**New features**:
* Add enterprise support using a custom config file for all Zulip users on a given machine. Documentation can be found [here](https://github.com/zulip/zulip-desktop/blob/master/docs/Enterprise.md).
* Support specification of preset organizations and automatic update preferences.
* Show setting tooltip when trying to change an admin-locked setting.
* Change translation API to handle Google Translate's rate limits.
* Change menu and language of all settings pages based on system locale.
* Disable the Window sub-menu.

**Fixes**:
* Use newer Darwin notification API in `electron_bridge`. 
* Revert to fallback character icon for an organization only when the icon is not available either on the Zulip server or stored offline on the disk.
* Fix issues with the Zoom In shortcut. 
* Sync the sidebar loading indicator with the loading GIF in the main view. 
* Fix shortcut symbol for Zoom In. 

**Development**:
* Add meta key for ⌘ on macOS.


### v3.1.0-beta --2019-07-19

**New features**:
* Add option to find accounts by email.
* Add option to hide Menu bar to View menu.
* Show a loading indicator in the sidebar.
* Update Help Center to open help page of the currently active server.
* Improve auto-detection of spellchecker language.
* Disable menu items on non-server pages.
* Support dark mode on macOS.

**Fixes**:
* Updated, more robust server validation logic.
* Fix JSON DB errors observed when switching tabs.
* Remove unused `isLoading` function from `Tab`.
* Remove unused `defaultId` parameter.
* Fix syntax error in `proxy-util.js`.
* Fix issue with creation of large `.node` files in the `Temp` folder on Windows machines.
* Fix issue where drafts were not saved properly.

**Development**:
* Migrate codebase to TypeScript.
* Set the indent_size in `.editconfig` to 4.
* Use `.env` file for reading Sentry DSN.

**Documentation**:
* Improve development guide.

**Module updates**:
* Upgrade xo to v0.24.0.
* Upgrade node-json-db to v0.9.2.
* Upgrade electron to v3.1.10.
* Add missing transitive dependencies.

### v3.0.0 --2019-05-20

**New features**:
* Add context menu in left sidebar.
* Enable per-user installation on Windows.
* Switch to next server on Ctrl+Tab.
* Add option to copy zulip URL.
* Allow zoom options from numpad.
* Use server language for spellchecker for all platforms.
* Allow installing app without admin privileges.
* Allow insecure requests on user request.
* Unify case across menus and settings.

**Enhancements**:
* Remove Found bug button.
* Set custom css to false by default.
* Disable beta updates if auto updates disabled
* Update menu items on setting page.
* Include certificates in all requests for icon.
* Document show sidebar shortcut properly.
* Improve organization page.
* Improve wording of adding a new org button.
* Increase width of add a new org button.
* Add eol for linebreaks on windows.
* Teach git to ignore unnecessary binary files.
* Send user-agent with request.
* Minimize to tray on startup.
* Update test config files.
* Ensure backward compatibility when using narrow.by_topic.
* Use path.sep for path separator to support Windows.
* Change the window title to contain active Realm's name.
* Use path.basename to get certificate file name.
* Disable pdf-viewer window.
* Default to starting app on login.
* Modify reset app data button.
* Add requestOptions to replace request instances.
* Workaround buggy focus switching in Electron 3.0.10.
* Reorder file menu and add option to Add Organization.
* Improve development guide.
* Implement CSS linting with stylelint.
* Add "role" key to webview property.
* Implement HTML Linting with htmlhint and fix indent.
* Limit the number of lines in log files.
* Fix focus after clicking back button.
* Remove minimize and close from File menu.
* Add config for installer name.

**Fixes**:
* Fix `request` ecdhCurve mismatch errors
* Fix typo in network error message.
* Fix context menu not working on adding new org.
* Fix reply from notification.
* Fix shorcut section horizontal alignment.
* Fix broken link in docs.
* Fix grammatical errors.
* Fix typo error in issue template.
* Fix text for Toggle DND in sidebar on hover.
* Fix focus after soft reload.
* Fix tip's place for Windows & Linux.


**Module updates**:
* Update node-json-db to v0.9.1.
* Update sentry to v0.12.1.
* Update electron-window-state to v5.0.3.
* Update electron to v3.0.10.
* Update electron-builder to v20.40.2.
* Update electron-sentry to v0.14.0.
* Update dependencies to fix minor dev security alerts.
* Update snap config.

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
