//#!本文件由share.js自动产生于Fri Oct 17 2014 21:38:22 GMT+0800 (CST), 产生命令行为: node share.js gen sys_enum CRUD ..
/**
 * sys_enumHTTP入口模块, 需要在主文件中添加map
 * var sys_enum = require('./routes/sys_enum').bindurl(app);
 */
var sys_enumdb = require('../data/sys_enumdb.js')
    // base function
    , share = require('../../../sharepage')
    , sf = require('../../../config.js')
    , conf = require('../../../config.js')
    , inspect = require('util').inspect
    , ObjectID = require('mongodb').ObjectID;

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
//CRUD参数
var CRUD = {
    data : {name: 'data', key: 'data', optional: false},
    _id : {name:'_id', key:'_id', optional: false},
}


// 注册URL
exports.bindurl=function(app){
    share.bindurl(app, '/sys_enum.html', { outType : 'page'}, exports.page);
    share.bindurl(app, '/sys_enum/create', exports.create);
    share.bindurl(app, '/sys_enum/update', exports.update);
    share.bindurl(app, '/sys_enum/list', exports.list);
    share.bindurl(app, '/sys_enum/retrive', exports.retrive);
    share.bindurl(app, '/sys_enum/delete', exports.delete);
    share.bindurl(app, '/sys_enum/count', exports.count);
    share.bindurl(app, '/sys_enum/import', exports.import);
    share.bindurl(app, '/sys_enum/export', exports.export);

    //TODO: 扩展的API加在下面
    // ...
}

// GUI页面
exports.page = function(req, res){
    res.render('sys/sys_enumpage.html', {
        conf : conf,
        target : conf.target,
        stamp : conf.stamp,
        title: "数据字典",
        user : req.session.user,
        commons : require('./commonsctl.js')
    });
};

// 更新对象
exports.create = function(req, res){
    var arg = share.getParam("创建新sys_enum对象:", req, res, [CRUD.data]);
    if(!arg.passed)
       return;

    sys_enumdb.create(arg.data, function(err, newDoc){
        if(err) return share.rt(false, "创建新sys_enum对象出错:" + err.message, res);

        share.rt(true, { _id: newDoc._id }, res);
    });
}

// 更新对象
exports.update = function(req, res){
    var arg = share.getParam("更新sys_enum对象", req, res, [CRUD._id, CRUD.data]);
    if(!arg.passed) return;

    console.log(arg._id);

    var data = arg.data;
    delete data._id;
    sys_enumdb.update( arg._id , data , function(err, cnt){
        if(err) {
            console.log(err);
            return share.rt(false, "更新sys_enum出错:" + err.message, res);
        }
        
        share.rt(true, { cnt : cnt }, res);
    });
}


// 查询对象，并返回列表
exports.list = function(req, res){
    var arg = share.getParam("查询sys_enum列表", req, res, [PAGE.page, PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };

    share.searchCondExp(arg.cond);
    console.log(arg.cond);
    
    share.fillUserDataRule(arg.cond, req);
    sys_enumdb.list(arg.cond, arg.sort, page, function(err, docs){
        if(err) return share.rt(false, err.message, res);
        
        share.rt(true, {docs: docs}, res);
    });
};

// 查询结果集的返回数量
exports.count = function(req, res){
    var arg = share.getParam("sys_enum count", req, res, [PAGE.cond]);
    if(!arg.passed)
        return;

    share.searchCondExp(arg.cond);
    share.fillUserDataRule(arg.cond, req);
    sys_enumdb.count(arg.cond, function(err, count){
        if(err) return share.rt(false, err.message, res);
        
        share.rt(true, {count: count}, res);
    });
}

// 查询对象详细信息
exports.retrive = function(req, res){
    var arg = share.getParam("retrive sys_enum", req, res, [CRUD._id]);
    if(!arg.passed) return;

    sys_enumdb.findById(arg._id, function(err, doc){
        if(err) return share.rt(false, "查询sys_enum出错:" + err.message, res);
        if(!doc) return share.rt(false, "找不到对象：" + _id);

        share.rt(true, { doc : doc }, res);
    });
}


// 删除对象
exports.delete = function(req, res){
    var arg = share.getParam("delete sys_enum", req, res, [CRUD._id]);
    if(!arg.passed) return;

    sys_enumdb.delete(arg._id , function(err, doc){
        if(err) return share.rt(false, "删除sys_enum出错:" + err.message, res);
        
        share.rt(true, { doc : doc }, res);
    });
}

// 短链跳转，通过特定ID跳转到某个页面，大部分情况下不用实现
exports.jump = function(req, res){
    //TODO: 加入短链跳转
}

//确认导入CSV格式的数据
exports.import = function(req, res){
    var arg = share.getParam("import sys_enum file", req, res, [IMP.file]);
    if(!arg.passed)
        return;
    var file = upload.settings.uploadpath + '/' + arg.file ,
        type = arg.type;

    sys_enumdb.importCSV(file, type, function(err, cnt){
        if(err) return share.rt(false, "导入sys_enum文件出错:" + err.message, res);

        share.rt(true, { count: cnt }, res);
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
    var arg = getParam("sys_enum list", req, res, [PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    searchCondExp(arg.cond);
    fillUserDept(arg.cond, req);
    sys_enumdb.query(arg.cond, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        var filename = "export_" + arg.type + "_" + new Date().getTime() + ".csv";
        var exporter = sys_enumdb.createExporter();
        share.exportToCSVFile(docs, filename, exporter, function(err){
            if(err)
                return rt(false, "导出文件错误:" + err , res);

            return rt(true, {file: filename, fname: "SFMIS-LY-export.csv"}, res);
        });
    });
};

// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===





