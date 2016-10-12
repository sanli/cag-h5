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
    , async = require('async')
    , us = require('underscore')
    , extend = require('node.extend')
    , writejson = require('./cagcommonsctl.js').writejson
    , exhibits = require('./exhibitctl.js');

exports.broadcast = "";

// ===============  定义模块入口文件 ================
exports.bindurl=function(app){
    // 大厅
    bindurl(app, '/', { outType : 'page', needAuth : false } , exports.main);
    bindurl(app, '/l/:target', { outType : 'page', needAuth : false } , exports.shortlink);
    bindurl(app, '/main.html', { outType : 'page', needAuth : false }, exports.main);
    bindurl(app, '/comments', { outType : 'page', needAuth : false }, exports.dscomments);
    bindurl(app, '/donate', { outType : 'page', needAuth : false }, exports.donate);
    
    // 看图
    bindurl(app, '/img.html', { outType : 'page', needAuth : false }, exports.img);
    bindurl(app, '/img/:uuid', { outType : 'page', needAuth : false }, exports.img);
    bindurl(app, '/img/:uuid/download', { outType : 'page', authRule : 'tourist' }, exports.download);
    // imglite.html 是精简版本的图片浏览器，只支持部分功能，用于手持设备浏览器，Android, IOS
    bindurl(app, '/imglite.html', { outType : 'page', needAuth : false }, exports.imglite);
    bindurl(app, '/imglite/:uuid', { outType : 'page', needAuth : false }, exports.imglite);
    bindurl(app, '/outline/:age/:author/:paintingName', { outType : 'page', needAuth : false }, exports.imgliteOfOutline );
    bindurl(app, '/feedbacklite.html', { outType : 'page', needAuth : false }, exports.feedbacklite);
    
    // 实验性页面
    bindurl(app, '/datatoys.html', { outType : 'page', needAuth : false }, exports.datatoys);
    bindurl(app, '/message.html', { outType : 'page', needAuth : false }, exports.message);
    
    // 公告消息页
    bindurl(app, '/blog', { outType : 'page', needAuth : false }, exports.blog);

    // api
    bindurl(app, '/message.json', { outType : 'page', needAuth : false }, exports.messagejson);
    bindurl(app, '/cagstore/essence.json', { needAuth : false }, exports.essence);
    bindurl(app, '/cagstore/search.json', { needAuth : false }, exports.search);
    bindurl(app, '/cagstore/fileinfo.json', { needAuth : false }, exports.fileinfo);
    bindurl(app, '/cagstore/outline.json', { needAuth : false }, exports.outline);
    bindurl(app, '/cagstore/outline_d3.json', { needAuth : false }, exports.outline_d3);
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
    view : {name: 'view', key: 'view', optional: true, default: 'pageview' },
    // 类型
    type : {name: 'type', key: 'type', optional: true, default: 'essense' },
    // 作者名称
    age : {name: 'age', key: 'age', optional: true, default: '' },
    // 作者名称
    author : {name: 'author', key: 'author', optional: true, default: '' },
    // 作品名称
    paintingName : {name: 'paintingName', key: 'paintingName', optional: true, default: '' },
    // 作者名称
    key : {name: 'key', key: 'key', optional: true, default: '' } ,
    // 短链接跳转
    target : {name: 'target', key: 'target', optional: true, default: '' } ,
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



exports.shortlink = function(req, res){
    var arg = getParam("shortlink", req, res, [ PAGE.target]);
    if(!arg.passed)
        return;

    var slink = {
        iosapp  : 'https://itunes.apple.com/cn/app/zhong-hua-zhen-bao-guan/id905220385?mt=8'
    };

    var target = slink[arg.target] || 'http://ltfc.net';
    res.redirect(target);
}

// 发送到前段显示的消息
exports.main = function(req, res){
    _outline({}, true, function(err, outline){
        // 各个展馆的数据
        var exhibitsData = {},
        // 题头图
            headPainting = [];

        // 查询各个展馆，每个展馆输出两行到首页上
        async.series([
            function(cb){
                exhibits.query_exhibit(exhibits.meta.铭心绝品
                    , { page : { skip : 0 , limit : 1 } }
                    , function(err, fileinfos){
                        if(err) cb(err);

                        exhibitsData['铭心绝品'] = fileinfos;
                        cb();
                    });
            },
            function(cb){
                exhibits.query_exhibit(exhibits.meta.精品馆
                    , { page : { skip : 0 , limit : 8 } }
                    , function(err, fileinfos){
                        if(err) cb(err);

                        exhibitsData['精品馆'] = fileinfos;
                        cb();
                    });
            },
            function(cb){
                exhibits.query_exhibit(exhibits.meta.新发图
                    , { 
                        page : { skip : 0 , limit : 8 },
                        // 已经出现在精品馆的图，在首页上不出现在新发图中
                        cond : { "essence" : false }
                    }
                    , function(err, fileinfos){
                        if(err) cb(err);

                        exhibitsData['新发图'] = fileinfos;
                        cb();
                    });
            },
            function(cb){
                exhibits.query_exhibit(exhibits.meta.当代馆
                    , { 
                        page : { skip : 0 , limit : 2 },
                        cond : { "essence" : false }
                    }
                    , function(err, fileinfos){
                        if(err) cb(err);

                        exhibitsData['当代馆'] = fileinfos;
                        cb();
                    });
            }]
        ,function(err){
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.render('mainpage.html', {
                user : share.getUser(req),
                torist : share.getTourist(req),
                title: getTitle("首页"),
                page : 'main',
                target : conf.target,
                stamp : conf.stamp,
                conf : conf,
                cagstores : exhibitsData,
                exhibits : exhibits.meta,
                headPainting : headPainting,
                outline : outline,
                opt : {
                    message : exports.broadcast_message,
                    hide_search : false
                }
            });
        });
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
        conf : conf,
        opt : {
            hide_search : true
        }
    });
};

exports.blog = function(req, res){
    res.render('blogpage.html', {
        user: getUser(req),
        torist : share.getTourist(req),
        title: getTitle("日志"),
        target : conf.target,
        stamp : conf.stamp,
        conf : conf,
        opt : {
            hide_search : true
        }
    });
};

// 多说注释列表
exports.dscomments = function(req, res){
    res.render('dscommentpage.html', {
        user : share.getUser(req),
        torist : share.getTourist(req),
        title: "最近评论",
        page : 'commons',
        target : conf.target,
        stamp : conf.stamp,
        conf : conf,
        opt : {
            message : exports.broadcast_message,
            hide_search : false
        }
    });
};

// 赞助页面
exports.donate = function(req, res){
    res.render('donate.html', {
        user : share.getUser(req),
        torist : share.getTourist(req),
        title: "赞助",
        page : 'commons',
        target : conf.target,
        stamp : conf.stamp,
        conf : conf,
        opt : {
            message : exports.broadcast_message,
            hide_search : false
        }
    });
};

// 用户消息
exports.message = function(req, res){
    res.render('message.html', {
        user: getUser(req),
        torist : share.getTourist(req),
        title: getTitle("系统消息"),
        page : 'message',
        target : conf.target,
        stamp : conf.stamp,
        conf : conf,
        opt : {
            hide_search : true
        }
    });
};

var message = require('../data/message.js');
exports.messagejson = function(req, res){
    writejson(res, message.getMessages());
};

exports.img = function(req, res){
    renderImg(req, res, {
        'v1' : 'imgpage.html',
        'v2' : 'imgpage_v2.html',
    });
};

exports.imglite = function(req, res){
    renderImg(req, res, {
        'v1' : 'imglitepage.html',
        'v2' : 'imglitepage_v2.html'
    });
};


function renderImg(req, res, templopt){
    var agent = req.get('User-Agent');
    if(/.*PhantomJS.*/.test(agent)){
        //抓图工具
        return;
    }

    var arg = getParam("img", req, res, [ PAGE.uuid, PAGE.view ]);
    if(!arg.passed)
        return;

    paintdb.findById(arg.uuid
        , { age : 1 , areaSize : 1 , author : 1 , desc : 1 , descUrl : 1 , essenceComment : 1 , 
            mediaType : 1 , offlineUrl : 1 , originalUrl : 1 , ownerName : 1 , paintingName : 1 , 
            pixels : 1, size : 1, maxlevel : 1, minlevel :1, version : 1 }
        , function(err, info){
            if(err) return share.errpage( err.message, req, res );
            if(!info) return share.errpage('出错了，查找的图片不存在。', req, res );

            var version = info.version || 'v1';
            var templ = templopt[version];
            if(!templ) return share.errpage(`出错了，找不到正确的图片展示引擎。`, req, res );


            chkbookmark(share.getTourist(req), arg.uuid, function(err, booked){
                res.setHeader('Cache-Control', 'public, max-age=3600');

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
                    bookmarked : booked,
                    opt : {
                        hide_search : true
                    }
                });

                // 记录访问次数
                paintdb.incViewCount(arg.uuid, function(err){
                    if(err) console.log(err);
                })
            });
        });
}

// 通过  age / author / paintingName 查找作品，显示找到的第一幅作品
exports.imgliteOfOutline = function(req, res){
    var arg = getParam("img", req, res, [ PAGE.age, PAGE.author, PAGE.paintingName, PAGE.view ]);
    if(!arg.passed)
        return;

    if(!arg.age || !arg.author || !arg.paintingName)
        return share.errpage( "缺少必要条件", req, res );

    paintdb.findByCond({ age : arg.age , author : arg.author, paintingName : arg.paintingName }, function(err, doc){
        if(err) return share.errpage( err.message, req, res ); 
        if(!doc) return share.errpage('您寻找的图片不存在或者已经下线', req, res );

        req.params.uuid = doc._id;

        if(!/^webview.*/.test(PAGE.view)){
            renderImg(req, res, {
                'v1' : 'imglitepage.html',
                'v2' : 'imglitepage_v2.html'
            });
        }else{
            renderImg(req, res, {
                'v1' : 'imgpage.html',
                'v2' : 'imgpage_v2.html',
            });
        }
    });
};

exports.feedbacklite = function(req, res){
    res.render('feedbacklitepage.html', {
        user: getUser(req),
        torist : share.getTourist(req),
        title: getTitle("意见反馈"),
        target : conf.target,
        stamp : conf.stamp,
        conf : conf,
        opt : {
            hide_search : true
        }
    });
};

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
        }, { skip : 0 , limit : 100});
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
        });
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
exports.outline_d3 = function(req, res){
    var arg = getParam("outline", req, res, [ PAGE.cond ]);
    if(!arg.passed)
        return;

    _outline(arg.cond, false, function(err, outline){
        if(err) return share.rt(false, err.message, res);

        //convert the outline to d3 fomart
        var arttree = outline.map( age => {
                        return {
                            name : age._id,
                            children : age.authors.map( author => {
                                return { 
                                    name : author.name, 
                                    size : author.paintings.length,
                                    paintings : author.paintings
                                }
                            })
                        };
                    });

        writejson(res, { "name": "中华珍宝馆", "children": arttree });
    });
}

// 返回作品列表
exports.outline = function(req, res){
    var arg = getParam("outline", req, res, [ PAGE.cond ]);
    if(!arg.passed)
        return;

    _outline(arg.cond, false, function(err, outline){
        if(err) return share.rt(false, err.message, res);

        writejson(res, outline);
    });
}

_outline = function(cond, withid, fn){
    // 查询outline
    cond = extend({ active : true }, cond );
    if(withid){
        paintdb.outline_with_id( cond , function(err, outline){
            fn(err, outline);
        });
    }else{
        paintdb.outline( cond , function(err, outline){
            fn(err, outline);
        });
    }
}

// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===
// 图片下载页面
exports.download = function(req, res){
    var arg = getParam("download", req, res, [ PAGE.uuid ]);
    if(!arg.passed)
        return;


    paintdb.findById(arg.uuid, function(err, info){
        if(err) return share.errpage( err.message, req, res );
        if(!info) return share.errpage('资料不存在', req, res );

        res.render('downloadpage.html', {
            user : getUser(req),
            torist : share.getTourist(req),
            title: getTitle("内容下载"),
            page : 'download',
            target : conf.target,
            stamp : conf.stamp,
            conf : conf,
            info : info,
            opt : {
                hide_search : true
            }
        });
    });
};

