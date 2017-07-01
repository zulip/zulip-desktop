# New release checklist -

## We need to cross check following things before pushing a new release + after updating electron version. This is just to make sure that nothing gets broken.
## - Desktop notifications
## - Spellchecker
## - Auto updates
  **Check for the logs in -**
  - **on Linux:** `~/.config/Zulip/log.log`
  - **on OS X:** `~/Library/Logs/Zulip/log.log`
  - **on Windows:** `%USERPROFILE%\AppData\Roaming\Zulip\log.log`
## - All the installer i.e.
  - Linux (.deb, AppImage)
  - Mac - (.dmg)
  - Windows - (web installer for 32/64bit)
## - Check for errors in console (if any)
## - Code signing verification on Mac and Windows
## - Tray and menu options
# We need to cross check all these things on -
- Windows 7
- Windows 8
- Windows 10
- Ubuntu 14.04/16.04
- macOSX



