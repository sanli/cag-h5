//config.js

/**
 * 开发状态配置文件
 */
var debug_config = {
	// 当前系统运行级别 debug / release
	target : 'debug',
	// 发布版时间戳，用于生成今天文件的文件名
	stamp : '',
	// cdn network
	cdn : '',
	mongoURL : "mongodb://localhost/cag",
	// 跳过登录检测
	skipSignin : true
};

/**
 * 发布状态配置文件
 */
var release_config = {
	// 当前系统运行级别 debug / release
	target : 'release',
	// 发布版时间戳，用于生成今天文件的文件名
	stamp : '1402686452116',
	// 静态内容大部分保存在cdn上
	cdn : 'http://supperdetailpainter.u.qiniudn.com',
	mongoURL : "mongodb://localhost/cag",
	// 是否跳过登录检测
	skipSignin : false
}
module.exports = debug_config;
// module.exports = release_config;
