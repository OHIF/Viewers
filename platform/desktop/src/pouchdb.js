console.log('Starting PouchDB...');

var express = require('express');
var morgan = require('morgan');
var PouchDB = require('pouchdb');
var app = express();

app.use(morgan('dev'));

var CustomPouchDB = PouchDB.defaults({
  prefix: `${__dirname}/../__ohif-pouchdb-storage/`,
});

app.use('/', require('express-pouchdb')(CustomPouchDB));

var chronicle = new PouchDB('chronicle');

app.listen(5984);
