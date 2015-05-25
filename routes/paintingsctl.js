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
var paintingsdb = require('../data/paintingsdb.js')
    , share = require('../sharepage')
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
    , conf = require('../config.js');

//LIST用到的参数
var PAGE = {
    // 列表页条件,包括页的开始记录数skip，和页面长度limit 
    page : {name:'page', key:'page', optional: true, default: { skip: 0, limit: 50 }},
    // 查询条件
    cond : {name: 'cond', key: 'cond', optional: true, default: {} },
    // 排序条件
    sort : {name: 'sort', key: 'sort', optional: true, default: { _id : -1 } },
    // 类型
    type : {name: 'type', key: 'type', optional: false},
}
//导入文件用到的参数
var IMP = {
    file : {name: 'file', key: 'file', optional: false},
    idlist :{name:'idlist', key: 'idlist', optional: false}
}
//CRUP参数
var CRUD = {
    data : {name: 'data', key: 'data', optional: false},
    _id : {name:'_id', key:'_id', optional: false}
}


// 注册URL
exports.bindurl=function(app){
    bindurl(app, '/paintings.html', { outType : 'page'}, exports.page);
    bindurl(app, '/paintings/list', exports.list);
    bindurl(app, '/paintings/retrive', exports.retrive);
    bindurl(app, '/paintings/update', exports.update);
    bindurl(app, '/paintings/delete', exports.delete);
    bindurl(app, '/paintings/count', exports.count);
    bindurl(app, '/paintings/import', exports.import);
    //bindurl(app, '/paintings/_activeall', exports.activeall);
    bindurl(app, '/paintings/jump', { method : 'get' }, exports.jump);
    bindurl(app, '/paintings/export', exports.export);
}

exports.page = function(req, res){
    console.log(share.getUser(req));
    res.render('paintingspage.html', {
        title: "内容管理",
        conf : require('../config.js'),
        target : conf.target,
        stamp : conf.stamp,
        user : share.getUser(req),
        commons : require('./commonsctl.js')
    });
};

// 一个私有API，用于一次激活所有的paintings
// exports.activeall = function(req, res){
//     paintingsdb.PaintingView.update(
//         {}
//         , { $set: { active : true } }
//         , {multi: true}
//         , function(err, cnt){
//             if(err) return rt(false, err.message, res);

//             rt(true, {msg: "激活成功", cnt: cnt}, res);
//         });
// }

// 查询对象，并返回列表
exports.list = function(req, res){
    var arg = getParam("paintings list", req, res, [PAGE.page, PAGE.cond, PAGE.sort, PAGE.type]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };

    searchCondExp(arg.cond);
    // 查询条件完全由前台页面控制
    //arg.cond.deleted = { $ne : true };
    paintingsdb.list(arg.type, arg.cond, page, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        rt(true, {docs: docs}, res);
    });
};


// 查询结果集的返回数量
exports.count = function(req, res){
    var arg = getParam("paintings count", req, res, [PAGE.cond, PAGE.type]);
    if(!arg.passed)
        return;

    searchCondExp(arg.cond);
    // 查询条件移动到前台
    //arg.cond.deleted = { $ne : true };
    paintingsdb.count(arg.type, arg.cond, function(err, count){
        if(err) return rt(false, err.message, res);
        
        rt(true, {count: count}, res);
    });
}

// 查询对象详细信息
exports.retrive = function(req, res){
    var arg = getParam("retrive paintings", req, res, [CRUD._id]);
    if(!arg.passed) return;

    paintingsdb.findById( arg._id 
        , function(err, doc){
            if(err) return rt(false, "查询出错:" + err.message, res);
            if(!doc) return rt(false, "找不到对象：" + _id);

            rt(true, { doc : doc }, res);
        });
}

// 删除对象
exports.delete = function(req, res){
    var arg = getParam("delete paintings", req, res, [CRUD._id, CRUD.data]);
    if(!arg.passed) return;

    var data = arg.data;
    data.deleted = true;
    data.active =  false;
    paintingsdb.delete(arg._id , data, function(err, doc){
        if(err) return rt(false, "删除出错:" + err.message, res);
        
        rt(true, { doc : doc }, res);
    });
}

// 更新对象
exports.update = function(req, res){
    var arg = getParam("update paintings", req, res, [CRUD._id, CRUD.data]);
    if(!arg.passed) return;

    console.log(arg._id);

    var data = arg.data;
    delete data._id;
    paintingsdb.update( arg._id , data , function(err, cnt){
        if(err) {
            console.log(err);
            return rt(false, "更新出错:" + err.message, res);
        }
        
        rt(true, { cnt : cnt }, res);
    });
}

// 通过短连接跳转到页面
exports.jump = function(req, res){

}

// 导出所有数据到客户端
exports.export = function(req, res){
    var arg = getParam("paintings export", req, res, []);
    if(!arg.passed)
        return;

    searchCondExp(arg.cond);
    paintingsdb.query(null, {}, { _id : 1 }, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        var exports = docs.map(function(doc){ return doc.toObject(); })
        res.json(exports);
    });
};

//确认导入
var http = require('http')
exports.import = function(req, res){
    var arg = getParam("import paintings file", req, res, [IMP.idlist]);
    if(!arg.passed)
        return;
    
    var cnt = 0, errcnt = 0;
    async.eachSeries(arg.idlist, function(id, callback){
        var options = {
          hostname: 'cag.share-net.cn' ,
          port: 80,
          path: '/cagstore/' + id + '/meta.json',
          headers : {
            'Referer' : 'http://ltfc.net/paintings.html',
            'User-Agent' : 'LTFCImporter'
          }
        };
        console.log("get info http://%s/%s", options.hostname, options.path);
        http.get(options, function(res) {
            console.log("Got response: " + res.statusCode);
            var dataarray = [];
            res.on('data', function (chunk) {
                dataarray.push(chunk.toString());
            }).on('end', function(){
                var json = dataarray.join('');
                console.log('BODY: ' + json);

                var obj = JSON.parse(json);
                delete obj._id;
                // 设置缺省访问次数为0
                obj.viewCnt = 0; 
                paintingsdb.update(id, obj, function(err){
                    if(err) {
                        console.log("[WRAN]" + err.message);
                    }else{
                        console.log("更新成功:" + id);
                    }

                    cnt ++ ;
                    callback();
                });
            });
        }).on('error', function(e) {
          console.log("Got error: " + e.message);
          errcnt ++ ;
          callback(e);
        });
    }, function(err){
        if(err) return rt(false, "导入出错:" + err.message, res);
        
        rt(true, { count : cnt , errCount : errcnt }, res);
    });
    
};



// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===

