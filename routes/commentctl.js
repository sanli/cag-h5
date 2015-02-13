//#!本文件由share.js自动产生于Sun Apr 20 2014 22:13:27 GMT+0800 (CST), 产生命令行为: node share.js gen paintings CRUD ..
/**
 * paintingsHTTP入口模块, 需要在主文件中添加map
 * var paintings = require('./routes/paintings');
 * app.all('/paintings/list', apiRestrict, paintings.list);
 * app.all('/paintings/count', apiRestrict, paintings.count);
 * app.all('/paintings/import', apiRestrict, paintings.import);
 * app.all('/paintings/retrive', apiRestrict, building.retrive);
 * app.all('/paintings/update', apiRestrict, gisobj.updateBuilding);
 * app.all('/paintings/delete', apiRestrict, building.delete);
 * app.all('/paintings/export', apiRestrict, building.export);
 */
var data = require('../data/commentdb.js')
    , getreq = require('../sharepage').getreq
    , getParam = require('../sharepage').getParam
    , rt = require('../sharepage').rt
    , _ResultByState = require('../sharepage')._ResultByState
    , _assertNotNull = require('../sharepage')._assertNotNull
    , exportToCSVFile = require('../sharepage').exportToCSVFile
    , searchCondExp = require('../sharepage').searchCondExp
    , inspect = require('util').inspect
    , ObjectID = require('mongodb').ObjectID
    , bindurl = require('../sharepage.js').bindurl
    , async = require('async')
    , conf = require('../config.js')
    , extend = require('node.extend');

//LIST用到的参数
var PAGE = {
    // 列表页条件,包括页的开始记录数skip，和页面长度limit 
    page : {name:'page', key:'page', optional: true, default: { skip: 0, limit: 50 }},
    // 查询条件
    cond : {name: 'cond', key: 'cond', optional: true, default: {} },
    // 排序条件
    sort : {name: 'sort', key: 'sort', optional: true, default: { _id : 1 } },
    // 类型
    type : {name: 'type', key: 'type', optional: false},
}
//CRUP参数
var CRUD = {
    data : { name: 'data', key: 'data', optional: false },
    _id : { name:'_id', key:'_id', optional: false },
    paintingId : { name:'paintingId', key:'paintingId', optional: false }
}


// 注册URL
exports.bindurl=function(app){
    bindurl(app, '/comment.html', { outType : 'page'}, exports.page);
    bindurl(app, '/comments.json', { needAuth : false }, exports.json);
    bindurl(app, '/comment.json', { needAuth : false }, exports.retrive);
    bindurl(app, '/comment/list', exports.list);
    bindurl(app, '/comment/create', { needAuth : false }, exports.create);
    bindurl(app, '/comment/retrive', { needAuth : false }, exports.retrive);
    bindurl(app, '/comment/update', { needAuth : false }, exports.update);
    bindurl(app, '/comment/delete', { needAuth : false }, exports.delete);
    bindurl(app, '/comment/count', { needAuth : false }, exports.count);
    bindurl(app, '/comment/jump', { method : 'get' }, exports.jump);

    // 赞和踩 API
    bindurl(app, '/comment/upVote', { needAuth : false }, exports.upVote);
    bindurl(app, '/comment/downVote', { needAuth : false }, exports.downVote);
}

exports.page = function(req, res){
    res.render('commentpage.html', {
        title: "赏析管理",
        target : conf.target,
        stamp : conf.stamp
    });
};


exports.json = function(req, res){
    var arg = getParam("json list", req, res, [CRUD.paintingId, PAGE.page, PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };

    searchCondExp(arg.cond);
    var cond = extend({}, arg.cond);
    cond.paintingId = arg.paintingId;
    // 没有被删除的标记
    cond.active = { $ne : false };
    
    data.list(cond, page, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.json(docs);    
    });
}

exports.create = function(req, res){
    var arg = getParam("create comments", req, res, [CRUD.paintingId, CRUD.data]);
    if(!arg.passed) return;

    data.addComment(arg.paintingId, arg.data, function(err, comment){
        if(err) return rt(false, err.message, res);

        res.setHeader("Access-Control-Allow-Origin", "*");
        rt(true, { comment : comment }, res);
    }); 
}   

exports.upVote = function(req, res){
    var arg = getParam("json list", req, res, [CRUD._id]);
    if(!arg.passed)
        return;

    data.incCommentVote(arg._id, 'upVote', function(err, comment){
        if(err) return rt(false, err.message, res);

        res.setHeader("Access-Control-Allow-Origin", "*");
        rt(true, { cnt : comment.upVote }, res);
    });
}

exports.downVote = function(req, res){
    var arg = getParam("json list", req, res, [CRUD._id]);
    if(!arg.passed)
        return;

    data.incCommentVote(arg._id, 'downVote', function(err, comment){
        if(err) return rt(false, err.message, res);

        res.setHeader("Access-Control-Allow-Origin", "*");
        rt(true, {cnt : comment.downVote }, res);
    });
}

// 查询对象，并返回列表
exports.list = function(req, res){
    var arg = getParam("comment list", req, res, [PAGE.page, PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };
    // 没有被删除的标记
    arg.cond.active = { $ne : false };

    searchCondExp(arg.cond);
    var cond = extend({}, arg.cond);
    data.list(arg.cond, page, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        rt(true, { docs: docs }, res);
    });
};


// 查询结果集的返回数量
exports.count = function(req, res){
    var arg = getParam("paintings count", req, res, [PAGE.cond, PAGE.type]);
    if(!arg.passed)
        return;

    // 没有被删除的标记
    arg.cond.active = { $ne : false };
    
    searchCondExp(arg.cond);
    data.count(arg.cond, function(err, count){
        if(err) return rt(false, err.message, res);
        
        rt(true, {count: count}, res);
    });
}

// 查询对象详细信息
exports.retrive = function(req, res){
    var arg = getParam("retrive paintings", req, res, [CRUD._id]);
    if(!arg.passed) return;

    data.findById(arg._id, function(err, doc){
        if(err) return rt(false, "查询出错:" + err.message, res);
        if(!doc) return rt(false, "找不到对象：" + _id);

        rt(true, { doc : doc }, res);
    });
}

// 删除对象
exports.delete = function(req, res){
    var arg = getParam("delete paintings", req, res, [CRUD._id]);
    if(!arg.passed) return;

    data.update( arg._id , { active : false } , function(err, comment){
        if(err) {
            console.log(err);
            return rt(false, "更新出错:" + err.message, res);
        }
        
        rt(true, {}, res);
    });
}

// 更新对象
exports.update = function(req, res){
    var arg = getParam("update paintings", req, res, [CRUD._id, CRUD.data]);
    if(!arg.passed) return;

    var updatedata = arg.data;
    delete updatedata._id;
    data.update( arg._id , updatedata , function(err, comment){
        if(err) {
            console.log(err);
            return rt(false, "更新出错:" + err.message, res);
        }
        
        rt(true, { comment : comment }, res);
    });
}

// 通过短连接跳转到页面
exports.jump = function(req, res){

}

// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===
