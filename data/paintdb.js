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
    paintingName : String,
    desc : String,
    maxlevel: Number, 
    minlevel: Number,
    filename: String,
    sourcePath : String,

    size : { width : Number, height : Number },
    filesize: String,
    format : String,
    depth : String,
    res : String,
    filename : String,
    orientation : String

    // 是否有效
    active: Boolean,
    // 作品名称
    name : String,
    // 作者
    author : String,
    // 年代
    age : String,
    // 描述
    desc : String  
},  { collection: 'painting' });
painting.index({id : 1})
    .index({filename : 1})
    .index({sourcePath : 1});
var Painting = mongoose.model('painting', painting);
    exports.Painting = Painting;

exports.updateinfo = function(info, fn){
	Painting.update(
		{ filename : info.filename},
		{ $set : info },
		{ upsert : true },
		function(err){
			if(err)
				console.log("保存到MongoDB失败");

			fn(err);
		});
}

exports.queryfile = function(query, fn){
	Painting.find(query, function(err, fileinfos){
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
    }
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
