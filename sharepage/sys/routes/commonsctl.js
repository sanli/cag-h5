// commons.js

var share = require('../../../sharepage.js'),
    inspect = require('util').inspect;

var PAGE = {
	seqname : { name: 'seqname', key: 'seqname', optional: false},
    //导出文件名
    file : {name: 'file', key: 'file', optional: false},
    //下载后的文件名
    fname : {name: 'fname', key: 'fname', optional: false}
}

function idstr(seq, length){
	var r = seq.toString();
    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}

//下载导出后的文件
exports.download = function(req, res){
    var arg = share.getParam("download csv file", req, res, [PAGE.file, PAGE.fname]);
    if(!arg.passed)
        return;

    var filename = encodeURI(arg.fname);
    res.download('temp/' + arg.file, filename, function(err){
        if(err) 
            console.trace("download file err file:%s, fname:%s, err:%s" , arg.file, arg.fname, err.message);
        else
            console.log('download file:%s with name:%s', arg.file, arg.fname);
    });
}


// 显示一个全局通用的错误页面
exports.errpage = function(err, req, res){
    // TODO : 简单回复一句话，似乎略显简陋
    res.send('出错了:' + err);
}


// 根据角色判断用户是否具有执行某个功能的权利
// 有返回true，没有返回false
var sysroledb = require('../data/sys_roledb.js');
exports.hasRight = function(module, right, roleName){
    if(roleName === 'admin') return true;
    var role = sysroledb.getRole(roleName);
    if(!role) return false;

    return role.checkRight(module, right);
}

// 判断是否系统管理员
exports.isAdmin = function(user){
    return share.isAdmin(user);
}

