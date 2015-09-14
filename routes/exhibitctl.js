/**
 * 各类展馆
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
    , writejson = require('./cagcommonsctl.js').writejson;

exports.broadcast = "";

// ===============  定义模块入口文件 ================
exports.bindurl=function(app){
    // 分类馆，展示特定类型的藏品
    // 精选馆
    bindurl(app, '/exhibit/essence', { outType : 'page', needAuth : false }, exports.essence_exhibit);
    bindurl(app, '/api/essence', { needAuth : false }, exports.essence_json);
    // 历代馆
    bindurl(app, '/exhibit/age', { outType : 'page', needAuth : false }, exports.age_exhibit);
    bindurl(app, '/api/age', { needAuth : false }, exports.age_exhibit_json);

    bindurl(app, '/exhibit/age/:age/:author', { outType : 'page', needAuth : false }, exports.age_exhibit);
    bindurl(app, '/api/age/:age/:author', { needAuth : false }, exports.age_exhibit_json);
    // 近代馆
    bindurl(app, '/exhibit/modern', { outType : 'page', needAuth : false }, exports.morden_exhibit);
    bindurl(app, '/api/modern', { needAuth : false }, exports.morden_exhibit_json);
    // 最新发布
    bindurl(app, '/exhibit/recent', { outType : 'page', needAuth : false }, exports.recent_exhibit);
    bindurl(app, '/api/recent', { needAuth : false }, exports.recent_exhibit_json);
    // 铭心绝品
    bindurl(app, '/exhibit/mylove', { outType : 'page', needAuth : false }, exports.mylove_exhibit);
    bindurl(app, '/api/mylove', { needAuth : false }, exports.mylove_exhibit_json);
    // 铭心绝品
    bindurl(app, '/exhibit/search/:key', { outType : 'page', needAuth : false }, exports.search_exhibit);
    bindurl(app, '/api/search/:key', { needAuth : false }, exports.search_exhibit_json);
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
    // 作者名称
    key : {name: 'key', key: 'key', optional: true, default: '' }   
}


// 创建一个展览类别服务
// opt.param = [ PAGE.author, PAGE.age]
// opt.baseCond = { active : true , deleted : { $ne : true } }
// opt.sort = { author : 1 }
// opt.condPick = ['author', 'age']
// opt.title = "最近发布"
// opt.lable = function(){}
var _create_exhibit_page = function(opt){
    var opt = extend({
        page : { skip : 0 , limit : 50 },
        view : 'exhibit/exhibitpage.html'
    }, opt);

    return function(req, res){
        var arg = getParam("exhibit-" + opt.title, req, res, opt.param);
        if(!arg.passed)
            return;    

        _outline({}, true, function(err, outline){
            var argcond = us.pick(arg, opt.condPick);
            var cond = extend({}, argcond, opt.baseCond);

            if(opt.condfn)
                cond = opt.condfn(cond);
            
            paintdb.queryfile( cond
                , { files : false }
                , opt.sort
                , function(err, fileinfos){
                    if(err) return share.errpage(err.message, req, res);

                    res.setHeader('Cache-Control', 'public, max-age=3600');
                    res.render(opt.view, {
                        user : getUser(req),
                        torist : share.getTourist(req),
                        title: getTitle(opt.title),
                        page : 'main',
                        target : conf.target,
                        stamp : conf.stamp,
                        conf : conf,
                        outline : outline,
                        cagstore : fileinfos,
                        arg : arg,
                        opt : {
                            message : exports.broadcast_message,
                            hide_search : false
                        }
                    });
                }, opt.page);
        });
    }
};

var _create_exhibit_json = function(opt){
    var opt = extend(opt, {
        page : { skip : 0 , limit : 50 }
    });
    return function(req, res){
        var arg = getParam("exhibit-" + opt.title, req, res, opt.param);
        if(!arg.passed)
            return;    

            var argcond = us.pick(arg, opt.condPick);
            var cond = extend({}, argcond, opt.baseCond);

            if(opt.condfn)
                argcond = opt.condfn(argcond);

            paintdb.queryfile( cond
                , { files : false }
                , opt.sort
                , function(err, fileinfos){
                    if(err) return share.errpage(err.message, req, res);

                    writejson(res, fileinfos);
                }, opt.page);
    }
};

function _query_exhibit( opt, arg, fn ){
    var cond = arg.cond || {},
        page = arg.page || { skip : 0, limit : 100 },
        argcond = us.pick(arg, opt.condPick),
        cond = extend(cond , argcond, opt.baseCond);

    console.log(cond);
    paintdb.queryfile( cond
        , { files : false }
        , opt.sort
        , fn
        , page);
}
exports.query_exhibit = _query_exhibit;

var exhibits = {
    "精品馆" : {
        param : [],
        baseCond : { active : true , essence : true, deleted : { $ne : true } },
        sort : { essenceSort : -1, author : 1 },
        condPick : [],
        title : "精品馆",
        desc : "精选历代藏品中最完整和高清的资料，如果你只想欣赏最好的书画，请常来这里看看"
    },

    "历代馆" : {
        param : [ PAGE.author, PAGE.age],
        baseCond : { active : true , deleted : { $ne : true } },
        sort : { author : 1 },
        condPick : ['author', 'age'],
        title : "历代馆",
        desc : "收藏历代名家作品，按照历史年代排列，历代馆的目标是做到大而全面"
    },

    "当代馆" : {
        param : [ ],
        baseCond : { active : true , deleted : { $ne : true } , age : '当代'},
        sort : { author : 1 },
        condPick : ['author', 'age'],
        title : "当代馆",
        desc : "当代书画家呈现出与古人不同的面貌，评价交给历史，当代馆只为让你看到最真实的现代书画艺术"
    },

    "新发图": {
        param : [],
        baseCond : { active : true , deleted : { $ne : true } },
        sort : { activeSort : -1 },
        // 最近发布的图片
        page : { skip : 0, limit : 50 },
        condPick : [],
        title : "新发图",
        desc : "按照内容更新或者是发布的时间，由近到远列出馆藏书画，方便您了解馆内的最新动态"
    },

    "铭心绝品": {
        param : [],
        baseCond : { active : true , mylove : true, deleted : { $ne : true } },
        sort : { myloveSort : -1 },
        // 最近发布的图片
        page : { skip : 0, limit : 50 },
        condPick : [],
        title : "铭心绝品",
        desc : "铭心绝品馆挑选原则，宁缺勿滥，首先要高清的，第二首尾全的，第三真假争议少的，第四艺术历史价值高的，如此方可谓之铭心绝品。"
    },

    "搜索" : {
        param : [ PAGE.key ],
        view : 'exhibit/searchpage.html',
        baseCond : { active : true, deleted : { $ne : true } },
        sort : { myloveSort : -1 },
        // 在查询之前处理cond
        condfn : function(cond){
            var key = cond.key,
                regKey = new RegExp(key),
                cond = { 
                    active : true ,
                    deleted : { $ne : true } ,
                    $or :[ { author : regKey } , { paintingName :  regKey } ] 
                };
            return cond;
        },
        // 最近发布的图片
        page : { skip : 0, limit : 50 },
        condPick : ['key'],
        title : "搜索",
        desc : "搜索作品名称"
    }
};
exports.meta = exhibits;

// 各个模块页面
exports.essence_exhibit = _create_exhibit_page(exhibits.精品馆);
exports.age_exhibit = _create_exhibit_page(exhibits.历代馆);
exports.morden_exhibit = _create_exhibit_page(exhibits.当代馆);
exports.recent_exhibit = _create_exhibit_page(exhibits.新发图);
exports.mylove_exhibit = _create_exhibit_page(exhibits.铭心绝品);
exports.search_exhibit = _create_exhibit_page(exhibits.搜索);

// 各个模块的JSON API
exports.essence_json = _create_exhibit_json(exhibits.精品馆);
exports.age_exhibit_json = _create_exhibit_json(exhibits.历代馆);
exports.morden_exhibit_json = _create_exhibit_json(exhibits.当代馆);
exports.recent_exhibit_json = _create_exhibit_json(exhibits.新发图);
exports.mylove_exhibit_json = _create_exhibit_json(exhibits.铭心绝品);
exports.search_exhibit_json = _create_exhibit_json(exhibits.搜索);


