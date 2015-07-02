//#!本文件由share.js自动产生于Fri Dec 12 2014 17:12:38 GMT+0800 (CST), 产生命令行为: node share.js gen sys_utilities CRUD ..
/**
 * sys_utilitiesHTTP入口模块, 需要在主文件中添加map
 * var sys_utilities = require('./routes/sys_utilities').bindurl(app);
 */
var sys_utilitiesdb = require('../data/sys_utilitiesdb.js')
    // base function
    , share = require('../sharepage')
    , sf = require('../config.js')
    , inspect = require('util').inspect
    , ObjectID = require('mongodb').ObjectID
    , upload = require('./upload');

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
    share.bindurl(app, '/sys_utilities.html', { outType : 'page'}, exports.page);
    share.bindurl(app, '/sys_utilities/create', exports.create);
    share.bindurl(app, '/sys_utilities/update', exports.update);
    share.bindurl(app, '/sys_utilities/list', exports.list);
    share.bindurl(app, '/sys_utilities/retrive', exports.retrive);
    share.bindurl(app, '/sys_utilities/delete', exports.delete);
    share.bindurl(app, '/sys_utilities/count', exports.count);
    share.bindurl(app, '/sys_utilities/import', exports.import);
    share.bindurl(app, '/sys_utilities/templ', exports.templ);
    share.bindurl(app, '/sys_utilities/export', exports.export);

    //TODO: 扩展的API加在下面
    // ...
}


// GUI页面
exports.page = function(req, res){
    res.render('sys_utilitiespage.html', {
        conf : require('../../../config.js'),
        title: sf.getTitle("数据工具"),
        user : req.session.user,
        commons : require('./sfcommonsctl.js')
    });
};

// 更新对象
exports.create = function(req, res){
    var arg = share.getParam("创建新sys_utilities对象:", req, res, [CRUD.data]);
    if(!arg.passed)
       return;

    sys_utilitiesdb.create(arg.data, function(err, newDoc){
        if(err) return share.rt(false, "创建新sys_utilities对象出错:" + err.message, res);

        share.rt(true, { _id: newDoc._id }, res);
    });
}

// 更新对象
exports.update = function(req, res){
    var arg = share.getParam("更新sys_utilities对象", req, res, [CRUD._id, CRUD.data]);
    if(!arg.passed) return;

    console.log(arg._id);

    var data = arg.data;
    delete data._id;
    sys_utilitiesdb.update( arg._id , data , function(err, cnt){
        if(err) {
            console.log(err);
            return share.rt(false, "更新sys_utilities出错:" + err.message, res);
        }
        
        share.rt(true, { cnt : cnt }, res);
    });
}


// 查询对象，并返回列表
exports.list = function(req, res){
    var arg = share.getParam("查询sys_utilities列表", req, res, [PAGE.page, PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };

    share.searchCondExp(arg.cond);
    console.log(arg.cond);
    
    share.fillUserDataRule(arg.cond, req);
    sys_utilitiesdb.list(arg.cond, arg.sort, page, function(err, docs){
        if(err) return share.rt(false, err.message, res);
        
        share.rt(true, {docs: docs}, res);
    });
};

// 查询结果集的返回数量
exports.count = function(req, res){
    var arg = share.getParam("sys_utilities count", req, res, [PAGE.cond]);
    if(!arg.passed)
        return;

    share.searchCondExp(arg.cond);
    share.fillUserDataRule(arg.cond, req);
    sys_utilitiesdb.count(arg.cond, function(err, count){
        if(err) return share.rt(false, err.message, res);
        
        share.rt(true, {count: count}, res);
    });
}

// 查询对象详细信息
exports.retrive = function(req, res){
    var arg = share.getParam("retrive sys_utilities", req, res, [CRUD._id]);
    if(!arg.passed) return;

    sys_utilitiesdb.findById(arg._id, function(err, doc){
        if(err) return share.rt(false, "查询sys_utilities出错:" + err.message, res);
        if(!doc) return share.rt(false, "找不到对象：" + _id);

        share.rt(true, { doc : doc }, res);
    });
}


// 删除对象
exports.delete = function(req, res){
    var arg = share.getParam("delete sys_utilities", req, res, [CRUD._id]);
    if(!arg.passed) return;

    sys_utilitiesdb.delete(arg._id , function(err, doc){
        if(err) return share.rt(false, "删除sys_utilities出错:" + err.message, res);
        
        share.rt(true, { doc : doc }, res);
    });
}

// 短链跳转，通过特定ID跳转到某个页面，大部分情况下不用实现
exports.jump = function(req, res){
    //TODO: 加入短链跳转
}

//确认导入CSV格式的数据
exports.import = function(req, res){
    var arg = share.getParam("import sys_utilities file", req, res, [IMP.file]);
    if(!arg.passed)
        return;
    var file = upload.settings.uploadpath + '/' + arg.file ,
        type = arg.type;

    sys_utilitiesdb.importCSV(file, type, function(err, cnt){
        if(err) return share.rt(false, "导入sys_utilities文件出错:" + err.message, res);

        share.rt(true, { count: cnt }, res);
    })
};

exports.templ = function(req, res){
    var filename = encodeURI('数据工具导入表模版.csv');
    res.attachment(filename);
    res.send(sys_utilitiesdb.cvsfield.join(','));
    res.send(require('iconv-lite').encode( sys_utilitiesdb.cvsfield.join(','), 'gbk' ));
}

exports.export = function(req, res){
    var arg = share.getParam("sys_utilities list", req, res, [PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    share.searchCondExp(arg.cond);
    share.fillUserDataRule(arg.cond, req);
    sys_utilitiesdb.query(arg.cond, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        var filename = "sys_utilities_export_"  + new Date().getTime() + ".csv";
        var exporter = sys_utilitiesdb.createExporter();
        share.exportToCSVFile(docs, filename, exporter, function(err){
            if(err)
                return share.rt(false, "导出文件错误:" + err , res);

            return share.rt(true, {file: filename, fname: "数据工具数据_"
                    + new Date().toISOString().replace(/T.*Z/,'') +".csv"}, res);
        });
    });
};



// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===





