//user.js
var userdb = require('../data/userdb.js')
	, getreq = require('../sharepage').getreq
	, rt = require('../sharepage').rt
	, _ResultByState = require('../sharepage')._ResultByState;

USERPAGE = {
	pageStart : {name:'pageStart', key:'s', optional: true, default:0},
	pageLength : {name:'pageLength', key:'l', optional: true, default:50},
	searchKey : {name:'searchKey', key:'k', optional: true},
	deleteUsers : {name:'deleteUsers', key:'D', optional: false},
	user : {name: 'user', key:'user', optional: false}
}

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
	lowAdmin : '分公司网优项目管理员', 
	lowCheck : '分公司网优项目审核人',
	admin : '省公司网优项目管理员',
	topCheck : '省公司网优项目审核人'
}
var isLowAdmin = exports.isLowAdmin = _RoleChecker('lowAdmin');
var isLowCheck = exports.isLowCheck = _RoleChecker('lowCheck');
var isAdmin = exports.isAdmin = _RoleChecker('admin');
var isTopCheck = exports.isTopCheck = _RoleChecker('topCheck');
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
 * 验证用户登录
 */
function authenticate(name, pass, fn) {
  console.log('验证用户 %s:%s', name, pass);
  
  //TODO：查询数据库，得到用户的验证信息
  var user = users[name];
  if (!user) return fn(new Error('用户不存在！'));
  
  //TODO: 验证密码,肯能要做Hash
  if(pass === user.password)
	  fn(null, user)
  else
	  fn(new Error("密码错误！"));
}

var users = { 
    test : { username : 'test', password: 'test'},
    sanli: { username : 'sanli', password: 'pass'}
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
