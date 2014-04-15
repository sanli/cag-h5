//#!本文件由share.js自动产生于<M%=new Date() %M>, 产生命令行为: node share.js gen <M%=module_name %M> IMPORT ..
/**
 * <M%=module_name %M>HTTP入口模块, 需要在主文件中添加map
 * var <M%=module_name %M> = require('./routes/<M%=module_name %M>');
 * app.all('/<M%=module_name %M>/list', apiRestrict, <M%=module_name %M>.list);
 * app.all('/<M%=module_name %M>/count', apiRestrict, <M%=module_name %M>.count);
 * app.all('/<M%=module_name %M>/import', apiRestrict, <M%=module_name %M>.import);
 */
var <M%=module_name %M>db = require('../data/<M%=module_name %M>db.js')
    , getreq = require('../sharepage').getreq
    , getParam = require('../sharepage').getParam
    , rt = require('../sharepage').rt
    , _ResultByState = require('../sharepage')._ResultByState
    , _assertNotNull = require('../sharepage')._assertNotNull
    , inspect = require('util').inspect
    , ObjectID = require('mongodb').ObjectID
    , upload = require('./upload')
    , fillUserDept = require('./user.js').fillUserDept;

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



// 查询对象，并返回列表
exports.list = function(req, res){
    var arg = getParam("<M%=module_name %M> list", req, res, [PAGE.page, PAGE.cond, PAGE.sort, PAGE.type]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };

    fillUserDept(arg.cond, req);
    <M%=module_name %M>db.list(arg.type, arg.cond, page, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        rt(true, {docs: docs}, res);
    });
};

// 查询结果集的返回数量
exports.count = function(req, res){
    var arg = getParam("<M%=module_name %M> count", req, res, [PAGE.cond, PAGE.type]);
    if(!arg.passed)
        return;

    fillUserDept(arg.cond, req);
    <M%=module_name %M>db.count(arg.type, arg.cond, function(err, count){
        if(err) return rt(false, err.message, res);
        
        rt(true, {count: count}, res);
    });
}

//确认导入
exports.import = function(req, res){
    var arg = getParam("import <M%=module_name %M> file", req, res, [IMP.file, PAGE.type]);
    if(!arg.passed)
        return;
    var file = upload.settings.uploadpath + '/' + arg.file ,
        type = arg.type;

    <M%=module_name %M>db.importCSV(file, type, function(err, cnt){
        if(err) return rt(false, "导入文件出错:" + err.message, res);

        rt(true, { count: cnt }, res);
    })
};

// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===

