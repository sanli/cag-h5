//#!本文件由share.js自动产生于Fri Oct 17 2014 21:38:22 GMT+0800 (CST), 产生命令行为: node share.js gen sys_enum CRUD ..

/**
 * sys_enum数据库访问类
 */
var inspect = require('util').inspect
  , ObjectID = require('mongodb').ObjectID
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Data = require('../../../mongo.js')
  , Helper = require('../../../mongo.js').Helper
  , extend = require('node.extend')
  , csv = require('csv') 
  , share = require('../../../sharepage.js')
  , _ud = require('underscore');

// === 基本数据结构定义，按照实际需求修改 ===
var sys_enum = new Schema({
    // ID字段在每个对象中会自动创建，除非需要自己创建_id,否者不要放开
    /* _id : Schema.Types.ObjectId, */
    // ---- 基本信息 ----
    // 项目名称，可以是以点"."分隔的字符串
    // 例如:  用户反馈.反馈类型 ， 资源管理.图片资源级别 , 资源管理.图片信息标签
    itemName : String,
    // 字段用途描述
    desc : String,
    // 枚举值
    enums : [String],
    // 最后修改时间
    updateTime : Date
},  { collection: 'sys_enum' });

// 创建索引 
// TODO: 根据实际结构确定索引结构
sys_enum.index({_id : 1})
    .index({itemName : 1});
var sys_enum = mongoose.model('sys_enum ', sys_enum ),
    _Module = sys_enum ;
exports.sys_enum  = sys_enum;


// 以下字段不用在列表查询的时候返回
// TODO:  需要修改为实际数据结构对应的字段
var defaultProjection = { updateTime : 0 };


// === 基本功能实现函数,一般不用修改 ===
// 创建对象
exports.create = function(data, fn){
  //判断模块名是否重复
  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  _Module.find({ itemName: data.itemName }
    , function(err, items){
      if(err)
        return fn(err);

      if(items.length > 0)
        return fn(new Error('与现有数据字典名称重复，不能创建'));

      var module = new _Module(data);
      _Module.create(module, function(err, newModule){
        if(err) console.log("新建sys_enum出错 :" + err);

        invalideCache();
        fn(err, newModule);
      });
    });
};

// 更新对象
exports.update = function(_id, data, fn){
  //检查是否与现有重复
  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  _Module.find({ itemName: data.itemName }
    ,function(err, items){
      if(items.length > 0){
        var msg = [];
        items.forEach(function(building){
          if(building._id.toString() !== _id){
            msg.push(building._id);
          }
        });
        if(msg.length > 0) return fn(new Error('与现有数据字典名称重复，不能修改:' + msg.join(',')));            
      }
      
      _Module.findByIdAndUpdate(_id, {$set: data}, {new : false}, function(err){
        invalideCache();
        fn(err);
      });
    });
};

//删除对象
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
      if(err) console.trace("查询sys_enum错误:", err);

      fn(err, docs);
    });
}

// 普通查询 TODO: 可能无用，可以移除
exports.query = function(cond, sort, fn){
    _Module.find(cond)
    .sort(sort)
    .exec(function(err, docs){
      if(err) console.trace("查询sys_enum错误:", err);

      fn(err, docs);
    });
}

//返回某个查询的返回值数量，主要用于分页
exports.count = function(cond, fn){
  _Module.find(cond)
    .count(function(err, count){
      if(err) console.trace("统计sys_enum数据量错误::", err);

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
            console.log("importcsvfile success sys_enum filename:" + filename);
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
// 返回所有枚举类型，用于类型检查，会进行缓存，修改module时需要清除Cache
var cachedGetAll = share._CreateCachedGetAllFn('sys_enum.enums', "getAll", _Module, {}, { itemName : 1 }),
    // 清除cache数据
    invalideCache = function(){
        cachedGetAll.invalide();
        
        getAll(function(err, objs){
            console.log("重新载入所有枚举类型缓存,cnt:%d", objs.length);
        })
    };

var _enums = null,
    getAll = function(fn){
      // 用缓存的数据建立字典map
      cachedGetAll.list(function(err, objs){
        if(err) return fn(err);

        // 填充枚举缓冲区
        _enums = {};
        objs.forEach(function(obj){
            _enums[obj.itemName] = obj.enums;
        });

        fn(err, objs);
      });
    };
exports.getAll = getAll;

// 返回枚举值
exports.getEnum = function( itemName, field){
    if(!_enums){ console.log('[WARN]枚举数据为空，无法查找需要的对象'); return null; }

    return _enums[itemName];
}

// 启动时填充枚举值，保证getEnum调用时数据已经就位
getAll(function(err, objs){
    console.log("载入所有枚举类型,cnt:%d", objs.length);
})

// ============================= 下面是单元测试用的代码 ================================
var isme = require('../../../sharepage.js').isme;
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

    console.log('sys_enumdb.js '+ testcmd.join('|'));
  }
}

