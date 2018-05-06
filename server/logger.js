const log4js = require('log4js');

log4js.configure({
  appenders: {
    console: {
      type: 'stdout',
    }
  },
  categories: {
    default: {
      appenders: ['console'],
      level: 'debug',
    }
  }
});

module.exports = log4js.getLogger();
