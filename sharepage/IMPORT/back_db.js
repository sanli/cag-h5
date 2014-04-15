//#!本文件由share.js自动产生于<M%=new Date() %M>, 产生命令行为: node share.js gen <M%=module_name %M> IMPORT ..
/**
 * <M%=module_name %M>数据库访问类
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
  , gisdb = require('./gisobjdb.js') ;

// === 基本数据结构定义，按照实际需求修改 ===
//GSM
var cell_gsm = new Schema({
  cellid: String ,
    gsmData1: Number,
    gsmData2: Number,
    gsmData3: Number,
    gsmData4: Number,
    gsmData5: Number,
    gsmData6: Number,
    gsmData7: Number,
    corverBuildings : [ Schema.Types.ObjectId ]
},  { collection: 'cell_gsm' });
cell_gsm.index({cellid : 1});
var CellGSM = mongoose.model('cell_gsm', cell_gsm);

// 导入的数据格式定义
var typemap = { 
  'gsm' : CellGSM,
}, typeFieldMap = {
  'gsm' : ['cellid', 'gsmData1', 'gsmData2', 'gsmData3', 'gsmData4', 'gsmData5', 'gsmData6', 'gsmData7'],
}, typeItemField = {
  'gsm' : 'gsmCellItem', 
}, amountFieldNames = {
  'gsm' : 'gsmCellAmount' , 'td' : 'tdCellAmount', 
}, types = ['gsm'];

// 定义数据访问引用
var Module = CellGSM, fields = typeFieldMap['gsm'];


// === 基本功能实现函数,一般不用修改 ===
// 查询数据
exports.list = function(type, cond, page, sort, fn){
    // 使用Aggregate查询数据
  Module.find(cond).sort(sort)
    .skip(page.skip)
    .limit(page.limit)
    .exec(function(err, docs){
      if(err) console.trace("query <M%=module_name %M> page error:", err);

      fn(err, docs);
    });
}

//返回某个查询的返回值数量，主要用于分页
exports.count = function(type, cond, fn){
  Module.find(cond)
    .count(function(err, count){
      if(err) console.trace("query <M%=module_name %M> count error:", err);

      fn(err, count);
    });
}

/**
 * import cvs file into mongodb, the file must be UTF-8 stuct, user upload 
 * data maybe was GBK encode, need convert to UTF-8 before import
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
            console.log("importcsvfile success <M%=module_name %M> filename:" + filename);
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

    console.log('<M%=module_name %M>db.js '+ testcmd.join('|'));
  }
}
