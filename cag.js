/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , extend = require('node.extend')
  , http = require('http')
  , path = require('path')
  , Data = require('./mongo.js')
  , sharepage = require('./sharepage')
  , logger = require('tracer').console()
  , inspect = require('util').inspect
  , conf = require('./config.js');

var app = express();

app.configure(function(){
  // 百度引擎使用18080为webapp端口
  app.set('port', process.env.PORT || conf.port );
  app.engine('.html', require('ejs').__express);
  app.set('views', __dirname + '/views');
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.compress());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('cag-h5-bala-bala'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public'), { maxAge : 86400000 }));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// load module
require('./routes/mainctl').bindurl(app);
require('./routes/userctl').bindurl(app);
require('./routes/paintingsctl').bindurl(app);
require('./routes/commentctl').bindurl(app);

var server = http.createServer(app).listen(app.get('port'), function(){
	logger.log("启动web服务，在以下端口监听：" + app.get('port'));
});
