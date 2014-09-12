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
  , paintdb = require('./paintdb.js') 
  , cache = require('memory-cache');

// === 基本数据结构定义，按照实际需求修改 ===
// 用于展示的展示的PaintingView信息，和Painting表的不同是，PaintingView存储的信息全部与前台展示有关。
// Painting中记录的是作品的原始信息，是切图程序生成的数据。
var painting_view = new Schema({
    _id : Schema.Types.ObjectId,

    // painting的id信息
    // paintingId : String,

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
    snapSize : { width : Number, height : Number },
    // 展示的时候排序字段
    order : String,
    
    // 是否有效
    active: Boolean,
    // 是否列在首页推荐
    essence: Boolean,
    // 推荐说明
    essenceComment: String,
    // 首页推荐中的排序顺序字段
    essenceSort : String,
    // 普通现实中的排序字段
    commonSort : String,

    // 观摩次数
    viewCnt : Number,
    // 描述性文字页面
    descUrl : String,
    // 用户评论数量
    commentCnt : Number
},  { collection: 'painting_view' });
painting_view.index({_id : 1})
    .index({paintingName : 1})
    .index({author : 1})
    .index({age : 1});;
var PaintingView = mongoose.model('painting_view', painting_view);
    exports.PaintingView = PaintingView;

var Module = PaintingView;

// === 基本功能实现函数,一般不用修改 ===
// 增加某个图片的访问计数
exports.incViewCount = function(_id, fn){
  Module.update({_id : _id}, { $inc : { viewCnt: 1} }, fn);
}

// 查询某个艺术品详细信息
exports.queryfile = function(query, project, sort, fn, nocache){
    if(typeof(project) === 'function'){
        fn = project;
        sort = {};
        project = {};
    }
    
    if(!nocache){
        var key = "fileinfo:" + JSON.stringify(query),
            fileinfos = cache.get(key);
        if(fileinfos){
            console.log("load from cache, key:" + key);
            return fn(null, fileinfos);
        }    
    }
    

    Module.find(query, project)
        .sort(sort)
        .exec(function(err, fileinfos){
            if(err) console.trace(err);

            if(!nocache){
                console.log("put object to cache key:%s", key);
                cache.put(key, fileinfos);    
            }
            fn(err, fileinfos);
        });
}

// 返回所有作品大纲
//    { 年代 : { 作者 : ['xxxx', 'xxxx'] } } 
exports.outline = function(query, fn){

    var key = 'outline:all',
        outline = cache.get(key);
    if(outline)
        return fn(null, outline);

    Module.collection.aggregate( 
        { $match : query }
        , { $sort : { author : 1, paintingName : 1 } }
        , { $group : { _id: '$author' , paintings : { $push : '$paintingName'} , age : { $first : '$age'} }  }
        , { $project : {  "author.name" : "$_id", "author.paintings" : '$paintings' , age: 1 } }
        , { $group : { _id : '$age' , authors : { $push : '$author'}} }
        , function(err, outline){
            if(err) console.trace(err);

            console.log("put object to cache key:%s", key);
            cache.put(key, outline);
            fn(err, outline);
        });
}


exports.list = function(type, cond, page, sort, fn){
  Module.find(cond)
    .sort(sort)
    .skip(page.skip)
    .limit(page.limit)
    .exec(function(err, docs){
      if(err) console.trace("query paintings page error:", err);

      fn(err, docs);
    });
}

exports.query = function(type, cond, sort, fn){
    Module.find(cond)
    .sort(sort)
    .exec(function(err, docs){
      if(err) console.trace("query paintings error:", err);

      fn(err, docs);
    });
}

//返回某个查询的返回值数量，主要用于分页
exports.count = function(type, cond, fn){
  Module.find(cond)
    .count(function(err, count){
      if(err) console.trace("query paintings count error:", err);

      fn(err, count);
    });
}

exports.update = function(_id, obj, fn){
  Module.update({_id : _id}, {$set : obj}, {upsert : true}, fn);

  // 清空全部缓存
  console.log("clear all cache");
  cache.clear();
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
  testImportCSV: function(){
    exports.importCSV ("../uploads/td_tmpl.csv", 'td', function(err, cnt){
      if(err) return console.log("import err", err);
      console.log("import success, count:" + cnt );
    });
  }
}

if(isme(__filename)){
  if(process.argv.length > 2 && isme(__filename)){
    testfn = process.argv[2];
    console.log("run test:%s", testfn);

    if(tester[testfn]){
      Data(function(){ 
        console.log("连接已建立");
        tester[testfn]();
      });   
    }
  }else{
    var testcmd = [];
    for(cmd in tester)
      testcmd.push(cmd);

    console.log('paintingsdb.js '+ testcmd.join('|'));
  }
}


