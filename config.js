//config.js

/**
 * 开发状态配置文件
 */
var debug_config = {
	port : 8080,
	// 当前系统运行级别 debug / release
	target : 'debug',
	// 发布版时间戳，用于生成今天文件的文件名
	stamp : '',
	// cdn network
	cdn : '',
	mongoURL : "mongodb://localhost/cag",
	// 跳过登录检测
	skipSignin : true,
	// CDN服务器的URL
	cdn_url : '',
	// 分析服务地址，百度或者是google
	anailsysService : 'baidu', //  'google' 
	// 如果配置了redirect，将会把所有的访问重定向到新服务
	//redirect : "http://ltfc.net"
};

/**
 * 发布状态配置文件
 */
var release_config = {
	port : 8080,
	// 当前系统运行级别 debug / release
	target : 'release',
	// 发布版时间戳，用于生成今天文件的文件名
	stamp : '1402686452116',
	// 静态内容大部分保存在cdn上
	cdn : 'http://supperdetailpainter.u.qiniudn.com',
	mongoURL : "mongodb://localhost/cag",
	// 是否跳过登录检测
	skipSignin : false ,
	// CDN服务器的URL
	cdn_url : 'http://cag.share-net.cn',
	// 分析服务地址
	anailsysService : 'baidu', //  'google' 
	// 如果配置了redirect，将会把所有的访问重定向到新服务
	//redirect : "http://ltfc.net"
}
module.exports = debug_config;
// module.exports = release_config;
