const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const PouchDB = require('pouchdb');

// https://stackoverflow.com/questions/60881343/electron-problem-creating-file-error-erofs-read-only-file-system
function getAppDataPath(appName) {
  switch (process.platform) {
    case "darwin": {
      return path.join(process.env.HOME, "Library", "Application Support", appName);
    }
    case "win32": {
      return path.join(process.env.APPDATA, appName);
    }
    case "linux": {
      return path.join(process.env.HOME, `.${appName}`);
    }
    default: {
      console.log("Unsupported platform!");
      process.exit(1);
    }
  }
}

// todo if dev use appDataDirPath=${__dirname}/../
const appDataDirPath = getAppDataPath('OHIFViewer');
const pouchDBFolder = `${appDataDirPath}/__ohif-pouchdb-storage/`;

// TODO: mkdir -p instead
if (!fs.existsSync(appDataDirPath)) {
    fs.mkdirSync(appDataDirPath);
}

if (!fs.existsSync(pouchDBFolder)) {
  fs.mkdirSync(pouchDBFolder);
}

const CustomPouchDB = PouchDB.defaults({
  prefix: pouchDBFolder,
});

const app = express();

// Create a write stream (in append mode)
const logStream = fs.createWriteStream(path.join(appDataDirPath, 'data.log'), { flags: 'a' })
const pouchdbLog = path.join(appDataDirPath, 'pouchdb.log')
const options = { logPath: pouchdbLog };

// Setup the logger
app.use(morgan('dev', { stream: logStream }));
app.use('/', require('express-pouchdb')(CustomPouchDB, options));

const chronicle = new PouchDB('chronicle');

app.listen(5984, () => console.log(`PouchDB server listening on port 5984`));

module.exports = app;