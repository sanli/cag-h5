//#!本文件由share.js自动产生于Wed Apr 15 2015 15:56:21 GMT+0800 (CST), 产生命令行为: node share.js gen tourist CRUD ..
/**
 * touristHTTP入口模块, 需要在主文件中添加map
 * var tourist = require('./routes/tourist').bindurl(app);
 */
var touristdb = require('../data/touristdb.js')
    , share = require('../sharepage.js')
    , logger = require('../logger.js')
    , express = require('express')
    , path = require('path')
    , sf = require('../config.js')
    , inspect = require('util').inspect
    , us = require('underscore')
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
}
//导入文件用到的参数
var IMP = {
    file : {name: 'file', key: 'file', optional: false},
}
//CRUD参数
var CRUD = {
    data : {name: 'data', key: 'data', optional: false},
    _id : {name:'_id', key:'_id', optional: false},
    username : {name: 'username', key: 'username', optional: false},
    password : {name: 'password', key: 'password', optional: false}
}


// 注册URL
exports.bindurl=function(app){
    //动态文件
    share.bindurl(app, '/tourist.html', { outType : 'page'}, exports.page);
    share.bindurl(app, '/tourist/create', { needAuth : false }, exports.create);
    share.bindurl(app, '/tourist/update', exports.update);
    share.bindurl(app, '/tourist/list', exports.list);
    share.bindurl(app, '/tourist/retrive', exports.retrive);
    share.bindurl(app, '/tourist/retriveByCond', exports.retriveByCond);
    share.bindurl(app, '/tourist/delete', exports.delete);
    share.bindurl(app, '/tourist/count', exports.count);
    share.bindurl(app, '/tourist/import', exports.import);
    share.bindurl(app, '/tourist/templ', exports.templ);
    share.bindurl(app, '/tourist/export', exports.export);
    share.bindurl(app, '/tourist/dlg/:dlgfile', { outType : 'page'}, exports.dlg);

    //TODO: 扩展的API加在下面
    share.bindurl(app, '/whoami', { needAuth : false }, exports.whoami);
    share.bindurl(app, '/dslogin', { needAuth : false }, exports.dslogin);
    share.bindurl(app, '/tourist/exists', { needAuth : false }, exports.exists);
    // 用户信息
    share.bindurl(app, '/tourist/login', { needAuth : false }, exports.login);
    share.bindurl(app, '/tourist/logout', { needAuth : false }, exports.logout);
    share.bindurl(app, '/myinfo.html', { authRule : 'tourist', outType : 'page' }, exports.userinfo);
    share.bindurl(app, '/mybookmark.html', { authRule : 'tourist', outType : 'page' }, exports.mybookmark);
    share.bindurl(app, '/tourist/regist.html', { needAuth : false }, exports.regist);
    share.bindurl(app, '/tourist/tretrive', { authRule : 'tourist'}, exports.retrive);
    share.bindurl(app, '/tourist/tupdate', { authRule : 'tourist'}, exports.update);
    share.bindurl(app, '/art_is_fun', { needAuth : false }, exports.art_is_fun);

}

// GUI页面
exports.page = function(req, res){
    res.render('tourist/touristpage.html', {
        conf : require('../config.js'),
        target : conf.target,
        stamp : conf.stamp,
        title: '访客',
        user : share.getUser(req),
        commons : require('./cagcommonsctl.js'),
        opt : {
            hide_search : true
        }
    });
};

// GUI页面
exports.regist = function(req, res){
    res.render('tourist/registpage.html', {
        conf : require('../config.js'),
        target : conf.target,
        stamp : conf.stamp,
        title: '访客',
        torist : share.getTourist(req),
        commons : require('./cagcommonsctl.js'),
        opt : {
            hide_search : true
        }
    });
};

// 用户信息浏览
exports.userinfo = function(req, res){
    res.render('tourist/userinfopage.html', {
        conf : require('../config.js'),
        target : conf.target,
        stamp : conf.stamp,
        title: '我的信息',
        torist : share.getTourist(req),
        commons : commons,
        opt : {
            hide_search : true
        }
    });
};

// GUI页面
exports.mybookmark = function(req, res){
    res.render('tourist/mybookmarkpage.html', {
        conf : require('../config.js'),
        target : conf.target,
        stamp : conf.stamp,
        title: '我的收藏',
        torist : share.getTourist(req),
        commons : commons,
        opt : {
            hide_search : true
        }
    });
};

// 更新对象
exports.create = function(req, res){
    var arg = share.getParam("注册用户出错，因为:", req, res, [CRUD.data]);
    if(!arg.passed)
       return;

    touristdb.create(arg.data, function(err, newDoc){
        if(err) return share.rt(false, "注册用户出错，因为:" + err.message, res);

        req.session.tourist = newDoc.toObject();
        share.rt(true, { user: newDoc }, res);
    });
}

// 更新对象
exports.update = function(req, res){
    var arg = share.getParam("更新tourist对象", req, res, [CRUD._id, CRUD.data]);
    if(!arg.passed) return;

    console.log(arg._id);

    var data = arg.data;
    delete data._id;
    touristdb.update( arg._id , data , function(err, cnt){
        if(err) {
            console.log(err);
            return share.rt(false, "更新tourist出错:" + err.message, res);
        }
        
        share.rt(true, { cnt : cnt }, res);
    });
}


// 查询对象，并返回列表
exports.list = function(req, res){
    var arg = share.getParam("查询tourist列表", req, res, [PAGE.page, PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };

    share.searchCondExp(arg.cond);
    console.log(arg.cond);
    
    share.fillUserDataRule(arg.cond, req);
    touristdb.list(arg.cond, arg.sort, page, function(err, docs){
        if(err) return share.rt(false, err.message, res);
        
        share.rt(true, {docs: docs}, res);
    });
};

// 查询结果集的返回数量
exports.count = function(req, res){
    var arg = share.getParam("tourist count", req, res, [PAGE.cond]);
    if(!arg.passed)
        return;

    share.searchCondExp(arg.cond);
    share.fillUserDataRule(arg.cond, req);
    touristdb.count(arg.cond, function(err, count){
        if(err) return share.rt(false, err.message, res);
        
        share.rt(true, {count: count}, res);
    });
}

// 查询对象详细信息
exports.retrive = function(req, res){
    var arg = share.getParam("retrive tourist", req, res, [CRUD._id]);
    if(!arg.passed) return;

    touristdb.findById(arg._id, function(err, doc){
        if(err) return share.rt(false, "查询tourist出错:" + err.message, res);
        if(!doc) return share.rt(false, "找不到对象：" + _id);

        share.rt(true, { doc : doc }, res);
    });
}

// 按照条件查询站点数据
exports.retriveByCond = function(req, res){ 
    var arg = share.getParam("retrive tourist", req, res, [PAGE.cond]);
    if(!arg.passed) return;

    touristdb.findByCond(arg.cond, function(err, doc){
        if(err) return share.rt(false, "查询tourist出错:" + err.message, res);
        
        share.rt(true, { doc : doc }, res);
    });    
}

// 删除对象
exports.delete = function(req, res){
    var arg = share.getParam("delete tourist", req, res, [CRUD._id]);
    if(!arg.passed) return;

    touristdb.delete(arg._id , function(err, doc){
        if(err) return share.rt(false, "删除tourist出错:" + err.message, res);
        
        share.rt(true, { doc : doc }, res);
    });
}

// 短链跳转，通过特定ID跳转到某个页面，大部分情况下不用实现
exports.jump = function(req, res){
    //TODO: 加入短链跳转
}

//确认导入CSV格式的数据
exports.import = function(req, res){
    var arg = share.getParam("import tourist file", req, res, [IMP.file]);
    if(!arg.passed)
        return;
    var file = upload.settings.uploadpath + '/' + arg.file ,
        type = arg.type;

    touristdb.importCSV(file, type, function(err, cnt){
        if(err) return share.rt(false, "导入tourist文件出错:" + err.message, res);

        share.rt(true, { count: cnt }, res);
    })
};

exports.templ = function(req, res){
    var filename = encodeURI('访客信息导入表模版.csv');
    res.attachment(filename);
    res.send(touristdb.cvsfield.join(','));
    res.send(require('iconv-lite').encode( touristdb.cvsfield.join(','), 'gbk' ));
}

exports.export = function(req, res){
    var arg = share.getParam("tourist list", req, res, [PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    share.searchCondExp(arg.cond);
    share.fillUserDataRule(arg.cond, req);
    touristdb.query(arg.cond, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        var filename = "tourist_export_"  + new Date().getTime() + ".csv";
        var exporter = touristdb.createExporter();
        share.exportToCSVFile(docs, filename, exporter, function(err){
            if(err)
                return share.rt(false, "导出文件错误:" + err , res);

            return share.rt(true, {file: filename, fname: "访客信息数据_"
                    + new Date().toISOString().replace(/T.*Z/,'') +".csv"}, res);
        });
    });
};

// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===

// 返回对话框内容
exports.dlg = function(req, res){
    var arg = share.getParam("输出对话框:", req, res, [PAGE.dlgfile]);
    if(!arg.passed)
       return;

    res.render( 'tourist/' + arg.dlgfile, {
        user : share.getUser(req),
        commons : require('./cagcommonsctl.js'),
        opt : {
         
        }
    });
};

// 用户登录
exports.login = function(req, res){
    var arg = share.getParam("用户登录:", req, res, [CRUD.data]);
    if(!arg.passed)
       return;

    var data = arg.data;
    if(!data.userid || !data.password) 
        return share.rt(false, "用户信息错误" , res);

    touristdb.getUserInfo(data.userid, function(err, userinfo){
        if(err){
            logger.error(err);
            return share.rt(false, "验证错误" , res);
        }

        if(!userinfo) 
            return share.rt(false, "登录错误，用户名不存在" , res);
        if(userinfo.password !== data.password)
            return share.rt(false, "登录错误，密码不正确" , res);

        console.log("the tourist object:", userinfo);
        req.session.tourist = userinfo;
        delete userinfo.password;

        share.rt(true, { userinfo: userinfo }, res); 
    });
}

exports.setAutologinCookie

// 创建用户令牌，记录到用户端的cookie中，避免重复登录
function _genToken(userinfo){
    return userinfo._id;
}


// 检查用户是否已经存在，如果不存在返回一个建议
exports.exists = function(req, res){

}

// 返回当前用户基本信息
exports.whoami = function(req, res){
    var tourist = req.session.tourist ? us.omit(req.session.tourist, 'password') : null ,
        user = req.session.user ? us.omit(req.session.user, 'password') : null;
    share.rt(true, { 
        tourist : tourist,
        user : user
    }, res);
}

/*
 * TOOD: 用户注册如果登录他的多说帐户，会被多说重定到这个URL，我们在这个URL中
 * 记录用户的其他信息，例如QQ号和微博账户等。
 */
var querystring = require('querystring'),
    http = require('http'),
    commons = require('./cagcommonsctl.js');
exports.dslogin = function(req, res){
    var dscode = req.query['code'];
    logger.debug('dscode:' + dscode);

    function _render_login_page(err, userinfo){
        res.render('tourist/userinfopage.html', {
            conf : require('../config.js'),
            target : conf.target,
            stamp : conf.stamp,
            title: '用户登录',
            user : userinfo,
            err : err,
            commons : commons,
            opt : {
                hide_search : true
            }
        });
    }

    _getAccessToken(dscode, function(err, access_token){
        if(err){
            logger.error('getAccessToken Error', err);
            return _render_login_page(err, null);
        }

        Module.findByCond({ dsid : access_token.user_id },function(err, doc){
            if(err) return commons.errpage(err, req, res);

            // 如果已经存在，建立session，并重定向到登录页
            if(doc){
                // 可能不是所有信息都需要保存到Session
                res.session.user = doc;
                // 保存cookie，有效期一个月
                res.cookie('ltfcti', doc._id, { maxAge: 30 * 93600000 });
                // 显示用户信息
                return _render_login_page(null, doc);
            }else{
                // 如果不存在，需要从多说拉取用户信息，并保存到数据库
                logger.debug('user not exist, will pull from duoshuo');
                _getDsUser(access_token.user_id, function(err, userinfo){
                    if(err) return commons.errpage(err, req, res);

                    var userdata = us.pick(userinfo, 'name', 'url', 'avatar_url');
                    userdata.userid = '社交媒体用户_' + userinfo.user_id;
                    Module.create(userdata, function(err, newuser){
                        var user = newuser.toObject();
                        req.session.user = user;
                        // 保存cookie，有效期一个月
                        res.cookie('ltfcti', user._id, { maxAge: 30 * 93600000 });
                        // 显示用户信息
                        return _render_login_page(null, user);
                    });
                }); 
            }
        })
    });
}

// 根据dscode去的token
function _getAccessToken(code, fn){
    var postData = querystring.stringify({
        'code' : code,
        'client_id' : 'ltfc',
        'client_secret' : '30684738258f65e5b7eb799ff8bea180'
    });
    var options = {
      hostname: 'api.duoshuo.com',
      port: 80,
      path: '/oauth2/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };
    var req = http.request(options, function(dsres) {
        // 读取多说信息成功，创建用户，并填充缺省信息
        var dataarray = [];
        dsres.on('data', function (chunk) {
            dataarray.push(chunk.toString());
        }).on('end', function(){
            var json = dataarray.join('');
            //res.send(JSON.stringify(json));
            if(json.code != 0){
                return fn(new Error('return error with message:' + json.errorMessage), json);
            }else{
                fn(null, json);    
            }
        });
    }).on('error', function(e) {
        logger.debug('problem with get token request: ' + e.message);
        fn(new Error('problem with request: ' + e.message));
    });
    // write data to request body
    req.write(postData);
    req.end();
}

// 取得用户信息
function _getDsUser(userid, fn){
    var req = http.get("http://api.duoshuo.com/users/profile.json?user_id=" + usersid, function(dsres) {
        // 读取多说信息成功，创建用户，并填充缺省信息
        var dataarray = [];
        dsres.on('data', function (chunk) {
            dataarray.push(chunk.toString());
        }).on('end', function(){
            var json = dataarray.join('');
            if(json.code != 0){
                return fn(new Error('return error with message:' + json.errorMessage), json);
            }else{
                fn(null, json);    
            }
        });
    }).on('error', function(e) {
        logger.debug('problem with user profile request: ' + e.message);
        fn(new Error('problem with user profile request: ' + e.message));
    });
}

// 用户登出，销毁session
exports.logout = function(req, res){
    req.session.destroy(function(){
        res.redirect("/");
    });
}

// 艺术总是有点意外，有点好玩
var artfun = require('../data/art_is_fun.js');
exports.art_is_fun = function(req, res){
    res.send(artfun.get_a_fun());
}