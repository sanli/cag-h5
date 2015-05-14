//#!本文件由share.js自动产生于Tue Apr 14 2015 17:52:56 GMT+0800 (CST), 产生命令行为: node share.js gen room CRUD ..
/**
 * roomHTTP入口模块, 需要在主文件中添加map
 * var room = require('./routes/room');
 * app.all('/room/list', apiRestrict, room.list);
 * app.all('/room/count', apiRestrict, room.count);
 * app.all('/room/import', apiRestrict, room.import);
 * app.all('/room/retrive', apiRestrict, building.retrive);
 * app.all('/room/update', apiRestrict, gisobj.updateBuilding);
 * app.all('/room/delete', apiRestrict, building.delete);
 * app.all('/room/export', apiRestrict, building.export);
 */
var roomdb = require('../data/roomdb.js')
    , getreq = require('../sharepage').getreq
    , getParam = require('../sharepage').getParam
    , rt = require('../sharepage').rt
    , _ResultByState = require('../sharepage')._ResultByState
    , _assertNotNull = require('../sharepage')._assertNotNull
    , exportToCSVFile = require('../sharepage').exportToCSVFile
    , searchCondExp = require('../sharepage').searchCondExp
    , inspect = require('util').inspect
    , ObjectID = require('mongodb').ObjectID
    , upload = require('./upload')
    , fillUserDept = require('./user.js').fillUserDept
    , bindurl = require('../sfmis.js').bindurl;

//LIST用到的参数
var PAGE = {
    // 列表页条件,包括页的开始记录数skip，和页面长度limit 
    page : {name:'page', key:'page', optional: true, default: { skip: 0, limit: 50 }},
    // 查询条件
    cond : {name: 'cond', key: 'cond', optional: true, default: {} },
    // 排序条件
    sort : {name: 'sort', key: 'sort', optional: true, default: { _id :1 } },
    // 类型
    type : {name: 'type', key: 'type', optional: false},
}
//导入文件用到的参数
var IMP = {
    file : {name: 'file', key: 'file', optional: false},
}
//CRUP参数
var CRUD = {
    data : {name: 'data', key: 'data', optional: false},
    _id : {name:'_id', key:'_id', optional: false},
}


// 注册URL
exports.bindurl=function(){
    bindurl('/room.html', { outType : 'page'}, exports.page);
    bindurl('/room/list', exports.list);
    bindurl('/room/retrive', exports.retrive);
    bindurl('/room/update', exports.update);
    bindurl('/room/delete', exports.delete);
    bindurl('/room/count', exports.count);
    bindurl('/room/import', exports.import);
    bindurl('/room/export', exports.export);
}

// 楼宇页面
exports.page = function(req, res){
    res.render('roompage.html', {
        title: "画作管理"
    });
};

// 查询对象，并返回列表
exports.list = function(req, res){
    var arg = getParam("room list", req, res, [PAGE.page, PAGE.cond, PAGE.sort, PAGE.type]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };

    searchCondExp(arg.cond);
    console.log(arg.cond);
    
    fillUserDept(arg.cond, req);
    roomdb.list(arg.type, arg.cond, page, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        rt(true, {docs: docs}, res);
    });
};

// 查询结果集的返回数量
exports.count = function(req, res){
    var arg = getParam("room count", req, res, [PAGE.cond, PAGE.type]);
    if(!arg.passed)
        return;

    searchCondExp(arg.cond);
    fillUserDept(arg.cond, req);
    roomdb.count(arg.type, arg.cond, function(err, count){
        if(err) return rt(false, err.message, res);
        
        rt(true, {count: count}, res);
    });
}

// 查询对象详细信息
exports.retrive = function(req, res){
    var arg = getParam("retrive room", req, res, [CRUD._id]);
    if(!arg.passed) return;

    roomdb.findById(arg._id, function(err, doc){
        if(err) return rt(false, "查询出错:" + err.message, res);
        if(!doc) return rt(false, "找不到对象：" + _id);

        rt(true, { doc : doc }, res);
    });
}

// 删除对象
exports.delete = function(req, res){
    var arg = getParam("delete room", req, res, [CRUD._id]);
    if(!arg.passed) return;

    roomdb.delete(arg._id , _ResultByState(res, function(err, doc){
        if(err) return rt(false, "删除出错:" + err.message, res);
        
        rt(true, { doc : doc }, res);
    }));
}

// 更新对象
exports.update = function(req, res){

}

// 短链跳转
exports.jump = function(req, res){
    
}

//确认导入
exports.import = function(req, res){
    var arg = getParam("import room file", req, res, [IMP.file, PAGE.type]);
    if(!arg.passed)
        return;
    var file = upload.settings.uploadpath + '/' + arg.file ,
        type = arg.type;

    roomdb.importCSV(file, type, function(err, cnt){
        if(err) return rt(false, "导入文件出错:" + err.message, res);

        rt(true, { count: cnt }, res);
    })
};

//导出楼宇信息
var exporter = function(){
    var columns = ['楼宇名称', '楼宇标识', '归属物业点名称', '归属物业点编号'
        , '地市', '县区', '区域类型1', '区域类型2', '区域类型3'
        , '层数', '面积（平方米）', '常驻人数', '建筑年代'
        , 'GSM室分是否覆盖', 'TD室分是否覆盖', 'WLAN是否覆盖', 'LTE室分是否覆盖'
        , 'A+ABIS接口1', 'A+ABIS接口2', 'A+ABIS接口3'
        , 'GSM小区', 'GSM小区数', 'GSM载频数', 'GSM忙时话音业务量', 'GSM忙时数据等效业务量', 'GSM忙时数据流量（MB）'
        , 'GSM全天话音业务量', 'GSM全天数据等效业务量', 'GSM全天数据流量（MB）'
        , 'TD小区', 'TD小区数', 'TD载频数', 'TD忙时话音业务量', 'TD忙时数据流量（MB）', 'TD全天话音业务量', 'TD全天数据流量（MB）'
        , 'WLAN热点', 'WLAN热点总数', 'WLAN总AP数', 'WLAN全天总流量'
        , 'TD-LTE小区', 'TD-LTE小区数', 'TD-LTE载频数', 'TD-LTE忙时数据流量（MB）', 'TD-LTE全天数据流量（MB）'
        , '照片上传', '历史建设项目'];

    return {
        head : function(){
            return columns.join(',') + '\n';
        },

        data : function(data){
            var out = [data.name, data.buildingId, '', ''
                , data.addComp.city, data.addComp.district, data.areatype1, data.areatype2, data.areatype3  
                , data.level, data.areasize, data.population, data.buildage
                , data.gsmcoverState, data.tdcoverState, data.wlancoverState, data.ltecoverState
                , '', '', ''
                , data.gsmCellItem, data.gsmCellAmount, data.gsmData1, data.gsmData2, data.gsmData3, data.gsmData4, data.gsmData5, data.gsmData6, data.gsmData7
                , data.tdCellItem, data.tdCellAmount, data.tdData1, data.tdData2, data.tdData3, data.tdData4, data.tdData5
                , data.wlanCellItem, data.wlanCellAmount, data.wlanData1, data.wlanData2
                , data.lteCellItem, data.lteCellAmount, data.lteData1, data.lteData2, data.lteData3
                , data.piclist, ''
            ];
            return '"' + out.join('","') + '"\n' ;
        }
    }
}
exports.export = function(req, res){
    var arg = getParam("room list", req, res, [PAGE.cond, PAGE.sort, PAGE.type]);
    if(!arg.passed)
        return;

    searchCondExp(arg.cond);
    fillUserDept(arg.cond, req);
    roomdb.query(arg.type, arg.cond, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        var filename = "export_" + arg.type + "_" + new Date().getTime() + ".csv";
        var exporter = buildingExporter();
        exportToCSVFile(docs, filename, exporter, function(err){
            if(err)
                return rt(false, "导出文件错误:" + err , res);

            return rt(true, {file: filename, fname: "SFMIS-LY-export.csv"}, res);
        });
    });
};

// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===

