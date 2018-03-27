#!/usr/bin/env bash

set -e
if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  echo "installing apt packages: icnsutils, gcc-multilib, g++-multilib"
  sudo apt-get install --no-install-recommends -y icnsutils &> /dev/null

  # to build 32 bit from a machine with 64 bit
  sudo apt-get install --no-install-recommends -y gcc-multilib g++-multilib &> /dev/null
fi
