/**
 *  MongoDB 访问
 */

var Db = require('mongodb').Db,
  Collection = require('mongodb').Collection,
  Connection = require('mongodb').Connection,  
  Server = require('mongodb').Server,
  ObjectID = require('mongodb').ObjectID,
  http = require('http'),
  debug = require('util').debug,
  inspect = require('util').inspect
  lazy = require('lazy'), 
  fs = require('fs'),
  http = require('http');

//使用mongoose访问MongoDB
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/cag',{
  db: { native_parser: true, safe:true },
});
var mdb = mongoose.connection;
mdb.on('error', console.error.bind(console, 'mongoose db connection error:'));
mdb.once('open', function callback (err) {
	console.log("mongoose连接DB成功...");
});


