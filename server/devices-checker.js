const schedule = require('node-schedule');
const storage = require('./storage');
const logger = require('./logger');

module.exports = {
  startCheck: function() {
    schedule.scheduleJob('*/20 * * * * *', () => {
      const devices = storage.get('devices') || {};
      Object.keys(devices).forEach(key => {
        let device = devices[key];
        logger.info(`start check ${ device.ipAddress }, mac address: ${ key }`);
        request({
          method: 'get',
          url: `http://${ device.ipAddress }/status`,
          timeout: 10000,
        }).then(response => JSON.parse(response)).then(({ status }) => {
          if(status !== 0) {
            throw new Error(`bad status code ${ status }`);
          }
          logger.info(`active device ${ device.ipAddress }, mac address: ${ key }`);
          device.inactiveTime = 0;
        }).catch(err => {
          logger.warn(err.message);
          logger.info(`found inactive device ${ device.ipAddress }, mac address: ${ key }`);
          if(typeof device.inactiveTime !== 'number') {
            device.inactiveTime = 0;
          } else {
            device.inactiveTime ++;
          }
          if(device.inactiveTime > 5) {
            logger.info(`remove device `, `devices.${ key }`);
            storage.remove(`devices.${ key }`);
          }
        });
      });
    });
  },
}
