//#!本文件由share.js自动产生于Wed Apr 15 2015 15:56:21 GMT+0800 (CST), 产生命令行为: node share.js gen tourist CRUD ..

/**
 * tourist数据库访问类
 */
var inspect = require('util').inspect
  , ObjectID = require('mongodb').ObjectIDtour
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Data = require('../mongo.js')
  , Helper = require('../mongo.js').Helper
  , extend = require('node.extend')
  , csv = require('csv') 
  , share = require('../sharepage.js');

// === 基本数据结构定义，按照实际需求修改 ===
// 游客表，存储游客信息
var tourist = new Schema({
    // ID字段在每个对象中会自动创建，除非需要自己创建_id,否者不要放开
    /* _id : Schema.Types.ObjectId, */
    // ---- 基本信息 ----
    // 访客ID
    userid : String,
    // 访客名
    name : String,
    // 主页，或者是社交媒体主页
    url : String,
    // 头像
    avatar_url: String,
    // 其他用户相关信息
    email : String,
    // 密码
    password : String,
    // 多说中的id，如果用户使用QQ或者其他社交媒体登录，则会绑定一个duoshuoid
    dsid : String,
    // 用户的多说信息
    dsinfo : Schema.Types.Mixed,
    // 访问计数器
    accessCnt : { type : Number, default : 0 }, 
    // 创建时间
    ctime : Date,
    // 最后访问时间
    latime : Date,
    // 用户角色
    role : { type : String, default : '游客' },
    // 是否不允许用户登录
    blocked : { type : Boolean , default : false },

    // 第二阶段的一些信息
    // 邮件地址是否已经验证
    email_valided : Boolean,
    // 是否允许发送邮件信息
    allow_send_email : Boolean
},  { collection: 'tourist' });

// 创建索引 
// TODO: 根据实际结构确定索引结构
tourist.index({ _id : 1 })
    .index({ userid : 1 })
    .index({ email : 1 })
    .index({ duoshuoid : 1 });
var tourist = mongoose.model('tourist', tourist ),
    _Module = tourist ;
exports.tourist  = tourist;


// 以下字段不用在列表查询的时候返回
// TODO:  需要修改为实际数据结构对应的字段
var defaultProjection = { ctime : 0 };


// === 基本功能实现函数,一般不用修改 ===
// 创建对象
exports.create = function(data, fn){
  //判断模块名是否重复
  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  _Module.find({ $or : [
      { userid: data.userid },
      { email: data.email }
    ]}
    , function(err, items){
      if(err)
        return fn(err);

      if(items.length > 0)
        return fn(new Error('与现有访客信息名称或者是Email地址重复，不能注册'));

      var module = new _Module(data);
      _Module.create(module, function(err, newModule){
        if(err) console.log("新建tourist出错 :" + err);
        fn(err, newModule);
      });
    });
};

// 更新对象
exports.update = function(_id, data, fn){
  //检查是否与现有重复
  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  _Module.find({ $or : [
      { userid: data.userid },
      { email: data.email }
  ]},function(err, items){
      if(share.isConflict(items, _id))
        return fn(new Error('与现有tourist名称重复，不能修改.'));

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
      if(err) console.trace("查询tourist错误:", err);

      fn(err, docs);
    });
}

// 普通查询 TODO: 可能无用，可以移除
exports.query = function(cond, sort, fn){
    _Module.find(cond)
    .sort(sort)
    .exec(function(err, docs){
      if(err) console.trace("查询tourist错误:", err);

      fn(err, docs);
    });
}

//返回某个查询的返回值数量，主要用于分页
exports.count = function(cond, fn){
  _Module.find(cond)
    .count(function(err, count){
      if(err) console.trace("统计tourist数据量错误::", err);

      fn(err, count);
    });
}

//按照ID查询对象
exports.findById = function(_id, fn){
  _Module.findById(_id, function(err, doc){
    fn(err, doc ? doc.toObject() : {});
  });
}

// 按照条件查询返回一个第一个找到的对象
exports.findByCond = function(cond, fn){
  _Module.findOne(cond, function(err, doc){
    fn(err, doc ? doc.toObject() : null);
  });  
}

// 根据用户名或者是email地址查询用户
exports.getUserInfo = function(userid, fn){
  _Module.findOne({
    $or : [
      { userid: userid },
      { email: userid }
    ]
  }, function(err, doc){
    fn(err, doc ? doc.toObject() : null);
  });    
}

// =============================
// 通过CSV导入数据，需要导入数据的模块要修改一下的实现
// =============================
var imp = require('./imp.js');
function _createDataImporter( filename, Module, fields, args ){
    var self = imp.Importer( filename, Module, args );
    
    // 根据类型创建定义，从CSV文件的一行中创建对象
    self.createObjByType = function(record, line){
        var result = extend({}, args);
        record.forEach(function(field, index){
            var fieldname = fields[index];
            field = field.trim();
            if(fieldname === "地市"){
                result['city'] = field;  // 归属城市统一使用city代替
            }else{
              result[fieldname] = field;
            }
        });

        return result ;
    };

    // 替换或者是合并到新的基站数据中
    self.updateObject = function(obj, callback){
        // TODO: 修改主键和更新方法
        var select = { EnodeBID: obj.EnodeBID , city: obj.city },
            update = { $set : obj };
            // 导入数据到导入历史记录中
        Module.update( select, update , {upsert : true}, callback);
    };
    return self;
};

var cvsfield = ['EnodeBID', '地市', '区县'],
    cvsfield_validrule = ['EnodeBID*', '地市', '区县'];
exports.importCSV = function(filename, fn, updater, opts) {
    var args = opts;
    if(!fs.existsSync(filename)){
        return fn(new Error('数据文件:' + filename + ' 不存在'));
    }
    
    // 创建验证工具或者是导入工具
    var impfn = opts.verify 
      ? imp.createDataValidator(filename, cvsfield_validrule, extend({}, args, {
            //TODO : 修改模块名称
            module : '需求管理', table : '重点规划站点'
        }), function(data){ 
          return data['EnodeBID'];
        }) 
      : _createDataImporter(filename, _Module, cvsfield, args);
      
    imp.import(function(err, count, cellIds){
        if(err) {
            console.trace("导入tourist出错", err);
            return fn(err)
        };

        return fn(err, count, cellIds);
    }, updater);
};
exports.cvsfield = cvsfield;


exports.createExporter = function(){
    //TODO : 修改导出字段名称
    var columns = ['唯一编号(sid)', '项目编号', '地市', '区县', '乡镇行政村名称', 'BBU规划编号', '勘察BBU机房名称'
      , '勘察BBU经度', '勘察BBU纬度', '站点类型', '规划物理站址编号', '勘察物理站址编号', '勘察物理站址名称'
      , '勘察原有网络', '勘察站址建设方式', '勘察主设备建设方式', '网络类型', '频段', '覆盖场景', '覆盖区域'
      , '交通场景', 'RRU站点名称', 'RRU经度', 'RRU纬度', 'RRU铁塔类型', 'RRU铁塔塔基距地面垂直高度'
      , 'RRU铁塔塔身高度', 'RRU天线挂高', 'RRU天线类型', 'RRU方位角', 'RRU归属小区名称', '天线拟安装平台'
      , '无线阻挡说明', '备注_勘察阶段'],
      datafields = ['sid', 'projectId', 'city', '区县', '乡镇行政村名称', 'BBU规划编号', '勘察BBU机房名称', '勘察BBU经度', '勘察BBU纬度'
      , '物理站址.站点类型', '物理站址.规划物理站址编号', '物理站址.勘察物理站址编号', '物理站址.勘察物理站址名称'
      , '物理站址.勘察原有网络', '物理站址.勘察站址建设方式', '物理站址.勘察主设备建设方式', '物理站址.网络类型', '物理站址.频段'
      , '物理站址.覆盖场景', '物理站址.覆盖区域', '物理站址.交通场景'
      , '物理站址_rru.RRU站点名称', '物理站址_rru.RRU经度', '物理站址_rru.RRU纬度', '物理站址_rru.RRU铁塔类型'
      , '物理站址_rru.RRU铁塔塔基距地面垂直高度', '物理站址_rru.RRU铁塔塔身高度', '物理站址_rru.RRU天线挂高', '物理站址_rru.RRU天线类型'
      , '物理站址_rru.RRU方位角', '物理站址_rru.RRU归属小区名称', '物理站址_rru.天线拟安装平台', '物理站址_rru.无线阻挡说明'
      , '备注_勘察阶段'];
    return {
        head : function(){
            return columns.join(',') + '\n';
        },
        data : function(data){
            var out = datafields.map(function(field){
                return share.getnest(data, field);
            });
            return '"' + out.join('","') + '"\n' ;
        }
    }
}
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
      tester[testfn]();
    }
  }else{
    var testcmd = [];
    for(cmd in tester)
      testcmd.push(cmd);

    console.log('touristdb.js '+ testcmd.join('|'));
  }
}

