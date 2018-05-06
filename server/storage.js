const Storage = require('node-storage');

const storage = new Storage(`${ __dirname }/../db.json`);

module.exports = storage;
