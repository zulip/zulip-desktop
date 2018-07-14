window.require = window.parent.require;
window.process = window.parent.process;
window.__dirname = window.parent.__dirname;
require('module').globalPaths.push('./node_modules');
require('module').globalPaths.push('./app/node_modules');
require('module').globalPaths.push('./app/renderer');
