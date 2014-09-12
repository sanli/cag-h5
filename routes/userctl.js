//user.js
var userdb = require('../data/userdb.js')
	, getreq = require('../sharepage').getreq
	, rt = require('../sharepage').rt
	, _ResultByState = require('../sharepage')._ResultByState
	, inspect = require('util').inspect
    , bindurl = require('../sharepage.js').bindurl
    , getTitle = require('../sharepage.js').getTitle
    , getUserName = require('../sharepage.js').getUserName
    , conf = require('../config.js');

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
}
//导入文件用到的参数
var IMP = {
    file : {name: 'file', key: 'file', optional: false},
}
//CRUP参数
var CRUD = {
    data : {name: 'data', key: 'data', optional: false},
    _id : {name:'_id', key:'_id', optional: false},
}

// 注册URL
exports.bindurl=function(app){
	// app
    bindurl(app, '/signin.html', { outType : 'page', needAuth : false }, exports.singinpage);
    bindurl(app, '/user/signin', exports.signin);
    bindurl(app, '/user/signout', exports.signout);

    // regular function
    // bindurl(app, '/user/list', exports.list);
    // bindurl(app, '/user/retrive', exports.retrive);
    // bindurl(app, '/user/update', exports.update);
    // bindurl(app, '/user/delete', exports.delete);
    // bindurl(app, '/user/count', exports.count);
    // bindurl(app, '/user/import', exports.import);
    // bindurl(app, '/user/export', exports.export);
}

exports.singinpage = function(req, res){
	console.log(req.body);

	if(req.body.email){
		//authByData(req.body.email, req.body.password, function(err, user){
		authenticate(req.body.email, req.body.password, function(err, user){
			if(user){
				req.session.user = user;
				res.redirect('/paintings.html');
			}else{
				res.render('signinpage.html', {
			    	user: getUserName(req),
			        title: getTitle("登录"),
			        page : 'signin',
			        target : conf.target,
			        stamp : conf.stamp,
			        err : "登录失败：" + err
			    });
			}
		});
	}else{
		res.render('signinpage.html', {
	    	user: getUserName(req),
	        title: getTitle("登录"),
	        page : 'signin',
	        target : conf.target,
	        stamp : conf.stamp,
	        err : ""
	    });
	}
};

exports.signout = function(req, res){
    req.session.destroy(function(){
		res.redirect("/");
    });
}

exports.signin = function(req, res){
	authByData(req.body.username, req.body.password, function(err, user){
		if(user){
			res.send(ok("登录成功"));
			req.session.user = user;
		}else{
			res.send(fail(err.message));
		}
	});
}

exports.getloginuser = function(req, res){
	var user = req.session.user;
	if(user){
		rt(true, { user: user }, res);
	}else{
		rt(false, "用户没有登录",res);
	}	
}

/**
 * 从Session中取得当前用户的部门编号，如果用户没有部门，返回null
 */
var getUserDeptId = function(req){
	var user = req.session.user;
	if(!user)
		return null;
	return user.deptobj ? user.deptobj.id : null; 
};
exports.getUserDeptId = getUserDeptId;
exports.getUser = function(req){
	return req.session.user;
}

//检查权限，如果不是管理员，需要给用户增加deptID作为查询条件
exports.fillUserDept = function(condition, req){
	if(!isAdmin(req)){
		var deptId = getUserDeptId(req);
		condition.deptId = deptId;
	}
};

var userRole = {
	author : '作者',
	audite : '编辑',
	admin : '系统管理员',
}
var isAuthor = exports.isLowAdmin = _RoleChecker('author');
var isAudite = exports.isLowCheck = _RoleChecker('audite');
var isAdmin = exports.isAdmin = _RoleChecker('admin');
function _RoleChecker(role){
	return function(req){
		var user = req.session.user ;
		if(user){
			return user.role === role ;
		}
		return false;
	}
}
function ok(msg){ return JSON.stringify({ S:true, M:msg }); }
function fail(msg){ return JSON.stringify({ S:false, M:msg }); }


/**
 * 使用数据库进行登录验证
 */
function authByData(name, pass, fn){
	userdb.authorize(name, pass, function(err, user){
		if(user != null){
			console.log("登录成功，用户姓名：%s", user.realname);
		}
		fn(err, user);
	});
}


/**
 * 使用固定密码，验证用户登录
 */
function authenticate(email, pass, fn) {
  console.log('验证用户 %s:%s', email, pass);
  
  //TODO：查询数据库，得到用户的验证信息
  var user = users[email];
  if (!user) return fn(new Error('用户不存在！'));
  
  //TODO: 验证密码,肯能要做Hash
  if(pass === user.password)
	  fn(null, user)
  else
	  fn(new Error("密码错误！"));
}

var users = { 
    'santal.li@gmail.com' : { email : 'santal.li@gmail.com',  username : 'admin', password: 'Learn@Art', role: 'admin' }
}


/**
 * 查询用户，条件包括：
 * p : page
 * q : query name
 * o : order by field
 * 返回内容:
 * user list  
 */
exports.list = function(req, res){
	try{
		var arg = getreq("list", req, res, [USERPAGE.pageStart, USERPAGE.pageLength, USERPAGE.searchKey]);
	}catch(err){
		console.log("getreq err:" + err.message);
		return rt(false, "getreq err:" + err.message, res);
	}

	var query = {};
	if(arg.searchKey){
		query.name = { $regex: '.*'+ arg.searchKey +'.*', $options: 'i'}
	};

	userdb.queryUserPage( query
		, {start: parseInt(arg.pageStart), length: parseInt(arg.pageLength) }
		, true
		, function(err, items, count){
			if(err){
				return rt(false, err.message, res);
			}
			
			rt(true, {items: items, count: count}, res);
		});
};


exports.create = function(req, res){
	var user = req.body;
	if(!_assertNotNull(user.name, res))
		return;

	userdb.addUser(user, _ResultByState(res));
};

exports.delete = function(req, res){
	try{
		var arg = getreq("delete", req, res, [USERPAGE.deleteUsers]);
	}catch(err){
		console.log("getreq err:" + err.message);
		return rt(false, "getreq err:" + err.message, res);
	}

	userdb.deleteUsers(arg.deleteUsers, function(err, count){
		if(err){
			return rt(false, err.message, res);
		}

		rt(true, {count: count}, res);
	});

};

exports.update = function(req, res){
	var user = req.body;
	if(!_assertNotNull(user.name, res))
		return;

	userdb.updateUser(user, _ResultByState(res));
};


function _assertNotNull(obj, res){
	if(!obj || obj === ""){
		rt(fale,"参数错误");
		return false;
	}
	return true;
}
