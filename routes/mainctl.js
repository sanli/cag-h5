//#!本文件由share.js自动产生于Tue Nov 19 2013 09:33:12 GMT+0800 (CST), 产生命令行为: node share.js gen marketanalysis LIST ..
/**
 * marketanalysisHTTP入口模块, 需要在主文件中添加map
 * app.all('/main/list', apiRestrict, mainctl.list);
 * app.all('/main/count', apiRestrict, mainctl.count);
 */
var getreq = require('../sharepage').getreq
    , getParam = require('../sharepage').getParam
    , rt = require('../sharepage').rt
    , _ResultByState = require('../sharepage')._ResultByState
    , _assertNotNull = require('../sharepage')._assertNotNull
    , searchCondExp = require('../sharepage').searchCondExp
    , inspect = require('util').inspect
    , bindurl = require('../sharepage.js').bindurl
    , getTitle = require('../sharepage.js').getTitle
    , getUserName = require('../sharepage.js').getUserName;

// ===============  定义模块入口文件 ================
exports.bindurl=function(app){
    bindurl(app, '/main.html', { outType : 'page'}, exports.main);
    bindurl(app, '/img.html', { outType : 'page'}, exports.img);
    bindurl(app, '/main/list', exports.list);
    bindurl(app, '/main/count', exports.count);
};

exports.main = function(req, res){
    res.render('mainpage.html', {
        user: getUserName(req),
        title: getTitle("首页"),
        page : 'main',
        target : 'debug',
        stamp : ''
    });
};

exports.img = function(req, res){
    res.render('imgpage.html', {
        user: getUserName(req),
        title: "中华珍宝馆-图片浏览",
        page : 'main',
        target : 'debug',
        stamp : ''
    });
};

var PAGE = {
    // 列表页条件,包括页的开始记录数skip，和页面长度limit 
    page : {name:'page', key:'page', optional: true, default: { skip: 0, limit: 50 }},
    // 查询条件
    cond : {name: 'cond', key: 'cond', optional: true, default: {} },
    // 排序条件
    sort : {name: 'sort', key: 'sort', optional: true, default: { wyData1 :1 } }
}

exports.marketnanalysis = function(req, res){
    getSysconf(function(err, sysconf){
        console.log(sysconf);

        res.render('marketanalysis.html', {
            user: getUserName(req),
            title: getTitle("统计分析-市场营销"),
            page : 'main',
            sysconf : sysconf
        });
    });
};

// 查询对象，并返回列表
exports.list = function(req, res){
    var arg = getParam("analysis", req, res, [PAGE.page, PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;
    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };
    
    searchCondExp(arg.cond);
    // 如果有需要在聚合结果上做的查询,
    // 需要放到聚合完成后加入到查询条件中
    var afterCond = {};
    if(arg.cond.wyData2){
        afterCond.wyData2 = arg.cond.wyData2;
        delete arg.cond.wyData2;
    }

    fillUserDept(arg.cond, req);
    marketanalysisdb.list(arg.cond, page, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        rt(true, {docs: docs}, res);
    }, afterCond);
}

// 查询对象，并返回列表
exports.count = function(req, res){
    var arg = getParam("analysis", req, res, [PAGE.cond]);
    if(!arg.passed)
        return;

    searchCondExp(arg.cond);
    var afterCond = {};
    if(arg.cond.wyData2){
        afterCond.wyData2 = arg.cond.wyData2;
        delete arg.cond.wyData2;
    }

    fillUserDept(arg.cond, req);
    marketanalysisdb.count(arg.cond, function(err, count){
        if(err) return rt(false, err.message, res);
        
        rt(true, {count: count}, res);
    },afterCond);
}

// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===
