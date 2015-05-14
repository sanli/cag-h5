//#!本文件由share.js自动产生于Tue Nov 19 2013 09:33:12 GMT+0800 (CST), 产生命令行为: node share.js gen marketanalysis LIST ..
/**
 * marketanalysisHTTP入口模块, 需要在主文件中添加map
 * app.all('/main/list', apiRestrict, mainctl.list);
 * app.all('/main/count', apiRestrict, mainctl.count);
 */
var getreq = require('../sharepage').getreq
    , getParam = require('../sharepage').getParam
    , share = require('../sharepage')
    , inspect = require('util').inspect
    , bindurl = require('../sharepage.js').bindurl
    , getTitle = require('../sharepage.js').getTitle
    , getUser = require('../sharepage.js').getUser
    , conf = require('../config.js')
    // 正常的情况下使用mongodb存储数据
    , paintdb = require('../data/paintingsdb.js')
    // 如果mongodb实效，需要放开下面语句，使用基于文件的数据列表
    , file_paintdb = require('../data/cagstore_paintingsdb.js')
    , extend = require('node.extend');

exports.broadcast = "";

// ===============  定义模块入口文件 ================
exports.bindurl=function(app){
    bindurl(app, '/', { outType : 'page', needAuth : false } , exports.main);
    bindurl(app, '/main.html', { outType : 'page', needAuth : false }, exports.main);
    bindurl(app, '/img.html', { outType : 'page', needAuth : false }, exports.img);
    bindurl(app, '/img/:uuid', { outType : 'page', needAuth : false }, exports.img);
    bindurl(app, '/datatoys.html', { outType : 'page', needAuth : false }, exports.datatoys);
    // imglite.html 是精简版本的图片浏览器，只支持部分功能，用于手持设备浏览器，Android, IOS
    bindurl(app, '/imglite.html', { outType : 'page', needAuth : false }, exports.imglite);
    bindurl(app, '/imglite/:uuid', { outType : 'page', needAuth : false }, exports.imglite);
    bindurl(app, '/message.html', { outType : 'page', needAuth : false }, exports.message);
    bindurl(app, '/blog', { outType : 'page', needAuth : false }, exports.blog);
    bindurl(app, '/message.json', { outType : 'page', needAuth : false }, exports.messagejson);
    bindurl(app, '/cagstore/essence.json', { needAuth : false }, exports.essence);
    bindurl(app, '/cagstore/search.json', { needAuth : false }, exports.search);
    bindurl(app, '/cagstore/fileinfo.json', { needAuth : false }, exports.fileinfo);
    bindurl(app, '/cagstore/outline.json', { needAuth : false }, exports.outline);
    bindurl(app, '/cagstore/info.json', { needAuth : false }, exports.info);
    bindurl(app, '/cagstore/broadcast', { needAuth : false }, exports.broadcast);
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
    // 消息内容
    message : {name: 'message', key: 'message', optional: true, default: ''},
    // 视图类型
    view : {name: 'view', key: 'view', optional: true, default: 'pageview' }
}

exports.broadcast = function(req, res){
    var arg = getParam("outline", req, res, [ PAGE.uuid , PAGE.message]);
    if(!arg.passed)
        return;

    if(arg.uuid === 'let_us_say_something'){
        exports.broadcast_message = arg.message;
    }else{
        exports.broadcast_message = "";
    }
    writejson(res, { message : exports.broadcast_message });
}

// 发送到前段显示的消息
exports.main = function(req, res){
    res.render('mainpage.html', {
        user : getUser(req),
        torist : share.getTourist(req),
        title: getTitle("首页"),
        page : 'main',
        target : conf.target,
        stamp : conf.stamp,
        conf : conf,
        opt : {
            message : exports.broadcast_message
        }
    });
};

exports.datatoys = function(req, res){
    res.render('datatoyspage.html', {
        user: getUser(req),
        torist : share.getTourist(req),
        title: getTitle("千年一览"),
        page : 'datatoys',
        target : conf.target,
        stamp : conf.stamp,
        conf : conf
    });
};

exports.blog = function(req, res){
    res.render('blogpage.html', {
        user: getUser(req),
        torist : share.getTourist(req),
        title: getTitle("日志"),
        target : conf.target,
        stamp : conf.stamp,
        conf : conf
    });
};

exports.message = function(req, res){
    res.render('message.html', {
        user: getUser(req),
        torist : share.getTourist(req),
        title: getTitle("系统消息"),
        page : 'message',
        target : conf.target,
        stamp : conf.stamp,
        conf : conf
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

    paintdb.findById(arg.uuid
        , { age : 1 , areaSize : 1 , author : 1 , desc : 1 , descUrl : 1 , essenceComment : 1 , 
            mediaType : 1 , offlineUrl : 1 , originalUrl : 1 , ownerName : 1 , paintingName : 1 , 
            pixels : 1, size : 1, maxlevel : 1, minlevel :1 }
        , function(err, info){
            if(err) return share.errpage( err.message, req, res );

            chkbookmark(share.getTourist(req), arg.uuid, function(err, booked){
                // 输出页面
                res.render(templ, {
                    user: getUser(req),
                    torist : share.getTourist(req),
                    title: "中华珍宝馆 " + info.age + ' ' + info.author + ' ' + info.paintingName,
                    page : 'main',
                    target : conf.target,
                    stamp : conf.stamp,
                    conf : conf,
                    arg: arg,
                    info : info,
                    bookmarked : booked
                });

                // 记录访问次数
                paintdb.incViewCount(arg.uuid, function(err){
                    if(err) console.log(err);
                })
            });
        });
}

var bookmarkdb = require('../data/bookmarkdb.js');
function chkbookmark(tourist, paintingid, fn){
    if(!tourist) return fn(null, false);

    bookmarkdb.findByCond({
        userid : tourist.userid, 
        'mark.paintingid' : paintingid
    }, function(err, doc){
        if(err) return fn(err);
        if(!doc) return fn(null, false);

        return fn(null, true);
    });
}

function writejson(res, json){
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(json);
};

// 返回系统推荐的图片，首页初次打开时返回
exports.essence = function(req, res){
    // paintdb.queryfile({ active : { $ne : false} , essence : true }
    // paintdb.queryfile({ active : { $ne : false} }
    paintdb.queryfile({ active : true , essence : true }
        , { files : false }
        , { essenceSort : -1, author : 1 }
        , function(err, fileinfos){
            if(err) return share.rt(false, err.message, res);
            writejson(res, fileinfos);
        });
}

// 查询文件信息列表
exports.search = function(req, res){
    var arg = getParam("outline", req, res, [ PAGE.cond, PAGE.page ]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };

    share.searchCondExp(arg.cond);
    //var cond = extend({ active : { $ne : false} }, arg.cond );
    var cond = extend({ active : true }, arg.cond );
    paintdb.queryfile(cond
        , { files : false }
        , { author : 1, commonSort : -1 }
        , function(err, fileinfos){
            if(err) return share.rt(false, err.message, res);

            fileinfos =  fileinfos.slice(page.skip, page.limit);
            writejson(res, fileinfos);
        }, true);
}

// 查询符合条件的所有文件信息列表
exports.fileinfo = function(req, res){
    var arg = getParam("fileinfo", req, res, [ PAGE.cond ]);
    if(!arg.passed)
        return;

    share.searchCondExp(arg.cond);
    //var cond = extend({ active : { $ne : false} }, arg.cond );
    var cond = extend({ active : true , deleted : { $ne : true } }, arg.cond );
    paintdb.queryfile(cond
        , { files : false }
        , { author : 1 }
        , function(err, fileinfos){
            if(err) return share.rt(false, err.message, res);

           writejson(res, fileinfos);
        });
}

// 查询ID的用户信息
exports.info = function(req, res){
    var arg = getParam("fileinfo", req, res, [ PAGE.uuid ]);
    if(!arg.passed)
        return;
    if( !arg.uuid )
        return share.rt(false, "没有制定uuid", res);


    paintdb.findById(arg.uuid
        , { age : 1 , areaSize : 1 , author : 1 , desc : 1 , descUrl : 1 , essenceComment : 1 , mediaType : 1 , 
            offlineUrl : 1 , originalUrl : 1 , ownerName : 1 , paintingName : 1 , pixels : 1 }
        , function(err, info){
            if(err) return share.rt(false, err.message, res);

           writejson(res, info);
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
        if(err) return share.rt(false, err.message, res);

        writejson(res, outline);
    });
}

// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===
