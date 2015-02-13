//#!本文件由share.js自动产生于Sun Apr 20 2014 22:13:27 GMT+0800 (CST), 产生命令行为: node share.js gen paintings CRUD ..
/**
 * paintings数据库访问类
 */
//基站数据访问
var inspect = require('util').inspect
  , ObjectID = require('mongodb').ObjectID
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Data = require('../mongo.js')
  , Helper = require('../mongo.js').Helper
  , extend = require('node.extend')
  , csv = require('csv')
  , cache = require('memory-cache');

// === 基本数据结构定义，按照实际需求修改 ===
// 用户评论表    
var painting_comment = new Schema({
    //_id : Schema.Types.ObjectId,

    // painting的id信息
    paintingId : Schema.Types.ObjectId,

    // 评注内容
    content : String,

    // 评注者名称
    commenter : String,

    // 评注时间
    commentTime : Date,

    // 赞的数量
    upVote : Number,

    // 踩的数量
    downVote : Number,

    //
    active : Boolean,

    // 评注在画面上的区域位置 
    area : {
      // 标记时的缩放级别
      zoom : Number,
      // 区域类型
      type :  {type : String} ,   //Rectangle , Circle, Polygon, Mark
      // Rectangle的边界
      bounds : [ Number ]
    }
},  { collection: 'painting_comment' });
painting_comment.index({ paintingId : 1 , commentTime : 1 });

exports.PaintingComment = mongoose.model('painting_comment', painting_comment);
var Module = exports.PaintingComment;

// === 基本功能实现函数,一般不用修改 ===
// 查询注释
exports.queryComment = function(cond, page, sort, fn){
  Module.find(cond)
    .sort(sort)
    .skip(page.skip)
    .limit(page.limit)
    .exec(function(err, docs){
        if(err) console.trace("query paintings page error:", err);

        fn(err, docs);
    });
}

// 创建新注释
exports.addComment = function(paintingId, data, fn){
  var comment = extend({}, data); 
  comment.paintingId = paintingId;
  comment.commentTime = new Date();

  Module.create(comment, function(err, saved){
    if(err) console.trace("add comment error:", err);

    fn(err, saved);
  });
}

// 更新注释内容
exports.updateComment = function(_id, data, fn){
  comment.commentTime = new Date();
  Module.update({_id: _id}, { $set : data },function(err){
    if(err) console.trace("update comment error:", err);

    fn(err, saved);
  });
}

// 增加某个注释的顶踩数量
exports.incCommentVote = function(_id, type, fn){
  var updater = { $inc : {} };
    updater.$inc[type] = 1;
  Module.findByIdAndUpdate( _id , updater, { new : true }, fn );
}

exports.list = function(cond, page, sort, fn){
  Module.find(cond)
    .sort(sort)
    .skip(page.skip)
    .limit(page.limit)
    .exec(function(err, docs){
      if(err) console.trace("query paintings page error:", err);

      fn(err, docs);
    });
}

exports.query = function(cond, sort, fn){
    Module.find(cond)
    .sort(sort)
    .exec(function(err, docs){
      if(err) console.trace("query paintings error:", err);

      fn(err, docs);
    });
}

//返回某个查询的返回值数量，主要用于分页
exports.count = function(cond, fn){
    Module.find(cond)
        .count(function(err, count){
          if(err) console.trace("query paintings count error:", err);

          fn(err, count);
        });
}

// 创建注释内容
exports.update = function(_id, obj, fn){
    Module.findByIdAndUpdate({_id : _id}
      , {$set : obj}
      , {new : true, upsert : true}, fn);

    // 清空全部缓存
    console.log("clear all cache");
    cache.clear();
}

exports.delete = function(_id, fn) {
    Module.remove({ _id : _id } , fn);
}


//按照ID查询对象
exports.findById = function(_id, fn){
  Module.findById(_id, function(err, doc){
    fn(err, doc.toObject());
  });
}

// ============================= 下面是单元测试用的代码 ================================
var isme = require('../sharepage.js').isme;
var tester = {
    testCreateComment: function(){
        exports.addComment('538054ebab18e5515c68a7ee'
          , { area : 
              { zoom : 12 , bounds :[ [1,1], [1,1],[1,1],[1,1]] }}
          , function(err, obj){
            if(err) console.trace(err);

            console.log(inspect(obj));
          })
    }
}

if(isme(__filename)){
  if(process.argv.length > 2 && isme(__filename)){
    testfn = process.argv[2];
    console.log("run test:%s", testfn);

    if(tester[testfn]){
      tester[testfn]();
    }
  }else{
    var testcmd = [];
    for(cmd in tester)
      testcmd.push(cmd);

    console.log('paintingsdb.js '+ testcmd.join('|'));
  }
}


