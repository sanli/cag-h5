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
  , cache = require('memory-cache')
  , async = require('async');

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
    // 是否特别标记出来
    commented : Boolean,
    // 备注信息
    comment : String,
    // picture version
    version : String,

    // ---- 删除信息 ----
    // 是否删除
    deleted : Boolean,
    // 删除原因
    deleteReason : String,

    // ---- 编辑录入 ----
    // 是否发布
    active: Boolean,
    // 发布时间，用于查询最新发布
    activeTime : Date,
    // 发布时间排序
    activeSort : String,
    // 是否列在首页推荐
    essence: Boolean,
    // 推荐说明
    essenceComment: String,
    // 首页推荐中的排序顺序字段
    essenceSort : String,
    // 普通现实中的排序字段
    commonSort : String,
    // 图片资源级别: 高清原拍, 高清转扫，中清原拍，中清转扫，聊胜于无
    resourceLevel : String,
    // 画作级别: 绘画做平的级别
    paintingLevel : String,
    // 对画作的整体评价，综合考虑各个因素得到
    // ['五级-普清','四级-半高清','三级-高清','二级-超高清','一级-如实物','特级-超实物'],
    overallLevel : String,
    // 作品标签，用于对查询结果进行过滤
    // 书法、楷书、行书、篆书、法帖、碑刻、国画、山水、工笔画、文人画...
    tags : [String],
    // 是否放入铭心绝品栏目
    mylove: Boolean,
    // 在铭心绝品栏目中的顺序
    myloveSort : String,

    // --- 下载配置 ---
    // 离线包下载路径
    offlineUrl : String,
    // 原始包下载路径，支持两种来源
    //  baiduyun://{百度云_URL}|{pass}, 
    //  http://{url} , 
    originalUrl : String,
    // 百度云盘路径, 自动匹配，如果匹配不到需要手工匹配
    baiduyunPath : String,
    
    // 观摩次数
    viewCnt : { type : Number, default : 0 },
    // 描述性文字页面
    descUrl : String,
    // 用户评论数量
    commentCnt : Number,

    // ---- 画集相关字段 ----
    // 是否是一个画集
    isCollection : Boolean,
    //  所属画集,如果为空表示不属于任何画集
    belongCollection : Schema.Types.ObjectId,
    //  在画集中的排序
    collectionSort : String,
    //  如果是画集，这个字段存放包含的所有画作
    includeCollections : [Schema.Types.ObjectId],

    // ---- 广告相关字段 ----
    // 广告链接
    advUrl : String,
    // 广告描述
    advDesc : String,

    // ---- 通用字段 ----
    // 最后修改时间
    utime : Date,
    // 最后修改时间

},  { collection: 'painting_view' });
painting_view.index({_id : 1})
    .index({paintingName : 1})
    .index({author : 1})
    .index({tags : 1})
    .index({age : 1})
    .index({belongCollection : 1, collectionSort : 1})

    .index({mylove : 1, myloveSort: 1})
    .index({essence:1, essenceSort : 1})
    .index({active:1, activeSort : 1});

var PaintingView = mongoose.model('painting_view', painting_view);
    exports.PaintingView = PaintingView;



var Module = PaintingView;

// === 基本功能实现函数,一般不用修改 ===
// 增加某个图片的访问计数
exports.incViewCount = function(_id, fn){
    Module.update({_id : _id}, { $inc : { viewCnt: 1 } }, fn);
}

// 查询某个艺术品详细信息
exports.queryfile = function(query, project, sort, fn, page){
    page = page || { skip : 0, limit : 50 };
    if(typeof(project) === 'function'){
        fn = project;
        sort = {};
        project = {};
    }

    console.log(query);
    Module.find(query, project)
        .sort(sort)
        .skip(page.skip)
        .limit(page.limit)
        .exec(function(err, fileinfos){
            if(err) console.trace(err);

            fn(err, fileinfos);
        });
}

// 年代排序顺序
var ageSort = {
  "晋" : 9,
  "东晋" : 10,
  "西晋" : 20,
  "五代" : 30,
  "隋" : 40,
  "唐" : 50,
  "宋" : 59,
  "北宋" : 60,
  "南宋" : 70,
  "金" : 80,
  "元" : 90,
  "明" : 100,
  "明清" : 105,
  "清" : 110,
  "近代" : 120,
  "当代" : 130,
  "现代" : 140,
  "日本" : 150,
  "朝鲜" : 160,
  "法国" : 170,
  "西方" : 180,
  "UNKNOWN" : 9999
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

            outline.sort(function(age1, age2){
                var v1 = ageSort[age1._id] ?  ageSort[age1._id] : ageSort['UNKNOWN'],
                    v2 = ageSort[age2._id] ?  ageSort[age2._id] : ageSort['UNKNOWN'];
                return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
            });
            console.log("put object to cache key:%s", key);
            cache.put(key, outline);
            fn(err, outline);
        });
}

// 返回所有作品大纲
//    { 年代 : { 作者 : ['xxxx', 'xxxx'] } } 
exports.outline_with_id = function(query, fn){

    var key = 'outline:all:withid',
        outline = cache.get(key);
    if(outline)
        return fn(null, outline);

    Module.collection.aggregate( 
        { $match : query }
        , { $sort : { author : 1, paintingName : 1 } }
        , { $group : { _id: '$author' , paintings : { $push : { name : '$paintingName', uid : '$_id' } } , age : { $first : '$age'} }  }
        , { $project : {  "author.name" : "$_id", "author.paintings" : '$paintings' , age: 1 } }
        , { $group : { _id : '$age' , authors : { $push : '$author'}} }
        , function(err, outline){
            if(err) console.trace(err);

            outline.sort(function(age1, age2){
                var v1 = ageSort[age1._id] ?  ageSort[age1._id] : ageSort['UNKNOWN'],
                    v2 = ageSort[age2._id] ?  ageSort[age2._id] : ageSort['UNKNOWN'];
                return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
            });
            console.log("put object to cache key:%s", key);
            cache.put(key, outline);
            fn(err, outline);
        });
}

exports.list = function(type, cond, page, sort, fn){

  console.log(sort);

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
    obj.updateTime = Date.now();
    Module.update({_id : _id}, {$set : obj}, {upsert : true}, fn);

    // 清空全部缓存
    console.log("clear all cache");
    cache.clear();
}

//按照ID查询对象
exports.findById = function(_id, project, fn){
  if(typeof project === 'function'){
    fn = project ;
    project = {}; 
  }

  Module.findOne({ _id : _id }
    , project
    , function(err, doc){
      if(err) return fn(err);
      if(!doc) return fn(new Error('图片不存在或者已经下线：' + _id));
      
      fn(err, doc.toObject());
    });
}

exports.findByCond = function(cond, fn){
  Module.findOne(cond
    , function(err, doc){
      if(err) return fn(err);
            
      fn(err, doc && doc.toObject());
    });  
}

//删除一张图，只是标记为已删除，不实际删除图片
exports.delete = function(_id, data, fn) {
    Module.update({ _id : _id}, {$set : data}, function(err){
      if(err)
        return fn(err);

      cache.clear();
      fn(err);
    });
}


// 判断一张图的整体级别
//  ['五级-普通图','四级-大图','三级-高清图','二级-绢丝可见','一级-如观实物','特级-俯观实物'],
var levelmap = ['五级-普通图','四级-大图','三级-高清图','二级-绢丝可见','一级-如观实物','特级-俯观实物'];
exports.judgelevel = function(painting){
  // 根据缩放计算基本级别
  var level = painting.maxlevel - painting.minlevel;

  // 资源级别如果不是 "高清原拍", 就降1～2个级别，
  // 如果资源级别为空，就定为 "高清原拍"
  var resure_dec = { '高清原拍' : 0 , '高清转扫' : -1, '中清原拍' : -1, '中清转扫' : -2, '聊胜于无' : -3  };
  if(painting.resourceLevel){
    var dec = resure_dec[painting.resourceLevel] || 0;
    level += dec;
  }

  // TODO: 判断是否为（纵或者横方向上的），一般是册页，扇面，长卷等，如果为小图，提高一分，因为小图的缩放比一般来说比较小，通过缩放比计算
  // 出来的得分偏低，需要给予提高。可以通过比较实际尺寸的到。
  // TODO: 需要精确设定图片大小

  var paintinglevel = levelmap[ Math.min( level, levelmap.length - 1 )];
  return paintinglevel;
}


// ============================= 下面是单元测试用的代码 ================================
var isme = require('../sharepage.js').isme;
var tester = {
  // 读取json文件，并导入
  import: function(){
    fs.readFile('/Users/sanli/Downloads/paintings.json', function (err, data) {
      if (err) throw err;
      var paintings = JSON.parse(data);
      console.log("导入藏品数量:%s", paintings.length);
      async.eachSeries(paintings , function(painting, callback){
        Module.create(painting, function(err){
          if(err) 
            console.log("导入图片出错:%s, err:%s", painting.paintingName, err );
          else
            console.log("导入图片:%s", painting.paintingName );

          callback(err);
        });
      }, function(err){
          if(err) 
            console.log("导入图片出错, err:%s", err );
          else
            console.log("导入图片完成，共导入图片:%s", paintings.length );
      
      });
    }); 
  },

  // 刷新评级
  refreshOverallLevel : function(){
    Module.find({}, function(err, paintings){
      if(err) return console.log(err);

      async.eachSeries(paintings, function(painting, cb){
        var overallLevel = exports.judgelevel(painting);
        Module.update({ _id : painting._id}, 
          { $set : { overallLevel : overallLevel } }, cb);
      }, function(err){
        if(err) {
          console.log(err);
        } else {
          console.log("更新所有级别完成");
        }
      });
    });
  },

  testDefaultValue : function(){

  },
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


