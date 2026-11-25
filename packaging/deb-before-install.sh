#!/bin/sh

# Clean up legacy APT configuration
rm -f /etc/apt/sources.list.d/zulip-desktop.list /etc/apt/trusted.gpg.d/zulip-desktop.asc

# Clean up configuration for the old Bintray repository, written by versions
# 1.8.1 through 5.5.0 and by our old installation instructions.  Zulip Server
# uses the same filename, so leave it alone if it lists anything else.
if [ -f /etc/apt/sources.list.d/zulip.list ] &&
    grep -q '^deb https://dl\.bintray\.com/zulip/debian/' /etc/apt/sources.list.d/zulip.list &&
    ! grep -Eqv '^(deb https://dl\.bintray\.com/zulip/debian/ (stable|beta) main)?$' /etc/apt/sources.list.d/zulip.list; then
    rm -f /etc/apt/sources.list.d/zulip.list
fi
