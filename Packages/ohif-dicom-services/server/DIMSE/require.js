util = Npm.require("util");
fs = Npm.require('fs');
EventEmitter = Npm.require('events').EventEmitter;

quitWithError = function(message, callback) {
  return callback(new Error(message), null);
};