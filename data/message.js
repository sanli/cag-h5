// 发布到客户端的消息内容
exports.getMessages = function(){
	return messages;
}

// 消息内容
var messages =  [
{ 	
	title: '上线当代艺术馆，发布当代画家新藏品', 
	time: '2014-08-16', 
	content: '发布当代画家新藏品:<a href="http://zhenbao.duapp.com/img.html?uuid=53e9d3f6818d71507b09ce9c&view=paintingview#uuid=53e9d3f6818d71507b09ce9c&view=paintingview">李友朋 青蕊黄花</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53e9bf5f818d71507b09ce98&view=paintingview#uuid=53e9bf5f818d71507b09ce98&view=paintingview">李友朋 老树依沙岸</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53e9bf5f818d71507b09ce96&view=paintingview#uuid=53e9bf5f818d71507b09ce96&view=paintingview">李友朋 山水册页1</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53e9bf5f818d71507b09ce97&view=paintingview#uuid=53e9bf5f818d71507b09ce97&view=paintingview">李友朋 山水册页2</a><br>以及其他精品:<a href="http://zhenbao.duapp.com/img.html?uuid=53e9c93f818d71507b09ce9a&view=paintingview#uuid=53e9c93f818d71507b09ce9a&view=paintingview">欧阳修 行楷书灼艾帖</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53e9bf5f818d71507b09ce95&view=paintingview#uuid=53e9bf5f818d71507b09ce95&view=paintingview">陈枚  院本清明上河图全卷</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53e9bf5f818d71507b09ce90&view=paintingview#uuid=53e9bf5f818d71507b09ce90&view=paintingview">魏之克 山水金陵四季图</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53e9bf5f818d71507b09ce8c&view=paintingview#uuid=53e9bf5f818d71507b09ce8c&view=paintingview">李白 上阳台帖</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53e9bf5f818d71507b09ce85&view=paintingview#uuid=53e9bf5f818d71507b09ce85&view=paintingview">米芾 蜀素帖卷</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53e9bf5f818d71507b09ce82&view=paintingview#uuid=53e9bf5f818d71507b09ce82&view=paintingview">趙孟頫 書趵突泉詩卷</a>等25幅珍品'
},
{ 	
	title: '发布软件新版本', 
	time: '2014-08-04', 
	content: 'iphone/ipad版本中华珍宝馆在<a href="https://itunes.apple.com/cn/app/zhong-hua-zhen-bao-guan/id905220385?mt=8">苹果AppStore</a>发布。安卓客户端版本在<a href="http://app.mi.com/detail/68520">小米商店</a>，360商店，安卓市场等Android市场上线，适配4.0以上的各种Android机型，支持缓存后离线观看。</div>'
},
{ 	
	title: '发布新藏品', 
	time: '2014-07-18', 
	content: '<a href="http://zhenbao.duapp.com/img.html?uuid=53c89d01f9725cbf5ec9c8b6&view=paintingview#uuid=53c89d01f9725cbf5ec9c8b6&view=paintingview">顾闳中 韩熙载夜宴图卷(宋摹本)</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53c89d01f9725cbf5ec9c8b8&view=paintingview#uuid=53c89d01f9725cbf5ec9c8b8&view=paintingview">周东卿 鱼乐图卷</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53c89d01f9725cbf5ec9c8b9&view=paintingview#uuid=53c89d01f9725cbf5ec9c8b9&view=paintingview">夏圭  溪山清远图卷</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53c89d01f9725cbf5ec9c8bc&view=paintingview#uuid=53c89d01f9725cbf5ec9c8bc&view=paintingview">冯承素 摹兰亭序卷</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53c89d01f9725cbf5ec9c8bd&view=paintingview#uuid=53c89d01f9725cbf5ec9c8bd&view=paintingview">孙位  高逸图卷</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53c89d01f9725cbf5ec9c8c1&view=paintingview#uuid=53c89d01f9725cbf5ec9c8c1&view=paintingview">李成  茂林远岫图</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53c89d01f9725cbf5ec9c8c4&view=paintingview#uuid=53c89d01f9725cbf5ec9c8c4&view=paintingview">仇英  临惯休白描罗汉图</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53c89d01f9725cbf5ec9c8c5&view=paintingview#uuid=53c89d01f9725cbf5ec9c8c5&view=paintingview">撫松觀瀑</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53c89d01f9725cbf5ec9c8c9&view=paintingview#uuid=53c89d01f9725cbf5ec9c8c9&view=paintingview">袁江  别苑观览图卷</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53c89d01f9725cbf5ec9c8c7&view=paintingview#uuid=53c89d01f9725cbf5ec9c8c7&view=paintingview">白莲社图卷</a>等15幅珍品'},
{ 
	title: '发布新藏品',  
	time: '2014-07-11', 
	content: '<a href="http://zhenbao.duapp.com/img.html?uuid=53bf90d2d2e0725ca668ff9c&view=paintingview#uuid=53bf90d2d2e0725ca668ff9c&view=paintingview">文徵明 小楷太上老君说常清静经老子列传卷</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53bf90d1d2e0725ca668ff9a&view=paintingview#uuid=53bf90d1d2e0725ca668ff9a&view=paintingview">赵佶  五色鸚鵡图卷</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53bf90d2d2e0725ca668ff9b&view=paintingview#uuid=53bf90d2d2e0725ca668ff9b&view=paintingview">陈容  墨龙卷</a>，<a href="http://zhenbao.duapp.com/img.html?uuid=53bf90d1d2e0725ca668ff99&view=paintingview#uuid=53bf90d1d2e0725ca668ff99&view=paintingview">范宽  谿山行旅图轴  </a> 等20幅珍品'}
]