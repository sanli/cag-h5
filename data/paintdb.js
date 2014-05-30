//paintdb.js

//user.js
var Collection = require('mongodb').Collection,
  Connection = require('mongodb').Connection,
  ObjectID = require('mongodb').ObjectID,
  debug = require('util').debug,
  inspect = require('util').inspect,
  db = require('../mongo.js').db,
  mongoose = require('mongoose'),
  Schema = require('mongoose').Schema;

/**
{
    "_id" : ObjectId("5343c5c0f883b828efa79fdf"),
    "filename" : "三希堂馆藏高清图库--明 文徵明 小楷《太上老君说常清静经》《老子列传》卷20.jpg",
    "filesize" : "39.1M",
    "format" : "JPEG",
    "size" : {
        "width" : 17508,
        "height" : 2469
    },
    "sourcePath" : "/Users/sanli/Desktop/中华珍宝馆/馆藏珍品/三希堂馆藏高清图库--明 文徵明 小楷《太上老君说常清静经》《老子列传》卷20.jpg"
}
 */
var painting = new Schema({
    _id : Schema.Types.ObjectId,

    // ---- 基本信息 ----
    paintingName : String,
    // 作者
    author : String,
    // 年代
    age : String,
    // 描述
    desc : String,
    // 文件大小，单位是M
    fileSize: String,
    // 像素大小，单位是M
    pixels : String,
    // 分辨率
    res : String,
    // 介质类型
    mediaType : String,
    // 面积大小
    areaSize : String,
    // 收藏者
    ownerName : String,
    // 最后修改时间
    updateTime : Date, 
    

    // ---- 展示配置 ----
    maxlevel: Number, 
    minlevel: Number,
    size : { width : Number, height : Number },
    snapsize : { width : Number, height : Number },
    // 展示的时候排序字段
    order : String,
    
    // 作品包含的文件列表
    files : [{
        size : { width : Number, height : Number },
        filesize: String,
        format : String,
        pixels : String,
        resolution : String,
        filename : String,
        orientation : String,
        printSize : String,
        // 文件名，包括路径
        fileName : String,
        sourcePath : String,
    }],

    // 是否有效
    active: Boolean

},  { collection: 'painting' });
painting.index({id : 1})
    .index({paintingName : 1});
var Painting = mongoose.model('painting', painting);
    exports.Painting = Painting;

// 图片文件信息库
var paintingFile = new Schema({
    _id : Schema.Types.ObjectId,

    // 文件名，包括路径
    fileName : String,
    sourcePath : String,
    verbose: String,
    // 基础信息
    indentify : Schema.Types.Mixed

},  { collection: 'painting_file' });
paintingFile.index({ fileName : 1 },{ unique: true });
var PaintingFile = mongoose.model('painting_file', paintingFile);
    exports.PaintingFile = PaintingFile;

exports.updatePaintinginfo = function(info, fn){
    Painting.update(
		{ paintingName : info.paintingName},
		{ $set : info },
		{ upsert : true },
		function(err){
			if(err)
				console.log("保存到MongoDB失败");

			fn(err);
		});
}


exports.getFileInfo = function(fileName, fn){
    PaintingFile.findOne({fileName : fileName}, function(err, fileInfo){
        if(err) return fn(err);
        if(!fileInfo) return fn(null, null);

        var info = fileInfo.toObject(),
            detail = JSON.parse(info.verbose);
        info.detail = detail;
        info.size = detail['size'];
        info.filesize = detail['Filesize'];
        info.pixels = detail['Number pixels'];
        info.format = detail['format'];
        info.orientation = detail['Orientation'];
        info.resolution = detail['Resolution'];
        info.printSize = detail['Print size'];

        fn(err, info);
    });
}

exports.updateFileInfo = function(info, fn){
    PaintingFile.update(
        { fileName : info.fileName},
        { $set : info },
        { upsert : true },
        function(err){
            if(err)
                console.log("保存到MongoDB失败");

            fn(err);
        });
}

exports.queryfile = function(query, project, sort, fn){
    if(typeof(project) === 'function'){
        fn = project;
        sort = {};
        project = {};
    }
    
	Painting.find(query, project)
        .sort(sort)
        .exec(function(err, fileinfos){
    		fn(err, fileinfos);
    	});
}
// ============================= 下面是单元测试用的代码 ================================
var isme = require('../sharepage.js').isme;
var tester = {
    testUpdateinfo: function(){
		exports.updateinfo({ 
			  filename: 't1.jpg',
			  sourcePath: 'testimg/t1.jpg',
			  size: { width: 12000, height: 4044 },
			  format: 'JPEG',
			  depth: '8',
			  res: '96x96 pixels/inch',
			  filesize: '38.9M',
			  orientation: 'TopLeft'
		}, function(err){
			if(err)
				return console.trace(err);

			console.log('update info success');
		});
    },

    testGetFileInfo : function(){
        exports.getFileInfo('明_沈周_田椿萱图_绢本_93.6x171.jpg', function(err, info){
            if(err) return console.trace(err);

            console.log(inspect(info));
        });
    },
}

if(isme(__filename)){
  if(process.argv.length > 2){
    testfn = process.argv[2];
    console.log("run test:%s", testfn);

    if(tester[testfn]){
        tester[testfn]();
    }
  }else{
    var testcmd = [];
    for(cmd in tester)
      testcmd.push(cmd)

    console.log( __filename + ' '+ testcmd.join('|'));
  }
}
