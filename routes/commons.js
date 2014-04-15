// commons.js

var getreq = require('../sharepage').getreq
	, getParam = require('../sharepage').getParam
	, rt = require('../sharepage').rt
	, _ResultByState = require('../sharepage')._ResultByState
	, _assertNotNull = require('../sharepage')._assertNotNull
	, inspect = require('util').inspect;

//下载导出后的文件
exports.download = function(req, res){
    var arg = getParam("download csv file", req, res, [PAGE.file, PAGE.fname]);
    if(!arg.passed)
        return;

    res.download('uploads/' + arg.file, arg.fname, function(err){
        if(err) console.trace("download file err file:%s, fname:%s, err:%s" , arg.file, arg.fname, err.message);
    });
}
