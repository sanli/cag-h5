// redis cache client
var redis = require("redis"),
	config = require('config.js'),
    client = redis.createClient();

var username = config.redisUsername;          	// 用户名（API KEY）
var password = config.redisPassword;  			// 密码（Secret KEY）
var db_host = config.redisHost;   
var db_port = config.redisPort;
var db_name = config.redisName;               	// 数据库名
var options = {"no_ready_check":true};
 
function init() {
  var client = redis.createClient(db_port, db_host, options);
  client.on("error", function (err) {
    console.log("Redis Error:" + err);
  });
 
  // 建立连接后，在进行集合操作前，需要先进行auth验证
  if(config.redisSigin)
  	client.auth(username + '-' + password + '-' + db_name);
 
  return client;
}
 
module.exports = init();