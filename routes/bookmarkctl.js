//#!本文件由share.js自动产生于Thu May 07 2015 12:12:08 GMT+0800 (CST), 产生命令行为: node share.js gen bookmark CRUD ..
/**
 * bookmarkHTTP入口模块, 需要在主文件中添加map
 * var bookmark = require('./routes/bookmark').bindurl(app);
 */
var bookmarkdb = require('../data/bookmarkdb.js')
    // base function
    , share = require('../sharepage')
    , express = require('express')
    , path = require('path')
    , conf = require('../config.js')
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
    // dlg file
    dlgfile : {name: 'dlgfile', key: 'dlgfile', optional: false}
};
//导入文件用到的参数
var IMP = {
    file : {name: 'file', key: 'file', optional: false},
};
//CRUD参数
var CRUD = {
    data : {name: 'data', key: 'data', optional: false},
    _id : {name:'_id', key:'_id', optional: false},
};

//建立标签
var PIN = {
    title : {name: 'title', key: 'title', optional: false},
    paintingid : {name: 'paintingid', key: 'paintingid', optional: false},
    area : {name: 'area', key: 'area', optional: true},
    comment : {name: 'comment', key: 'comment', optional: true},
}

// 注册URL
exports.bindurl=function(app){
    //动态文件
    share.bindurl(app, '/bookmark.html', { outType : 'page'}, exports.page);
    share.bindurl(app, '/bookmark/create', exports.create);
    share.bindurl(app, '/bookmark/update', exports.update);
    share.bindurl(app, '/bookmark/list', exports.list);
    share.bindurl(app, '/bookmark/retrive', exports.retrive);
    share.bindurl(app, '/bookmark/retriveByCond', exports.retriveByCond);
    share.bindurl(app, '/bookmark/delete', exports.delete);
    share.bindurl(app, '/bookmark/count', exports.count);
    share.bindurl(app, '/bookmark/import', exports.import);
    share.bindurl(app, '/bookmark/templ', exports.templ);
    share.bindurl(app, '/bookmark/export', exports.export);
    share.bindurl(app, '/bookmark/dlg/:dlgfile', { outType : 'page'}, exports.dlg);
    //TODO: 扩展的API加在下面
    share.bindurl(app, '/bookmark/pin', { authRule : 'tourist' }, exports.pin);
    share.bindurl(app, '/bookmark/tlist', { authRule : 'tourist' }, exports.tlist);
    share.bindurl(app, '/bookmark/tcount', { authRule : 'tourist' }, exports.tcount);
    share.bindurl(app, '/bookmark/tdelete', { authRule : 'tourist' }, exports.delete);
}


// GUI页面
exports.page = function(req, res){
    res.render('bookmark/bookmarkpage.html', {
        conf : conf,
        target : conf.target,
        stamp : conf.stamp,
        title: share.getTitle("书签"),
        user : req.session.user,
        commons : require('./commonsctl.js')
    });
};

// 更新对象
exports.create = function(req, res){
    var arg = share.getParam("创建新bookmark对象:", req, res, [CRUD.data]);
    if(!arg.passed)
       return;

    bookmarkdb.create(arg.data, function(err, newDoc){
        if(err) return share.rt(false, "创建新bookmark对象出错:" + err.message, res);

        share.rt(true, { _id: newDoc._id }, res);
    });
}

// 更新对象
exports.update = function(req, res){
    var arg = share.getParam("更新bookmark对象", req, res, [CRUD._id, CRUD.data]);
    if(!arg.passed) return;

    console.log(arg._id);

    var data = arg.data;
    delete data._id;
    bookmarkdb.update( arg._id , data , function(err, cnt){
        if(err) {
            console.log(err);
            return share.rt(false, "更新bookmark出错:" + err.message, res);
        }
        
        share.rt(true, { cnt : cnt }, res);
    });
}


// 查询对象，并返回列表
function _createList(filterfn){
    return function(req, res){
        var arg = share.getParam("查询bookmark列表", req, res, [PAGE.page, PAGE.cond, PAGE.sort]);
        if(!arg.passed)
            return;

        var page = {
            skip : parseInt(arg.page.skip),
            limit : parseInt(arg.page.limit),
        };

        share.searchCondExp(arg.cond);
        console.log(arg.cond);
        
        filterfn(arg.cond, req);
        bookmarkdb.list(arg.cond, arg.sort, page, function(err, docs){
            if(err) return share.rt(false, err.message, res);
            
            share.rt(true, {docs: docs}, res);
        });
    };
}

function filterByTourist(cond, req){
    var tourist = share.getTourist(req);
    if(!tourist.userid) share.rt(false, "无效用户:" + err.message, res);

    share.fillUserDataRule(cond, req);
    cond.userid = tourist.userid;
    return cond;
}

function _createCount(filterfn){
    return function(req, res){
        var arg = share.getParam("bookmark count", req, res, [PAGE.cond]);
        if(!arg.passed)
            return;

        share.searchCondExp(arg.cond);
        filterfn(arg.cond, req);
        bookmarkdb.count(arg.cond, function(err, count){
            if(err) return share.rt(false, err.message, res);
            
            share.rt(true, {count: count}, res);
        });
    }
};
// 管理员查询
exports.list = _createList(share.fillUserDataRule);
// 游客查询
exports.tlist = _createList(filterByTourist);
// 查询结果集的返回数量
exports.count = _createCount(share.fillUserDataRule);
// 游客查询
exports.tcount = _createCount(filterByTourist);

// 查询对象详细信息
exports.retrive = function(req, res){
    var arg = share.getParam("retrive bookmark", req, res, [CRUD._id]);
    if(!arg.passed) return;

    bookmarkdb.findById(arg._id, function(err, doc){
        if(err) return share.rt(false, "查询bookmark出错:" + err.message, res);
        if(!doc) return share.rt(false, "找不到对象：" + _id);

        share.rt(true, { doc : doc }, res);
    });
}

// 按照条件查询站点数据
exports.retriveByCond = function(req, res){ 
    var arg = share.getParam("retrive bookmark", req, res, [PAGE.cond]);
    if(!arg.passed) return;

    bookmarkdb.findByCond(arg.cond, function(err, doc){
        if(err) return share.rt(false, "查询bookmark出错:" + err.message, res);
        
        share.rt(true, { doc : doc }, res);
    });    
}

// 删除对象
exports.delete = function(req, res){
    var arg = share.getParam("delete bookmark", req, res, [CRUD._id]);
    if(!arg.passed) return;

    bookmarkdb.delete(arg._id , function(err, doc){
        if(err) return share.rt(false, "删除bookmark出错:" + err.message, res);
        
        share.rt(true, { doc : doc }, res);
    });
}

// 短链跳转，通过特定ID跳转到某个页面，大部分情况下不用实现
exports.jump = function(req, res){
    //TODO: 加入短链跳转
}

//确认导入CSV格式的数据
exports.import = function(req, res){
    var arg = share.getParam("import bookmark file", req, res, [IMP.file]);
    if(!arg.passed)
        return;
    var file = upload.settings.uploadpath + '/' + arg.file ,
        type = arg.type;

    bookmarkdb.importCSV(file, type, function(err, cnt){
        if(err) return share.rt(false, "导入bookmark文件出错:" + err.message, res);

        share.rt(true, { count: cnt }, res);
    })
};

exports.templ = function(req, res){
    var filename = encodeURI('书签导入表模版.csv');
    res.attachment(filename);
    res.send(bookmarkdb.cvsfield.join(','));
    res.send(require('iconv-lite').encode( bookmarkdb.cvsfield.join(','), 'gbk' ));
}

exports.export = function(req, res){
    var arg = share.getParam("bookmark list", req, res, [PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    share.searchCondExp(arg.cond);
    share.fillUserDataRule(arg.cond, req);
    bookmarkdb.query(arg.cond, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        var filename = "bookmark_export_"  + new Date().getTime() + ".csv";
        var exporter = bookmarkdb.createExporter();
        share.exportToCSVFile(docs, filename, exporter, function(err){
            if(err)
                return share.rt(false, "导出文件错误:" + err , res);

            return share.rt(true, {file: filename, fname: "书签数据_"
                    + new Date().toISOString().replace(/T.*Z/,'') +".csv"}, res);
        });
    });
};

// 返回对话框内容
exports.dlg = function(req, res){
    var arg = share.getParam("输出对话框:", req, res, [PAGE.dlgfile]);
    if(!arg.passed)
       return;

    res.render( 'bookmark/' + arg.dlgfile, {
        user : req.session.user,
        commons : require('./commonsctl.js')
    });
};


// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===
// 订住一张图，创建书签
exports.pin = function(req, res){
    var arg = share.getParam("delete bookmark", req, res, [PIN.title, PIN.paintingid, PIN.area, PIN.comment]);
    if(!arg.passed) return;

    var tourist = share.getTourist(req);
    var data = {
        userid : tourist.userid,
        title : arg.title,
        createTime : new Date(),
        mark : {
            paintingid : arg.paintingid,
            area : arg.area
        }
    }
    bookmarkdb.create(data, function(err, doc){
        if(err) return share.rt(false, "删除bookmark出错:" + err.message, res);
        
        share.rt(true, { doc : doc }, res);
    });
}






