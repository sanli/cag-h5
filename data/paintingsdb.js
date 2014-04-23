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
  , paintdb = require('./paintdb.js') ;

// === 基本数据结构定义，按照实际需求修改 ===
// 定义数据访问引用
var Module = paintdb.Painting;

// === 基本功能实现函数,一般不用修改 ===
// 查询数据
exports.list = function(type, cond, sort, page, fn){
    // 使用Aggregate查询数据
  Module.find(cond, defaultProjection)
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

//按照ID查询对象
exports.findById = function(_id, fn){
  Module.findById(_id, function(err, doc){
    fn(err, doc.toObject());
  });
}

/**
 * 通过CSV导入数据
 */
exports.importCSV = function(filename, type, fn) {
    if(!fs.existsSync(filename)){
        return fn(new Error('数据文件:' + filename + ' 不存在'));
    }

    var createObjByType = function(fields, record){
      var result = {};
      record.forEach(function(field, index){
        var fieldname = fields[index];
        result[fieldname] = field;
      })
      return result ;
    };
    
    var importcsvfile = function(Module, fields, filename, fn){
        csv()
        .from(filename)
        .transform(function(record, index, callback){
            if(index === 0)
                return callback();

            var obj = createObjByType(fields, record);
            Module.update( {cellid: obj.cellid} 
                , {$set : obj}
                , { upsert: true }
                , function(err){
                  callback();
                });
        }, {parallel: 1})
        .on("end", function (count) {
            console.log("importcsvfile success paintings filename:" + filename);
            fn(null, count - 1);
        })
        .on('error',function(error){
            console.log("importcsvfile error:" + error.message);
            fn(error);
        });
    };
    importcsvfile(Module, fields, filename, fn);
};

// =============== 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===================



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


