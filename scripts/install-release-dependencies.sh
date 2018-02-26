#!/usr/bin/env bash

set -e
if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  sudo apt-get install --no-install-recommends -y icnsutils

  # to build 32 bit from a machine with 64 bit
  sudo apt-get install --no-install-recommends -y gcc-multilib g++-multilib
fi
