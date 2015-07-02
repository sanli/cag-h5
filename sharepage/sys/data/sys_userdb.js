//#!本文件由share.js自动产生于Fri Sep 19 2014 17:09:24 GMT+0800 (CST), 产生命令行为: node share.js gen sysuser CRUD ..

/**
 * sysuser数据库访问类
 */
var inspect = require('util').inspect
  , ObjectID = require('mongodb').ObjectID
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Data = require('../../../mongo.js')
  , extend = require('node.extend')
  , csv = require('csv') 
  , share = require('../../../sharepage.js');

// === 基本数据结构定义，按照实际需求修改 ===

// TODO: 下面为Demo数据结构，请改成模块实际数据结构
var sys_sysuser = new Schema({
    // ID字段在每个对象中会自动创建，除非需要自己创建_id,否者不要放开
    /* _id : Schema.Types.ObjectId, */
    // ---- 基本信息 ----
    // 名称
    userName : String,
    // 基本描述
    desc : String,
    // 所拥有的角色，能拥有多个角色，角色之间权利叠加
    // role : [String],
    // 目前只允许拥有一个角色
    role : String,
    // 密码
    password : String,
    // 所属部门，只能属于一个部门
    org : String,
    // 所属地市
    city : String,
    // 中文名
    中文名 : String,
    // 电话
    电话 : String,
    // 模块黑名单，阻止用户访问黑名单中的所有模块
    blockModules : String,
    // ==== 一些其他附加信息 ====
    // 最后修改时间
    updateTime : Date,
    // 是否启用
    isInActive : Boolean
},  { collection: 'sys_sysuser' });
// 创建索引 
// TODO: 根据实际结构确定索引结构
sys_sysuser.index({_id : 1})
    .index({userName : 1})
    .index({org : 1})
    .index({roles : 1});
var sysuser = mongoose.model('sys_sysuser ', sys_sysuser ),
    _Module = sysuser ;
exports.sysuser  = sysuser;

// 以下字段不用在列表查询的时候返回
// TODO:  需要修改为实际数据结构对应的字段
var defaultProjection = { updateTime : 0 };


// === 基本功能实现函数,一般不用修改 ===
// 创建对象
exports.create = function(data, fn){
  //判断模块名是否重复
  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  _Module.find({ userName: data.userName}
    , function(err, items){
      if(err)
        return fn(err);

      if(items.length > 0)
        return fn(new Error('与现有系统用户名称重复，不能创建'));

      var module = new _Module(data);
      _Module.create(module, function(err, newModule){
        if(err) console.log("新建sysuser出错 :" + err);
        fn(err, newModule);
      });
    });
};

// 更新对象
exports.update = function(_id, data, fn){
  //检查是否与现有重复
  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  _Module.find({ userName: data.userName } 
    ,function(err, items){
      if(share.isConflict(items, _id))
          return fn(new Error('与现有sysuser名称重复，不能修改'));

      _Module.findByIdAndUpdate(_id, {$set: data}, {new : false}, fn);
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
      if(err) console.trace("查询sysuser错误:", err);

      fn(err, docs);
    });
}

// 普通查询 TODO: 可能无用，可以移除
exports.query = function(cond, sort, fn){
    _Module.find(cond)
    .sort(sort)
    .exec(function(err, docs){
      if(err) console.trace("查询sysuser错误:", err);

      fn(err, docs);
    });
}

//返回某个查询的返回值数量，主要用于分页
exports.count = function(cond, fn){
  _Module.find(cond)
    .count(function(err, count){
      if(err) console.trace("统计sysuser数据量错误::", err);

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
            console.log("importcsvfile success sysuser filename:" + filename);
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

// 返回用户所拥有的所有权限
exports.getUserRight = function(fn){

}


exports.findOne = function(username, fn){
  _Module.findOne({userName : username}, function( err, user ){
        if(err)
            return fn(err);

        if(user === null)
            return fn(new Error('用户不存在'));

        fn(null, user);
  });
};

/**
 * 验证用户登录信息，如果用户登录有效，返回用户对象
 * 如果无效，返回错误
 * @param fn  fn(err, user)
 */
exports.authorize = function(username, pass, fn){
  _Module.findOne({userName : username}, function( err, user ){
        if(err)
            return fn(err);

        if(user === null)
            return fn(new Error('用户不存在'));

        if(user.password != pass)
            return fn(new Error('密码错误'));

        fn(null, user);
  });
};

/**
 * 修改用户密码
 */
exports.updatePass = function(username, pass, fn){
  _Module.update( { userName : username } , { $set : { password : pass } }, fn);
};

// ============================= 下面是单元测试用的代码 ================================
var isme = share.isme;
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

    console.log('sysuserdb.js '+ testcmd.join('|'));
  }
}

