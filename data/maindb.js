//#!本文件由share.js自动产生于Thu Nov 21 2013 22:39:02 GMT+0800 (CST), 产生命令行为: node share.js gen building IMPORT ..
/**
 * building数据库访问类
 */
//基站数据访问
var inspect = require('util').inspect
  , ObjectID = require('mongodb').ObjectID
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Data = require('../mongo.js')
  , Helper = require('../mongo.js').Helper
  , extend = require('node.extend')
  , isme = require('../sharepage.js').isme
  , us = require('underscore')
  , csv = require('csv')
  , gisdb = require('./gisobjdb.js')
  , exportToCSVFile = require('../sharepage').exportToCSVFile
  , Importer = require('./imp').Importer
  , datacorrection = require('./datacorrection.js');

// === 基本数据结构定义，按照实际需求修改 ===
// 定义数据访问引用
var Module = gisdb.Building;
//以下字段不用在位置查询的时候返回
var defaultProjection = { gpsloc : 0, 
    gsmCellAmount: 0,
    gsmData1: 0 , gsmData2: 0 , gsmData3: 0 , gsmData4: 0 , gsmData5: 0 , gsmData6: 0 , gsmData7: 0 , 
    tdCellAmount: 0, tdData1: 0,tdData2: 0,tdData3: 0,tdData4: 0,tdData5: 0, wlanCellAmount: 0,
    wlanData1: 0 ,wlanData2: 0 ,wlanData3: 0 ,
    lteCellAmount: 0 , lteData1: 0 , lteData2: 0 , lteData3: 0, 
    abis1 : 0, abis2 : 0, abis3 : 0, abis4 : 0, abis5 : 0, abis6 : 0, abis7 : 0, abis8 : 0, abis9 : 0
};

// === 基本功能实现函数,一般不用修改 ===
// 查询数据
exports.list = function(type, cond, sort, page, fn){
    // 使用Aggregate查询数据
  Module.find(cond, defaultProjection)
    .sort(sort)
    .skip(page.skip)
    .limit(page.limit)
    .exec(function(err, docs){
      if(err) console.trace("query building page error:", err);

      fn(err, docs);
    });
}

exports.query = function(cond, sort, fn){
    Module.find(cond)
    .sort(sort)
    .exec(function(err, docs){
      if(err) console.trace("query building error:", err);

      fn(err, docs);
    });
}

// 返回某个查询的返回值数量，主要用于分页
exports.count = function(type, cond, fn){
  Module.find(cond)
    .count(function(err, count){
      if(err) console.trace("query building count error:", err);

      fn(err, count);
    });
}

// 按照ID查询楼宇信息, TODO: 这里有安全问题
exports.findById = function(_id, fn){
  Module.findById(_id, function(err, building){
    fn(err, building.toObject());
  });
}

//导出楼宇信息
var buildingExporter = function(){
    var columns = ['楼宇名称', '楼宇标识', '归属物业点名称', '归属物业点编号'
        , '地市', '县区', '区域类型1', '区域类型2', '区域类型3'
        , '层数', '面积（平方米）', '常驻人数', '建筑年代'
        , 'GSM室分是否覆盖', 'TD室分是否覆盖', 'WLAN是否覆盖', 'LTE室分是否覆盖'
        , 'GSM小区', 'GSM小区数', 'GSM载频数', 'GSM忙时话音业务量', 'GSM忙时数据等效业务量', 'GSM忙时数据流量（MB）'
        , 'GSM全天话音业务量', 'GSM全天数据等效业务量', 'GSM全天数据流量（MB）'
        , 'TD小区', 'TD小区数', 'TD载频数', 'TD忙时话音业务量', 'TD忙时数据流量（MB）', 'TD全天话音业务量', 'TD全天数据流量（MB）'
        , 'WLAN热点', 'WLAN热点总数', 'WLAN总AP数', 'WLAN全天总流量'
        , 'TD-LTE小区', 'TD-LTE小区数', 'TD-LTE载频数', 'TD-LTE忙时数据流量（MB）', 'TD-LTE全天数据流量（MB）'];

    return {
        head : function(){
            return columns.join(',');
        },

        data : function(data){
            var out = [data.name, data.buildingId, data.propertyName, data.propertyId
                , data.addComp.city, data.addComp.district, data.areatype1, data.areatype2, data.areatype3  
                , data.level, data.areasize, data.population, data.buildage
                , data.gsmcoverState, data.tdcoverState, data.wlancoverState, data.ltecoverState
                , data.gsmCellItem, data.gsmCellAmount, data.gsmData1, data.gsmData2, data.gsmData3, data.gsmData4, data.gsmData5, data.gsmData6, data.gsmData7
                , data.tdCellItem, data.tdCellAmount, data.tdData1, data.tdData2, data.tdData3, data.tdData4, data.tdData5
                , data.wlanCellItem, data.wlanCellAmount, data.wlanData1, data.wlanData2
                , data.lteCellItem, data.lteCellAmount, data.lteData1, data.lteData2, data.lteData3
            ];
            return '"' + out.join('","') + '"\n' ;
        }
    }
}


function cellItemRegular(itemlist){
    if(!itemlist) return [];
    if(itemlist === '') return [];
    return us.uniq(itemlist.split(','));
};

var fields =['name', 'buildingId', 'propertyName', 'propertyId'
    , 'addComp.city', 'addComp.district', 'areatype1', 'areatype2', 'areatype3'
    , 'level', 'areasize', 'population', 'buildage'
    , 'gsmcoverState', 'tdcoverState', 'wlancoverState', 'ltecoverState'
    , 'gsmCellItem', 'gsmCellAmount', 'gsmData1', 'gsmData2', 'gsmData3', 'gsmData4', 'gsmData5', 'gsmData6', 'gsmData7'
    , 'tdCellItem', 'tdCellAmount', 'tdData1', 'tdData2', 'tdData3', 'tdData4', 'tdData5'
    , 'wlanCellItem', 'wlanCellAmount', 'wlanData1', 'wlanData2'
    , 'lteCellItem', 'lteCellAmount', 'lteData1', 'lteData2', 'lteData3'],
    supportFields = { areatype1 : 1 , areatype2 : 1 , areatype3 : 1 
        , level: 1 , areasize : 1 , population : 1, buildage : 1 
        , gsmCellItem : cellItemRegular , tdCellItem : cellItemRegular 
        , wlanCellItem : cellItemRegular , lteCellItem : cellItemRegular };

//楼宇数据导入类
function BuildingImporter( filename, Module, fields, args ){

    var buildingImporter = Importer(filename, args,
        {
            // 从CSV行中创建对象 
            createObjByType : function(record){
                var result = {};
                record.forEach(function(field, index){
                    var fieldname = fields[index];
                        result[fieldname] = field;
                })
                return result ;
            },

            // 把创建好的对象保存到数据库 
            updateObject : function( obj, callback){
                var setobj = {};
                for( field in supportFields){
                    if(supportFields[field] === 1){
                        setobj[field] = obj[field];
                    }else if(typeof supportFields[field] === 'function'){
                        setobj[field] = supportFields[field](obj[field]);
                    }
                }
                Module.findOneAndUpdate( { name: obj.name, buildingId : obj.buildingId } 
                    , { $set : setobj } , { new : true } 
                    , function(err, building){
                        if(err) {
                          console.trace("import building error:", err);
                          return callback(err);
                        }

                        callback(err, building._id);
                        datacorrection.regularyBuildingCellItem(building);
                        datacorrection.triggerBuildingCalc(building);
                    });
            }
        });
    return buildingImporter;
}
exports.BuildingImporter = BuildingImporter;

/**
 * import cvs file into mongodb, the file must be UTF-8 stuct, user upload 
 * data maybe was GBK encode, need convert to UTF-8 before import
 */
exports.importCSV = function(filename, type, args, fn) {
    if(!fs.existsSync(filename)){
        return fn(new Error('数据文件:' + filename + ' 不存在'));
    }

    var importer = BuildingImporter(filename, Module, fields, args);
    importer.import(function(err, count, cellIds){
        if(err) {
            console.trace("导入Building数据发生错误", err);
            return fn(err)
        };

        return fn(err, count, cellIds);
    });
};

exports.exportCSV = function(cond, sort, fn){
    exports.query(cond, sort, function(err, docs){
        if(err) return fn(err);
        
        var filename = "export_building_" + new Date().getTime() + ".csv";
        var exporter = buildingExporter();
        exportToCSVFile(docs, filename, exporter, function(err){
            if(err) return fn(err);

            return fn(null, filename);
        });
    });
}

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
  if(process.argv.length > 2){
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
      testcmd.push(cmd)

    console.log('buildingdb.js '+ testcmd.join('|'));
  }
}
