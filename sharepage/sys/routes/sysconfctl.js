//#!本文件由share.js自动产生于Thu Mar 13 2014 10:50:31 GMT+0800 (CST), 产生命令行为: node share.js gen sysconf CRUD ..
/**
 * sysconfHTTP入口模块, 需要在主文件中调用一次绑定
 * require('./routes/sysconf').bindurl();
 */
var sysconfdb = require('../data/sysconfdb.js')
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
    , sf = require('../config.js')
    , bindurl = require('../sharepage.js').bindurl

//CRUP参数
var CRUD = {
    data : {name: 'data', key: 'data', optional: false},
    _id : {name:'_id', key:'_id', optional: false},
}

// 注册URL
exports.bindurl=function(app){
    bindurl(app, '/sysconf.html', { outType : 'page'}, exports.sysconf);
    bindurl(app, '/sysconf/retrive', exports.retrive);
    bindurl(app, '/sysconf/retriveMeta', exports.retriveMeta);
    bindurl(app, '/sysconf/update', exports.update);
}

// 访问页面
exports.sysconf = function(req, res){
    res.render('sysconf.html', {
        conf : require('../config.js'),
        user: req.session.user,
        title: sf.getTitle("需求管理满足率"),
        page : 'main',
        referer : req.header('Referer'),
        commons : require('./sfcommonsctl.js'),
    });
};

// 查询对象详细信息｀
exports.retrive = function(req, res){
    sysconfdb.getSysconf(function(err, doc){
        if(err) return rt(false, "查询出错:" + err.message, res);

        rt(true, { doc : doc }, res);
    });
}

// 查询配置元信息
exports.retriveMeta = function(req, res){
    rt(true,  { doc : sysconfdb.sysconfMeta }, res);
}

// 更新配置信息出错
exports.update = function(req, res){
    var arg = getParam("retrive sysconf", req, res, [CRUD._id, CRUD.data]);
    if(!arg.passed) return;

    sysconfdb.update(arg._id, arg.data, function(err){
        if(err) return rt(false, "更新配置出错:" + err.message, res);

        rt(true, { _id : arg._id }, res);
    });   
}

// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===

