//#!本文件由share.js自动产生于Fri Sep 19 2014 17:10:17 GMT+0800 (CST), 产生命令行为: node share.js gen sysrole CRUD ..

/**
 * sysrole数据库访问类
 */
var inspect = require('util').inspect
  , ObjectID = require('mongodb').ObjectID
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Data = require('../../../mongo.js')
  , Helper = require('../../../mongo.js').Helper
  , extend = require('node.extend')
  , share = require('../../../sharepage')
  , csv = require('csv') 
  , share = require('../../../sharepage.js')
  , _us = require('underscore');

// === 基本数据结构定义，按照实际需求修改 ===

// TODO: 下面为Demo数据结构，请改成模块实际数据结构
var sys_role = new Schema({
    // ID字段在每个对象中会自动创建，除非需要自己创建_id,否者不要放开
    /* _id : Schema.Types.ObjectId, */
    // ---- 基本信息 ----
    // 名称
    roleName : String,
    // 基本描述
    desc : String,
    rights : Schema.Types.Mixed,
    //是否系统管理员，管理员具有一切权限
    isAdmin : Boolean,
    // 是否预置角色，预置角色不能删除
    isSysrole : Boolean,
    // 最后修改时间
    updateTime : Date
},  { collection: 'sys_role' });

// 创建索引 
// TODO: 根据实际结构确定索引结构
sys_role.index({_id : 1})
    .index({roleName : 1});
var sysrole = mongoose.model('sys_role', sys_role ),
    _Module = sysrole ;
exports.sysrole  = sysrole;


// 以下字段不用在列表查询的时候返回
// TODO:  需要修改为实际数据结构对应的字段
var defaultProjection = { updateTime : 0 };


// === 基本功能实现函数,一般不用修改 ===
// 创建对象
exports.create = function(data, fn){
  //判断模块名是否重复
  console.log(data);

  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  sysrole.find({ roleName: data.roleName}
    , function(err, items){
      if(err)
        return fn(err);

      if(items.length > 0)
        return fn(new Error('与现有角色权限名称重复，不能创建'));

      var module = new _Module(data);
      _Module.create(module, function(err, newModule){
        if(err) console.log("新建sysrole出错 :" + err);

        invalide();
        fn(err, newModule);
      });
    });
};

// 更新对象
exports.update = function(_id, data, fn){
  //检查是否与现有重复
  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  _Module.find({ roleName: data.roleName } 
    ,function(err, items){
        if(share.isConflict(items, _id))
            return fn(new Error('与现有sysrole名称重复，不能修改'));            
        
        _Module.findByIdAndUpdate(_id, {$set: data}, {new : false}, function(err,data){
            invalide();      
            fn(err, data);
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
      if(err) console.trace("查询sysrole错误:", err);

      fn(err, docs);
    });
}

// 普通查询 TODO: 可能无用，可以移除
exports.query = function(cond, sort, fn){
    _Module.find(cond)
    .sort(sort)
    .exec(function(err, docs){
      if(err) console.trace("查询sysrole错误:", err);

      fn(err, docs);
    });
}

//返回某个查询的返回值数量，主要用于分页
exports.count = function(cond, fn){
  _Module.find(cond)
    .count(function(err, count){
      if(err) console.trace("统计sysrole数据量错误::", err);

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
            console.log("importcsvfile success sysrole filename:" + filename);
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
// 返回所有用户角色，用于内部的角色查询和显示，会进行缓存，修改module是需要清楚Cache
var cachedGetAll = share._CreateCachedGetAllFn('sysroledb.roles', "getAllRole", _Module, {}),
    invalide = function(){
        cachedGetAll.invalide();

        exports.getAllRole(function(err, objs){
            console.log('重新载入权限缓存,cnt :%d', objs.length);
        });
    };

// 使用IAT（It always there）模式
var _roles = null;
exports.getAllRole = function(fn){
        cachedGetAll.list(function(err, objs){
            if(err) return fn(err);
            
            _roles = {};
            objs.forEach(function(obj){
                _roles[obj.roleName] = _createRole(obj);
             });
            fn(null, objs);
        });
    }

exports.getRole = function(roleName){
    if(!_roles){ console.log('[WARN]权限缓存为空，无法查找需要的对象'); return null; }

    return _roles[roleName];
}

//创建一个role对象
function _createRole(role){
    if(!role) return role;

    // 判断该角色是否具有特定模块权限
    role.checkRight = function(module , right){
        if(role.isAdmin) return true;
        if(role.roleName === '系统管理员') return true;
        if(!role.rights) return false;

        var rights = role.rights[module];
        return rights && Array.isArray(rights) ? 
            rights.indexOf(right) >= 0 : false;
    }
    return role;
}

exports.getAllRole(function(err, objs){
    console.log('载入所有规则权限,cnt:' + objs.length);
});

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

    console.log('sysroledb.js '+ testcmd.join('|'));
  }
}

