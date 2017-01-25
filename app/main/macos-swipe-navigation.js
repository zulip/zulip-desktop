// Adopted from
// https://github.com/wozaki/twitter-js-apps/blob/9bc00eafd575fd180dc7a450e1b1daf425e67b80/redux/src/main/renderer/registries/electron/swipeNavigatorImpl.js

'use strict'
const {remote} = require('electron');

const THRESHOLD_DELTA_X = 70;
const THRESHOLD_LIMIT_DELTA_Y = 50;
const THRESHOLD_TIME = 50;

// TODO avoid module global state
let tracking = false;
let deltaX = 0;
let deltaY = 0;
let startTime = 0;
let time = 0;

module.exports.register = function register() {
  remote.getCurrentWindow()
    .on('scroll-touch-begin', onScrollBegin)
    .on('scroll-touch-end', onScrollEnd)
    .on('swipe', onSwipe)

  window.addEventListener('wheel', onMouseWheel, {passive: true});
  window.addEventListener('beforeunload', remove);
}

const remove = module.exports.remove = function remove() {
  remote.getCurrentWindow()
    .removeListener('scroll-touch-begin', onScrollBegin)
    .removeListener('scroll-touch-end', onScrollEnd)
    .removeListener('swipe', onSwipe)

  window.removeEventListener('mousewheel', onMouseWheel);
  window.removeEventListener('beforeunload', remove);
}

function onSwipe(e, direction) {
  if (direction === 'left')
    remote.getCurrentWebContents().goBack()
  else if (direction === 'right')
    remote.getCurrentWebContents().goForward()
}

function onMouseWheel(e) {
  if (tracking) {
    deltaX = deltaX + e.deltaX
    deltaY = deltaY + e.deltaY
    time   = (new Date()).getTime() - startTime
  }
}

function onScrollBegin() {
  tracking  = true
  startTime = (new Date()).getTime()
}

function onScrollEnd() {
  if (time > THRESHOLD_TIME && tracking && Math.abs(deltaY) < THRESHOLD_LIMIT_DELTA_Y)
    if (deltaX > THRESHOLD_DELTA_X)
      remote.getCurrentWebContents().goForward()
    else if (deltaX < -THRESHOLD_DELTA_X)
      remote.getCurrentWebContents().goBack()

  tracking = false
  deltaX = 0
  deltaY = 0
  startTime = 0
}