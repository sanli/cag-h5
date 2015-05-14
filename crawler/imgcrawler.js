// imgcrawler.js
// 从一些博物馆网站上抓取高清图片，效果不是太好，但聊胜于无
var get = require('http').get,
	url = require('url');

// PS分块图片图片爬虫，从各个图片源抓去小块图片，并拼接成大图
// 国力故宫博物馆使用的是PS分块
function PSCrawler(datasrc){

	function getmeta(url, fn){
		var opt = url.parse(url);
		opt.head = {
			User-Agent : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.77.4 (KHTML, like Gecko) Version/7.0.5 Safari/537.77.4'
		};
		get(opt, function(res){
			console.log("返回状态码: " + res.statusCode);
			var xml = '';
			res.on('data', function(chunk){
				xml += chunk.toString();
			});
			res.on('end', function(){
				console.log('end with xml:'  + xml);
			});
		}).on('error', function(e){
			console.log('抓取元信息错误:',e);
			fn(e);
		});
	};


	var self ={
		_getmeta : getmeta,

		crawle : function(){
			var metaurl = datasrc + '/ImageProperties.xml';
			// calc meta
			getmeta(metaurl, function(err, meta){
				// download image

				// merge imgage
			});
		}
	};
	return self;
}