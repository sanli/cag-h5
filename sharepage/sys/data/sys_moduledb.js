//#!本文件由share.js自动产生于Mon Sep 15 2014 23:05:13 GMT+0800 (CST), 产生命令行为: node share.js gen sysmodule CRUD ..
// HOWTO: 完成特定模块功能，请修改标记了TODO:的地方，扩展功能请实现再文件最末尾标记的位置，方便以后重新生成后合并
/**
 * sysmodule数据库访问类
 */
var inspect = require('util').inspect
  , ObjectID = require('mongodb').ObjectID
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Data = require('../mongo.js')
  , Helper = require('../mongo.js').Helper
  , extend = require('node.extend')
  , csv = require('csv')
  , share = require('../sharepage.js') ;

// === 基本数据结构定义，按照实际需求修改 ===
// 定义数据结构
var sys_module = new Schema({
    // ID字段在每个对象中会自动创建，除非需要自己创建_id,否者不要放开
    /* _id : Schema.Types.ObjectId, */
    // ---- 基本信息 ----
    // 名称
    moduleName : String,
    // 基本描述
    desc : String,
    // 模块相关文件
    files : [String],
    // 是否系统模块
    isSysModule : Boolean,
    // 模块是否启用
    isActive: Boolean,
    // 最后修改时间
    updateTime : Date
},  { collection: 'sys_module' });
// 创建索引
sys_module.index({_id : 1})
    .index({moduleName : 1});
var SysModule = mongoose.model('sys_module', sys_module),
    _Module = SysModule;
exports.SysModule = SysModule;


//以下字段不用在基本查询的时候返回
var defaultProjection = { };

// === 基本CRUD功能实现函数,一般不用修改，除非需要实现特定的数据逻辑 ===
// 创建对象
exports.create = function(data, fn){
  //判断模块名是否重复
  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  _Module.find({ moduleName: data.moduleName}
    , function(err, items){
      if(err)
        return fn(err);

      if(items.length > 0)
        return fn(new Error('与现有系统模块名称重复，不能创建'));

      var module = new _Module(data);
      _Module.create(module, function(err, newModule){
        if(err) console.log("新建系统模块出错 :" + err);

        invalideCache();
        fn(err, newModule);
      });
    });
};

// 更新对象
exports.update = function(_id, data, fn){
  //检查是否与现有重复
  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  _Module.find({ moduleName: data.moduleName } 
    ,function(err, items){
      if(share.isConflict(items, _id))
          return fn(new Error('与现有系统模块名称重复，不能修改')); 

      invalideCache();
      _Module.findByIdAndUpdate(_id, {$set: data}, {new : false}, fn);
    });
};

//删除对象，根据
exports.delete = function(_id, fn) {
    _Module.remove({ _id : _id } , fn);
}

// 查询数据，支持排序和分页
exports.list = function(cond, sort, page, fn){
  // 使用Aggregate查询数据
  _Module.find(cond, defaultProjection)
    .sort(sort)
    .skip(page.skip)
    .limit(page.limit)
    .exec(function(err, docs){
      if(err) console.trace("query sysmodule page error:", err);

      fn(err, docs);
    });
}

// 普通查询 TODO: 可能无用，可以移除
exports.query = function(cond, sort, fn){
    _Module.find(cond)
    .sort(sort)
    .exec(function(err, docs){
      if(err) console.trace("query sysmodule error:", err);

      fn(err, docs);
    });
}

//返回某个查询的返回值数量，主要用于分页
exports.count = function(cond, fn){
  _Module.find(cond)
    .count(function(err, count){
      if(err) console.trace("query sysmodule count error:", err);

      fn(err, count);
    });
}

//按照ID查询对象
exports.findById = function(_id, fn){
  _Module.findById(_id, function(err, doc){
    fn(err, doc ? doc.toObject() : {});
  });
}

/**
 * 通过CSV导入数据
 */
exports.importCSV = function(filename, fn) {
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
            _Module.update( {cellid: obj.cellid} 
                , {$set : obj}
                , { upsert: true }
                , function(err){
                  callback();
                });
        }, {parallel: 1})
        .on("end", function (count) {
            console.log("importcsvfile success sysmodule filename:" + filename);
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
// 返回所有系统模块，用于内部的权限查询，会进行缓存，修改module是需要清楚Cache
var cachedGetAll = share._CreateCachedGetAllFn('sysmoduledb.modules', "getAllModule", _Module, {}),
    invalideCache = cachedGetAll.invalide;
exports.getAllModule =  cachedGetAll.list;


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

    console.log('sysmoduledb.js '+ testcmd.join('|'));
  }
}


