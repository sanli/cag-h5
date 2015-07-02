// commons.js

var share = require('../sharepage.js'),
    commons = require('../sharepage/sys/routes/commonsctl.js'),
    commonsdb = require('../data/cagcommonsdb.js'),
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

// 显示一个全局通用的错误页面
exports.errpage = function(err, req, res){
    // TODO : 简单回复一句话，似乎略显简陋
    res.send('出错了:' + err);
}

// 根据角色判断用户是否具有执行某个功能的权利
// 有返回true，没有返回false

exports.hasRight = commons.hasRight;

// 判断是否系统管理员
exports.isAdmin = function(user){
    return share.isAdmin(user);
}

// 回写JSON内容
exports.writejson = function(res, json){
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(json);
};

// 返回地市列表
exports.cityDept = function(req, res){
    res.json(commonsdb.citys);
}

// ============================================
// 下面是一些静态的控件代码
// ============================================
// 创建地市选择器
//  name : 输出控件的ID
//  opt : 渲染参数， 
//    { allowEmpty : false }
exports.citySelector = function(name, opt){
    opt = opt || { allowEmpty : false, multiSelector : false, required : false };
    if(opt.multiSelector){
        var selector =  '<select multiple style="height: 200px;" name=' 
            + name + ' class="form-control" ' + opt.required ? 'required' :'' + '>';
    }else{
        var selector =  '<select name="' + name + '" class="form-control" ' + (opt.required ? 'required' : '') + '>';
    }
    
    selector += ( opt.allowEmpty ?  "<option value=\"\">不选择</option>" : "");
    commonsdb.citys.forEach(function(city){
        selector += "<option value=" + city.city + ">" + city.city + "</option>\n";
    });
    return selector += "</select>"
};

// 流程状态选择器
exports.workflowStateSelector = function(name, opt){
    opt = opt || { allowEmpty : false, required : false };
    var selector =  '<select name="' + name + '" class="form-control" ' + (opt.required ? 'required' : '') + '>';
    
    selector += ( opt.allowEmpty ?  "<option value=''></option>" : "");
    commonsdb.workflowStates.forEach(function(type){
        selector += "<option value=" + type.value + ">" + type.name + "</option>\n";
    });
    return selector += "</select>";
};

// 部门类型选择框
//  name : 输出控件的ID
//  opt : 渲染参数， 
//    { allowEmpty : false }
exports.deptTypeSelector = function(name, opt){
    opt = opt || { allowEmpty : false };
    var selector =  "<select name=" + name + " class=\"form-control\" >";

    selector += ( opt.allowEmpty ?  "<option value=''>不选择</option>" : "");
    commonsdb.deptTypes.forEach(function(type){
        selector += "<option value=" + type.name + ">" + type.name + "</option>\n";
    });
    return selector += "</select>";
};


// 基础数据枚举类型选择器
var enumdb = require('../sharepage/sys/data/sys_enumdb.js'),
    use_static_enum = false;
exports.siteTypeSelector = function(name, module, table, field, opt){
    opt = opt || { allowEmpty : false , required : false , disabled : false };

    var key = [module, table, field].join('_'),
        enums = (use_static_enum ? selectorMap[key]
            :  enumdb.getEnum(module, table, field) );

    if(!enums) return '<span>程序错误：类型无效{' + key + '}</>';

    var selector =  "<select name=" + name + " class=\"form-control\" " 
        + (opt.required ? " required ": "") + (opt.disabled ? " disabled ": "") + " >";

    selector += ( opt.allowEmpty ?  "<option>不选择</option>" : "");
    enums.forEach(function(type){
        selector += "<option value=" + type + ">" + type + "</option>\n";
    });
    return selector += "</select>"   
}

