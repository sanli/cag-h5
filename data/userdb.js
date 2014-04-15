//user.js
var Collection = require('mongodb').Collection,
  Connection = require('mongodb').Connection,
  ObjectID = require('mongodb').ObjectID,
  debug = require('util').debug,
  inspect = require('util').inspect,
  db = require('../mongo.js').db,
  DBOP = require('../mongo.js').DBOP,
  Dept = require('./deptdb.js').Dept,
  mongoose = require('mongoose'),
  Schema = require('mongoose').Schema;

/**
 * 用户表Module
 * TODO: 目前用户表Module还没有正式使用，需要修改
 */
var data_painting = new Schema({
    _id : Schema.Types.ObjectId,
    dept: String,
    deptId : String,
    name: String,
    password: String,
    realname: String,
    role : String,
    tel: String,
},  { collection: 'sys_users' });
sys_users.index({id : 1})
    .index({pId : 1});
var Users = mongoose.model('sys_users', sys_users);
    exports.Users = Users;

/**
 * 验证用户登录信息，如果用户登录有效，返回用户对象
 * 如果无效，返回错误
 * @param fn  fn(err, user)
 */
exports.authorize = function(username, pass, fn){
	var userCol = new Collection(db, 'sys_users');
	userCol.findOne( { name: username } , function(err, user){
		if(err != null)
			throw err;

		if(user === null){
			fn(new Error('用户不存在')); return;
		}

		if(user.password === pass){
			Dept.findOne({id: user.deptId}, function(err, dept){
				if(err) console.trace(err);
				user.deptobj = dept;

				fn(err, user);
			})
		}else{
			fn(new Error('密码错误'));
		}
	});
};

exports.addUser = function(user, fn){
	db.collection('users',function(err, coll){	
		coll.find({name: user.name}).count(function(err, count){
			if(count > 0)
				throw new Error("用户名已经存在，请换其他的用户名");

			coll.insert(user, fn);
		});

	});
};

exports.delUser = function(username, fn){
	db.collection('sys_users', function(err, coll){
		coll.remove({name : username}, fn);
	});
};

exports.deleteUsers = function(users, fn){
	db.collection('sys_users', function(err, coll){
		coll.remove({ name : { $in : users }}
			,function(err, count){
			    if (err){
				   console.warn(err.message);
				   return;
			    }

				console.log('delete user success', count);
			   	fn(err, count);
		   });
	});
};


exports.updateUser = function(user, fn){
	db.collection('sys_users', function(err, coll){
		var username = user.name ; 
		//用户名不允许修改
		delete user.name ; 
		coll.update({name : username}, {$set: user} ,{multi:true, safe:true, upsert: true}, 
				   function(err, count, rs){
					   if (err)
						   console.warn(err.message);
					   else
						   console.log('更新用户成功, Count:%d', count);

					   fn(err);
				   });
	});
};

/**
 * 查询用户，参数包括：
 * @query 查询条件
 * @page 分页条件 eg: { start: index , length: 50}
 * @fn 回调 function(err, items, page)
 */
exports.queryUserPage = function(query, page, needCount, fn){
	var queryitem = query || {};
	db.collection('sys_users', function(err, coll){
		coll.find(queryitem).skip(page.start).limit(page.length).toArray(function(err,items){
			if(needCount){
				coll.find(queryitem).count(function(err,count){
					fn(err, items, count);
				});
			}else{
				fn(err, items);
			}
		});
	});
}

/**
 *    { name : v[0], 
 *		 role : v[1],    // 'admin' | 'user',
 *       pass : v[2],    // 密码
 *		 dept : v[3],    // '部门',
 *		 realname: v[4], // 姓名
 *		 tel: v[5],      //"联系电话",
 *	   };
 */
exports.importUser = function(users, lines, fn){
	var userCol = new Collection(db, 'sys_users');
	users.forEach(function(user){
		userCol.insert(user, function(err) {
			if(err)
				console.log('发生异常，导入用户：[%s] 出错:%s', user.name, err);

			console.log('导入用户：%s,成功',user.name);
		});
	});
};
