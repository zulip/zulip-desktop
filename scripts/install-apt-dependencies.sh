#!/usr/bin/env bash

# this script install all the apt
# dependecies required to run a build in
# a docker image on ci.

set -x
apt-get update -y &> /dev/null
apt-get install --no-install-recommends -y icnsutils \
gcc-multilib g++-multilib build-essential libxext-dev \
libxtst-dev libxkbfile-dev g++-multilib libxss-dev:i386 &> /dev/null
