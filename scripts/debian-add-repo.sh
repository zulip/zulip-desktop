#!/usr/bin/env bash

# Install apt repository source list if it does not exist
if ! grep ^ /etc/apt/sources.list /etc/apt/sources.list.d/* | grep zulip; then
  sudo apt-key adv --keyserver pool.sks-keyservers.net --recv 69AD12704E71A4803DCA3A682424BE5AE9BD10D9
  echo "deb https://dl.bintray.com/zulip/debian/ stable main" | \
  sudo tee -a /etc/apt/sources.list.d/zulip.list
fi
