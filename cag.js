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
  , logger = require('./logger.js')
  , inspect = require('util').inspect
  , conf = require('./config.js')
  , mongo = require('./mongo.js');

var app = express();
app.set('x-powered-by', false)
app.set('port', process.env.PORT || conf.port );
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public'), { maxAge : 31536000000 }));
app.use(require('serve-favicon')(__dirname + '/public/favicon.ico'));
app.use(require('morgan')('combined'));
app.use(require('compression')());

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true })) ;
app.use(bodyParser.json());

app.use(require('method-override')());
app.use(require('cookie-parser')('cag-h5-bala-bala'));

var session = require('express-session'),
    MongoStore = require('connect-mongo')(session);
// 每次访问URL都会导致一次session查询，每次修改session内容都会导致写入数据库
// 所以修改session内容需要谨慎考虑性能，请参考以下URL进行配置:
// https://www.npmjs.com/package/connect-mongo
app.use(session({ 
  secret: 'china-art-for-chinese-people', 
  saveUninitialized: true,
  resave: false,  // 避免重复的写入session
  cookie: { 
    maxAge: 31536000000 // cookie存活一年
  }, 
  store: new MongoStore({ 
    //instance: mongo.mongoose, 
    mongooseConnection: mongo.mongoose.connection,
    collection: 'sessions2', 
    stringify : false,
    autoRemove: 'native',  // session实效时间和cookie一样长
    touchAfter: 24 * 3600, // 每隔1天才会自动刷新一次session到数据库
  }) 
}));

//处理未解决异常
//var errorhandler = require('errorhandler');
//app.configure('development', function(){
//  app.use(require('errorhandler')({log: errorNotification}));
//});
// function errorNotification(err, str, req) {
//   var title = '发生没有处理的错误: ' + req.method + ' ' + req.url
// }

// 系统模块
app.use(express.static(path.join(__dirname, 'sharepage/sys/public')));
require('./sharepage/sys/routes/userctl').bindurl(app);
require('./sharepage/sys/routes/sys_userctl').bindurl(app);

// load module
require('./routes/mainctl').bindurl(app);
require('./routes/exhibitctl').bindurl(app);
require('./routes/paintingsctl').bindurl(app);
require('./routes/commentctl').bindurl(app);
require('./routes/touristctl').bindurl(app);
require('./routes/bookmarkctl').bindurl(app);


var server = http.createServer(app).listen(app.get('port'), function(){
	logger.info("启动web服务，在以下端口监听：" + app.get('port'));
});