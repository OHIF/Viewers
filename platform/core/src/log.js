const log = {
  error: null,
  warn: null,
  info: null,
  trace: null,
  debug: null,
  time: key => {
    log.timingKeys[key] = true;
  },
  timeEnd: key => {
    if (!log.timingKeys[key]) {
      return;
    }
    log.timingKeys[key] = false;
  },
  // Store the timing keys to allow knowing whether or not to log events
  timingKeys: {
    // script time values are added during the index.html initial load,
    // before log (this file) is loaded, and the log
    // can't depend on the enums, so for this case recreate the string.
    // See TimingEnum for details
    scriptToView: true,
  },
};

export default log;
