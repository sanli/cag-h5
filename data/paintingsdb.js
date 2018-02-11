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
    // 原始包下载路径，跳转到百度云或者是下载页
    //  http://ltfc.net/share/{uuid}
    originalUrl : String,

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

// Painting中记录的是作品的原始信息，是切图程序生成的数据。
var daidu_file = new Schema({
    _id : Schema.Types.ObjectId,

    // painting的id信息
    // paintingId : String,

    // ---- 基本信息 ----
    // 文件名
    file_name : String,
    // 文件名
    path : String,
    // 文件大小
    size : Number,
    // 文件 md5 checksum
    md5 : String,
    // 文件大小
    share_link : String,
    // 密码
    pass : String,

    // 是否已经同步到 ltfc.net 服务器端
    synced : Boolean,

    // ---- 通用字段 ----
    // 最后修改时间
    utime : Date,
    // 创建时间
    ctime : Date
},  { collection: 'daidu_file' });
daidu_file.index({_id : 1})
    .index({file_name : 1})
    .index({path : 1}, { unique : true });

var BaiduFile = mongoose.model('daidu_file', daidu_file);
exports.BaiduFile = BaiduFile;

// === 基本功能实现函数,一般不用修改 ===
// 增加某个图片的访问计数
exports.incViewCount = function(_id, fn){
    Module.update({_id : _id}, { $inc : { viewCnt: 1 } }, fn);
}

// 查询某个艺术品详细信息
exports.queryfile = function(query, project, sort, fn, page){
    page = page || { skip : 0, limit : 300 };
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
  "隋" : 40,
  "唐" : 50,
  "五代" : 55,
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


exports.findShareById = function( _id, fn){
  BaiduFile.findOne({ _id : _id }, fn);
}


var path = require('path')
// 导入百度文件下的数据
// 扫描文件路径: bp l -R -c off /CAG_PIC_LIB/
// 分享文件: bp S -P ltfc /CAG_PIC_LIB/当代/近现代_张善孖_山水轴_纸本_53.8x120.8.tif
exports.scan_baidu = function(dir, fn){
  //var cmd = ['bp', 'l', '-R', 'c', 'off', '/CAG_PIC_LIB/'];
  var cmd = [ '/Users/lishuangtao/workspace/iScript/pan.baidu.com.py', 'l', '-R', '-c', 'off', dir];

  _run_bp('python', cmd, function(err, lines){
    if(err) {
      console.log("scan baidu dir error:", err);
      return fn(err);
    }

    async.eachSeries(lines,  function(line, cb){
      var filearr = line.split(',').map( v => v.trim());
      if(filearr.length <= 3){
        var tpath = filearr[2];
      }else{
        var tpath = filearr.slice(2, filearr.length).join(',');
      }
      file_name = path.basename(path);
      var file = {
        size : parseInt(filearr[0]),
        md5 : filearr[1],
        path : tpath,
        file_name : file_name,
        utime : new Date(),
      }

      BaiduFile.findOne({ path : file.path }, function(err, baiduFile){
        if(err) return cb(err);
        if(baiduFile != null && baiduFile.md5 == file.md5) return cb(null);
        if(baiduFile == null)
          file.ctime = new Date();

        console.log("line :%s" , line);
        console.log("process file:%s", file.path);
        BaiduFile.update({ path : file.path }
          , file
          , { upsert : true }
          , function(err){
            if(err) return cb(err);
            console.log("update baidu file: %s", file.path);

            return cb(null);
          });
      })
    },fn);
  });
}

// 分享所有当前没有被分享的文件
exports.share_new_files = function(fn){
  BaiduFile.find({
    share_link : { $exists : false } /* , path : RegExp('/CAG_PIC_LIB/宋.*')*/
  }, function(err, files){
    if(err) return fn(err);

    async.eachSeries(files, function(file, cb){
      var path = file.path;
      console.log("share file:%s", path);
      setTimeout(function(){
        exports.share_file(path, function(err, sharelink){
          if(err) return cb(err);

          BaiduFile.update({ path : path }, { $set : sharelink }, function(err){
            if(err) return cb(err);

            console.log("share file:%s success", path);
            return cb();
          });
        })
      }, Math.floor(Math.random() * 50000));
    }, fn);
  });
}

// 分享文件，加密分享文件，并保存到DB中
exports.share_file = function(filepath, fn){
  var cmd = [ '/Users/lishuangtao/workspace/iScript/pan.baidu.com.py', 'S', '-P', 'ltfc', filepath];
  console.log('python ' + cmd.join(' '));
  _run_bp('python', cmd, function(err, lines){
    if(err) return fn(err);

    if(lines.length ===0) return fn(new Error("share error, no result"));
    var share = lines[0].split(',').map( v => v.trim());
    if(share.length != 2) return fn(new Error("share error, reuslt:%s", lines[0]));

    var sharelink = {
      share_link : share[0],
      pass : share[1]
    }
    fn(null, sharelink);
  });
}


// 运行 bp 工具，抽取屏幕输出中以 '_CAG_>' 开头的输出内容
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
function _run_bp(cmd, args, fn){
  // var cmdstr = cmd.join(" ");
  // console.log("run bp command:[%s]", cmdstr);
  const python = spawn( cmd, args );
  var out = [], err = [];
  python.stdout.on('data', (data) => {
    out.push(data);
  });

  python.stderr.on('data', (data) => {
    err.push(data);
  });

  python.on('close', (code) => {
    var outmsg = Buffer.concat(out).toString();
    var errmsg = Buffer.concat(err).toString();
    if (code !== 0) {
      console.log(`grep process exited with code ${code}`);
      console.log('stderr: %s', err.toString());
      console.log('stdout: %s', out.toString());
      return fn(new Error(code));
    }

    //var stdout = out.join("");
    var stdout = outmsg;
    var cagtag = "_CAG_>";
    var lines = stdout.split('\n')
      .filter( line => line.startsWith(cagtag))
      .map( line => line.replace(cagtag, "").trim());
    return fn(null, lines);
  });
}


// 更新所有图片的当前下载链接
function migration_download_link(fn){
  PaintingView.find({ originalUrl : { $exists : true, $ne : '' } }, function(err, paintings){
    if(err) return fn(err);

    console.log("total: %s", paintings.length);
    async.eachSeries(paintings, function(painting, cb){
      var uuid = painting._id;
      var file_name = [painting.age, painting.author, painting.paintingName ,painting.mediaType, painting.areaSize, painting.ownerName ].join('_');
      var share_link = painting.originalUrl;
      var bdfile = {
        share_link : share_link,
        file_name : file_name,
        path : '/MOCK/' + file_name,
        pass : ''
      }
      BaiduFile.findOneAndUpdate({ share_link : share_link }
        , { $set : bdfile }
        , { upsert : true ,  new : true }, function(err, baidufile){
          if(err) return cb(err);

          var newlink = "/share/" + baidufile._id;
          PaintingView.update({ _id : uuid }, { $set : { originalUrl : newlink }}, function(err){
            console.log("update originalUrl: %s -> %s", share_link, newlink);
            return cb();
          });
      })
    }, fn);
  });
}

// 同步所有未同步的数据到远程服务
function sync_all_baidu_share(fn){
  BaiduFile.find( { 
    path : /^\/CAG_PIC_LIB/, 
    synced : { $ne : true } 
  }, function(err, unsynced){
    async.eachSeries(unsynced, function( baiduFile, cb ){
      console.log(`sync file: ${baiduFile.path}`)
      send_baidu_sharefile(baiduFile.toObject(), cb);
    }, function(err){
      console.log("sync all baidu file finished");
      fn(err);
    });
  });
}

var clientkey = require('../config.js').clientkey;
function send_baidu_sharefile(daiduFile, fn){
  // should not post _id to server
  delete daiduFile._id;
  var fileobj = {
    bddata : JSON.stringify(daiduFile),
    clientkey : clientkey
  };
  _post_baidufile( fileobj, function(err){
    if(err) return fn(err);

    console.log(`sync file: ${daiduFile.path} success`);
    BaiduFile.update({ path : daiduFile.path }, { $set : {  synced : true } } , fn);
  });
}

var querystring = require('querystring');
var http = require('http');
function _post_baidufile( fileobj, fn){
  var postData =  querystring.stringify(fileobj);
  var options = {
    protocal : 'http',
    hostname: 'www.ltfc.net',
    port: 80,
    path: '/paintings/bdsync',
    method: 'POST',
    headers: {
      'Origin' : 'http://ltfc.net',
      'Referer' : 'http://ltfc.net/paintings.html',
      'User-Agent' : 'LTFCImporter',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  var out = [];
  var req = http.request(options, (res) => {
    //console.log(`STATUS: ${res.statusCode}`);
    //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      out.push(chunk);
    });
    res.on('end', () => {
      var result = out.join('');
      if(res.statusCode != 200){
        return fn(new Error(`request err with code: ${res.statusCode}`), result);
      }else{
        var resultobj = JSON.parse(result);
        fn(null, resultobj);
      }
    });
  });
  req.on('error', (e) => {
    console.log(`problem with request: ${e.message}`);
    fn(e);
  });
  // write data to request body
  // console.log(postData)
  req.write(postData);
  req.end();
}


// 纠正所有离线包下载链接, 替换原来的  http://outline.ltfc.net  -> https://outlines.ltfc.net
function fix_outline_url(fn){
  PaintingView.find({ offlineUrl : /^http:\/\/outline\.ltfc\.net.*/ }
    , { offlineUrl : 1 }
    , function(err, docs){
      if(err) return fn(err);

      async.eachSeries(docs, function(doc, cb){
        var newUrl = doc.offlineUrl.replace('http://outline', 'https://outlines');
        console.log(`update ${doc.offlineUrl} -> ${newUrl}`);
        PaintingView.update({ _id : doc._id}, { $set : { offlineUrl : newUrl } }, cb);
      },fn);
    });
}


// 纠正所有离线包下载链接, 替换原来的  http://outline.ltfc.net  -> https://outlines.ltfc.net
function refresh_file_name(fn){
  BaiduFile.find({}
    , { path : 1, file_name : 1 }
    , function(err, docs){
      if(err) return fn(err);

      async.eachSeries(docs, function(doc, cb){
        var new_file_name = path.basename(doc.path);
        if( new_file_name == doc.file_name ) 
          return cb();

        console.log( `${doc.path} -> ${doc.file_name}`);
        console.log( `update ${doc.file_name} -> ${new_file_name} `);
        BaiduFile.update({ _id : doc._id }, { $set : { file_name : new_file_name } }, cb);
      },fn);
    });
}

// ============================= 下面是单元测试用的代码 ================================
var isme = require('../sharepage.js').isme;
var tester = {

  refresh_file_name : function(){
    refresh_file_name(() => console.log('refresh finsihed'));
  },

  sync_all_baidu_share : function(){
    sync_all_baidu_share(function(err){
      if(err) console.log(err);
      console.log('sync all baidu share file finsiehd');
    });
  },

  // 测试同步数据
  sync_baidu_share : function(){
    var id = '583f032f57ef6700e4918997';
    BaiduFile.findOne({ _id : id }, function(err, obj){
      if(err) return console.log(`err:${err.message}`);

      if(!obj) return console.log(`target object not exists: ${id} `)
      send_baidu_sharefile(obj.toObject(), function(err, result){
        if(err) return console.log(`send baidu file err: ${err}`);
        console.log(result);
      });
    });
  },

  fix_outline_url : function(){
    fix_outline_url(function(err){
      if(err) return console.log(`fix outline url has err: ${err.message}`);

      console.log("fix outline url finished");
    });
  },

  // 扫描百度图片库，输出所有文件
  scanbaidu : function(){
    exports.scan_baidu('/CAG_PIC_LIB/', function(err){
      if(err) console.log(err);
      console.log(" finished! ");
    });
  },

  migration_download_link : function(){
    migration_download_link( err =>{
      if(err) console.log('err:%s', err);
      console.log('migration_download_link finished')
    });
  },

  share_new_files : function(){
    exports.share_new_files(function(err){
      if(err) console.error(err);

      console.log('share new file finished!');
    });
  },

  testsharefile : function(){
    exports.share_file('/CAG_PIC_LIB/当代/近现代_张善孖_山水轴_纸本_53.8x120.8.tif', function(err){
      if(err) console.error(err);

      console.log('share finished!');
    })
  },

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
