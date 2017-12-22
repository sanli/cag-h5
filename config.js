//config.js

/**
 * 开发状态配置文件
 */
var debug_config = {
	port : 80,
	// 当前系统运行级别 debug / release
	target : 'debug',
	// 发布版时间戳，用于生成今天文件的文件名
	stamp : '',
	// cdn network
	cdn : '',
	mongoURL : "mongodb://localhost/cag",
	// 使用mongodb session，不在需要skipSignin
	skipSignin : false,
	// 静态文件CDN
	cdn_url : 'https://cdn.ltfc.net',
	//cdn_url : 'http://cdn.ltfc.net',
	// 图片文件CDN
	media_url : 'http://cag.ltfc.net',
	// 分析服务地址，百度或者是google
	anailsysService : 'baidu', //  'google' 
	// 如果配置了redirect，将会把所有的访问重定向到新服务
	//redirect : "http://ltfc.net"
	express_log : 'dev',
	// 客户端测试 key
	clientkey : 'asdsdafasdfasdfasdsafdawqerqwezxvzx'
};

/**
 * 发布状态配置文件
 */
var release_config = {
	port : 8080,
	// 当前系统运行级别 debug / release
	target : 'release',
	// 发布版时间戳，用于生成今天文件的文件名
	stamp : '1427387849970',
	// 静态内容大部分保存在cdn上
	mongoURL : "mongodb://localhost/cag",
	// 是否跳过登录检测
	skipSignin : false ,
	// 静态文件CDN
	cdn_url : 'https://cdns.ltfc.net',
	//cdn_url : 'http://cdn.ltfc.net',
	// 图片文件CDN
	media_url : 'https://cags.ltfc.net',
	// 分析服务地址
	anailsysService : 'baidu', //  'google' 
	// 如果配置了redirect，将会把所有的访问重定向到新服务
	//redirect : "http://ltfc.net"
	// express_log
	express_log : 'default',
	// 客户端测试 key
	clientkey : 'this_is_a_release_but_still_is_a_test_key'
}
module.exports = debug_config;
// module.exports = release_config;
