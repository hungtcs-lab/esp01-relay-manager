const express = require('express');
const request = require('request-promise-native');
const storage = require('./storage');

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get('/register', (req, res) => {
  let { ipAddress, macAddress, type="default" } = req.query;
  const devices = storage.get('devices') || {};
  devices[macAddress] = { ipAddress, type };
  storage.put('devices', devices);
  res.json({
    status: 0,
    message: 'register success'
  });
});

app.get('/list', (req, res) => {
  const devices = storage.get('devices') || {};
  const list = Object.keys(devices).map(key => {
    let { ipAddress, type } = devices[key];
    return {
      macAddress: key,
      ipAddress, type,
    };
  });
  res.json({
    status: 0,
    data: list,
  });
});

app.get('/turn/:operation/:macAddress', (req, res) => {
  const { operation, macAddress } = req.params;
  if(!['on', 'off'].includes(operation)) {
    res.json({
      status: -3,
      message: 'unknow operation'
    });
    return;
  }
  const devices = storage.get('devices') || {};
  let device = devices[macAddress];
  if(device) {
    request({
      method: 'get',
      url: `http://${ device.ipAddress }/${ operation }`,
    }).then(response => JSON.parse(response)).then(({ status, data }) => {
      if(status === 0) {
        res.json({
          status: 0,
          data,
          message: `trun ${ operation } device success`,
        });
      } else {
        throw new Error(`bad status code ${ status }`);
      }
    }).catch(err => {
      res.json({
        status: -2,
        message: 'trun on device faild',
        error: err,
      });
    });
  } else {
    res.json({
      status: -1,
      message: 'device not found',
    });
  }
});

app.get('/status/:macAddress', (req, res) => {
  const { macAddress } = req.params;
  const devices = storage.get('devices') || {};
  const device = devices[macAddress];
  if(device) {
    request({
      method: 'get',
      url: `http://${ device.ipAddress }/status`,
    }).then(response => JSON.parse(response)).then(({ status, data }) => {
      if(status === 0) {
        res.json({ status, data });
      } else {
        throw new Error(`bad status code ${ status }`);
      }
    }).catch(err => {
      res.json({
        status: -2,
        message: 'get device status faild',
        error: err,
      });
    });
  } else {
    res.json({
      status: -1,
      message: 'device not found',
    });
  }
});

app.all('*', (req, res) => {
  res.status(404).send('Not Found');
});

module.exports = app;
