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
    , getUserName = require('../sharepage.js').getUserName
    , conf = require('../config.js')
    // 正常的情况下使用mongodb存储数据
    , paintdb = require('../data/paintingsdb.js')
    // 如果mongodb实效，需要放开下面语句，使用基于文件的数据列表
    //, paintdb = require('../data/cagstore_paintingsdb.js')
    , extend = require('node.extend');

// ===============  定义模块入口文件 ================
exports.bindurl=function(app){
    bindurl(app, '/', { outType : 'page', needAuth : false } , exports.main);
    bindurl(app, '/main.html', { outType : 'page', needAuth : false }, exports.main);
    bindurl(app, '/img.html', { outType : 'page', needAuth : false }, exports.img);
    // imglite.html 是精简版本的图片浏览器，只支持部分功能，用于手持设备浏览器，Android, IOS
    bindurl(app, '/imglite.html', { outType : 'page', needAuth : false }, exports.imglite);
    bindurl(app, '/message.html', { outType : 'page', needAuth : false }, exports.message);
    bindurl(app, '/message.json', { outType : 'page', needAuth : false }, exports.messagejson);
    bindurl(app, '/cagstore/essence.json', { needAuth : false }, exports.essence);
    bindurl(app, '/cagstore/search.json', { needAuth : false }, exports.search);
    bindurl(app, '/cagstore/fileinfo.json', { needAuth : false }, exports.fileinfo);
    bindurl(app, '/cagstore/outline.json', { needAuth : false }, exports.outline);
};

var PAGE = {
    // 列表页条件,包括页的开始记录数skip，和页面长度limit 
    page : {name:'page', key:'page', optional: true, default: { skip: 0, limit: 50 }},
    // 查询条件
    cond : {name: 'cond', key: 'cond', optional: true, default: {} },
    // 排序条件
    sort : {name: 'sort', key: 'sort', optional: true, default: { wyData1 :1 } },
    // 图片浏览的UUID
    uuid : {name: 'uuid', key: 'uuid', optional: true, default: '538054ebab18e5515c68a7eb'},
    // 视图类型
    view : {name: 'view', key: 'view', optional: true, default: 'pageview' }
}

exports.main = function(req, res){
    res.render('mainpage.html', {
        user: getUserName(req),
        title: getTitle("首页"),
        page : 'main',
        target : conf.target,
        stamp : conf.stamp
    });
};

exports.message = function(req, res){
    res.render('message.html', {
        user: getUserName(req),
        title: getTitle("系统消息"),
        page : 'message',
        target : conf.target,
        stamp : conf.stamp
    });
};

var message = require('../data/message.js');
exports.messagejson = function(req, res){
    writejson(res, message.getMessages());
};

exports.img = function(req, res){
    renderImg(req, res, 'imgpage.html');
};

exports.imglite = function(req, res){
    renderImg(req, res, 'imglitepage.html');
};

function renderImg(req, res, templ){
    var arg = getParam("img", req, res, [ PAGE.uuid, PAGE.view ]);
    if(!arg.passed)
        return;

    res.render(templ, {
        user: getUserName(req),
        title: "中华珍宝馆-图片浏览",
        page : 'main',
        target : conf.target,
        stamp : conf.stamp,
        arg: arg
    });
    
    // 记录访问次数
    paintdb.incViewCount(arg.uuid, function(err){
        if(err) console.log(err);
    })
}

function writejson(res, json){
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(json);
};

// 返回系统推荐的图片，首页初次打开时返回
exports.essence = function(req, res){
    //paintdb.queryfile({ active : { $ne : false} , essence : true }
    // paintdb.queryfile({ active : { $ne : false} }
    paintdb.queryfile({ active : true , essence : true }
        , { files : false }
        , { essenceSort : -1, author : 1 }
        , function(err, fileinfos){
            if(err) return rt(false, err.message, res);
            writejson(res, fileinfos);
        });
}

// 查询文件信息列表
exports.search = function(req, res){
    var arg = getParam("outline", req, res, [ PAGE.cond ]);
    if(!arg.passed)
        return;

    searchCondExp(arg.cond);
    //var cond = extend({ active : { $ne : false} }, arg.cond );
    var cond = extend({ active : true }, arg.cond );
    paintdb.queryfile(cond
        , { files : false }
        , { author : 1, commonSort : -1 }
        , function(err, fileinfos){
            if(err) return rt(false, err.message, res);

           writejson(res, fileinfos);
        }, true);
}

// 查询文件信息列表
exports.fileinfo = function(req, res){
    var arg = getParam("outline", req, res, [ PAGE.cond ]);
    if(!arg.passed)
        return;

    searchCondExp(arg.cond);
    //var cond = extend({ active : { $ne : false} }, arg.cond );
    var cond = extend({ active : true }, arg.cond );
    paintdb.queryfile(cond
        , { files : false }
        , { author : 1 }
        , function(err, fileinfos){
            if(err) return rt(false, err.message, res);

           writejson(res, fileinfos);
        });
}

// 返回作品列表
exports.outline = function(req, res){
    var arg = getParam("outline", req, res, [ PAGE.cond ]);
    if(!arg.passed)
        return;

    // 查询outline
    var cond = extend({ active : true }, arg.cond );
    paintdb.outline( cond , function(err, outline){
        if(err) return rt(false, err.message, res);

        writejson(res, outline);
    });
}

// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===
