//#!本文件由share.js自动产生于Mon Sep 29 2014 09:27:14 GMT+0800 (CST), 产生命令行为: node share.js gen sys_checkrule CRUD ..
/**
 * sys_checkruleHTTP入口模块, 需要在主文件中添加map
 * var sys_checkrule = require('./routes/sys_checkrule').bindurl(app);
 */
var sys_checkruledb = require('../data/sys_checkruledb.js')
    // base function
    , share = require('../sharepage')
    //, sf = require('../config.js')
    , inspect = require('util').inspect
    , ObjectID = require('mongodb').ObjectID
    , upload = require('./upload')
    , extend = require('node.extend');

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
//CRUD参数
var CRUD = {
    data : {name: 'data', key: 'data', optional: false},
    _id : {name:'_id', key:'_id', optional: false},
}
//
var CHK = {
    siteType : {name: 'siteType', key: 'siteType', optional: false},
    requireType : {name: 'requireType', key: 'requireType', optional: false},
    phase : {name: 'phase', key: 'phase', optional: false},
    data : {name: 'data', key: 'data', optional: false},
    match : {name: 'match', key: 'match', optional: false},
}


// 注册URL
exports.bindurl=function(app){
    share.bindurl(app, '/sys_checkrule.html', { outType : 'page'}, exports.page);
    share.bindurl(app, '/sys_checkrule/create', exports.create);
    share.bindurl(app, '/sys_checkrule/update', exports.update);
    share.bindurl(app, '/sys_checkrule/list', exports.list);
    share.bindurl(app, '/sys_checkrule/retrive', exports.retrive);
    share.bindurl(app, '/sys_checkrule/delete', exports.delete);
    share.bindurl(app, '/sys_checkrule/count', exports.count);
    share.bindurl(app, '/sys_checkrule/import', exports.import);
    share.bindurl(app, '/sys_checkrule/templ', exports.templ);
    share.bindurl(app, '/sys_checkrule/export', exports.export);

    //TODO: 扩展的API加在下面
    share.bindurl(app, '/sys_checkrule/check', exports.check);
    share.bindurl(app, '/sys_checkrule/cr_check', exports.constructRequirementCheck);
}

// GUI页面
exports.page = function(req, res){
    res.render('sys_checkrulepage.html', {
        conf : require('../../../config.js'),
        title: "无线网全生命周期管理平台-预审判断规则集",
        user : req.session.user,
        commons : require('./commonsctl.js'),
    });
};

// 更新对象
exports.create = function(req, res){
    var arg = share.getParam("创建新sys_checkrule对象:", req, res, [CRUD.data]);
    if(!arg.passed)
       return;

    sys_checkruledb.create(arg.data, function(err, newDoc){
        if(err) return share.rt(false, "创建新sys_checkrule对象出错:" + err.message, res);

        share.rt(true, { _id: newDoc._id }, res);
    });
}

// 更新对象
exports.update = function(req, res){
    var arg = share.getParam("更新sys_checkrule对象", req, res, [CRUD._id, CRUD.data]);
    if(!arg.passed) return;

    var data = arg.data;
    delete data._id;
    sys_checkruledb.update( arg._id , data , function(err, cnt){
        if(err) {
            console.log(err);
            return share.rt(false, "更新sys_checkrule出错:" + err.message, res);
        }
        
        share.rt(true, { cnt : cnt }, res);
    });
}


// 查询对象，并返回列表
exports.list = function(req, res){
    var arg = share.getParam("查询sys_checkrule列表", req, res, [PAGE.page, PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    var page = {
        skip : parseInt(arg.page.skip),
        limit : parseInt(arg.page.limit),
    };

    share.searchCondExp(arg.cond);
    console.log(arg.cond);
    
    share.fillUserDataRule(arg.cond, req);
    sys_checkruledb.list(arg.cond, arg.sort, page, function(err, docs){
        if(err) return share.rt(false, err.message, res);
        
        share.rt(true, {docs: docs}, res);
    });
};

// 查询结果集的返回数量
exports.count = function(req, res){
    var arg = share.getParam("sys_checkrule count", req, res, [PAGE.cond]);
    if(!arg.passed)
        return;

    share.searchCondExp(arg.cond);
    share.fillUserDataRule(arg.cond, req);
    sys_checkruledb.count(arg.cond, function(err, count){
        if(err) return share.rt(false, err.message, res);
        
        share.rt(true, {count: count}, res);
    });
}

// 查询对象详细信息
exports.retrive = function(req, res){
    var arg = share.getParam("retrive sys_checkrule", req, res, [CRUD._id]);
    if(!arg.passed) return;

    sys_checkruledb.findById(arg._id, function(err, doc){
        if(err) return share.rt(false, "查询sys_checkrule出错:" + err.message, res);
        if(!doc) return share.rt(false, "找不到对象：" + _id);

        var ruleName = [doc['规则名称'], doc['siteType'], doc['phase']].join('_'),
            fn = check_rules[ruleName];
        if(fn) doc.code = fn.toString();

        share.rt(true, { doc : doc }, res);
    });
}

// 删除对象
exports.delete = function(req, res){
    var arg = share.getParam("delete sys_checkrule", req, res, [CRUD._id]);
    if(!arg.passed) return;

    sys_checkruledb.delete(arg._id , function(err, doc){
        if(err) return share.rt(false, "删除sys_checkrule出错:" + err.message, res);
        
        share.rt(true, { doc : doc }, res);
    });
}

// 短链跳转，通过特定ID跳转到某个页面，大部分情况下不用实现
exports.jump = function(req, res){
    //TODO: 加入短链跳转
}

//确认导入CSV格式的数据
exports.import = function(req, res){
    var arg = share.getParam("import sys_checkrule file", req, res, [IMP.file]);
    if(!arg.passed)
        return;
    var file = upload.settings.uploadpath + '/' + arg.file ,
        type = arg.type;

    sys_checkruledb.importCSV(file, type, function(err, cnt){
        if(err) return share.rt(false, "导入sys_checkrule文件出错:" + err.message, res);

        share.rt(true, { count: cnt }, res);
    })
};


exports.templ = function(req, res){
    var filename = encodeURI('导入表模版.csv');
    res.attachment(filename);
    res.send(require('iconv-lite').encode( sys_checkruledb.cvsfield.join(','), 'gbk' ));
}


//导出楼宇信息
var exporter = function(){
    var columns = ['楼宇名称', '楼宇标识', '归属物业点名称', '归属物业点编号'
        , '地市', '县区', '区域类型1', '区域类型2', '区域类型3'
        , '层数', '面积（平方米）', '常驻人数', '建筑年代'
        , 'GSM室分是否覆盖', 'TD室分是否覆盖', 'WLAN是否覆盖', 'LTE室分是否覆盖'
        , 'A+ABIS接口1', 'A+ABIS接口2', 'A+ABIS接口3'
        , 'GSM小区', 'GSM小区数', 'GSM载频数', 'GSM忙时话音业务量', 'GSM忙时数据等效业务量', 'GSM忙时数据流量（MB）'
        , 'GSM全天话音业务量', 'GSM全天数据等效业务量', 'GSM全天数据流量（MB）'
        , 'TD小区', 'TD小区数', 'TD载频数', 'TD忙时话音业务量', 'TD忙时数据流量（MB）', 'TD全天话音业务量', 'TD全天数据流量（MB）'
        , 'WLAN热点', 'WLAN热点总数', 'WLAN总AP数', 'WLAN全天总流量'
        , 'TD-LTE小区', 'TD-LTE小区数', 'TD-LTE载频数', 'TD-LTE忙时数据流量（MB）', 'TD-LTE全天数据流量（MB）'
        , '照片上传', '历史建设项目'];

    return {
        head : function(){
            return columns.join(',') + '\n';
        },

        data : function(data){
            var out = [data.name, data.buildingId, '', ''
                , data.addComp.city, data.addComp.district, data.areatype1, data.areatype2, data.areatype3  
                , data.level, data.areasize, data.population, data.buildage
                , data.gsmcoverState, data.tdcoverState, data.wlancoverState, data.ltecoverState
                , '', '', ''
                , data.gsmCellItem, data.gsmCellAmount, data.gsmData1, data.gsmData2, data.gsmData3, data.gsmData4, data.gsmData5, data.gsmData6, data.gsmData7
                , data.tdCellItem, data.tdCellAmount, data.tdData1, data.tdData2, data.tdData3, data.tdData4, data.tdData5
                , data.wlanCellItem, data.wlanCellAmount, data.wlanData1, data.wlanData2
                , data.lteCellItem, data.lteCellAmount, data.lteData1, data.lteData2, data.lteData3
                , data.piclist, ''
            ];
            return '"' + out.join('","') + '"\n' ;
        }
    }
}
exports.export = function(req, res){
    var arg = getParam("sys_checkrule list", req, res, [PAGE.cond, PAGE.sort]);
    if(!arg.passed)
        return;

    searchCondExp(arg.cond);
    fillUserDept(arg.cond, req);
    sys_checkruledb.query(arg.cond, arg.sort, function(err, docs){
        if(err) return rt(false, err.message, res);
        
        var filename = "export_" + arg.type + "_" + new Date().getTime() + ".csv";
        var exporter = sys_checkruledb.createExporter();
        share.exportToCSVFile(docs, filename, exporter, function(err){
            if(err)
                return rt(false, "导出文件错误:" + err , res);

            return rt(true, {file: filename, fname: "SFMIS-LY-export.csv"}, res);
        });
    });
};

// === 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===
// 对给出的数据做规则检查
var async = require('async'),
    conf = require('../config.js'),
    check_rules = require('./' + conf.checkrule).check_rules;
// 检查入口
exports.check = function(req, res){
    var arg = share.getParam("执行sys_check", req, res, [CHK.siteType, CHK.phase, CHK.data, CHK.match]);
    if(!arg.passed) return;

    var data = arg.data;
    data.siteType = arg.siteType;
    delete data._id;
    sys_checkruledb.query( {
        siteType : arg.siteType , phase : arg.phase, 适用交通场景 : arg.match
    } , {} , function(err, rules){
        if(err) return share.rt(false, "查询sys_checkrule出错:" + err.message, res);
        
        var result = [];
        if(rules.length ===0) 
            return share.rt(true, { result : result }, res);

        async.eachSeries(rules
            , function(rule, cb){
                var ruleName = [rule['规则名称'], arg.siteType, arg.phase].join('_'),
                    fn = check_rules[ruleName];
                console.log("check with : rulename:%s", ruleName);
                debugger;
                if(fn){
                    try{
                        fn(data, function(err, msg){
                            if(err){
                                console.log("[ERROR]执行检查%s发生错误:%s", ruleName, err);
                                return cb(err);
                            }

                            if(msg && msg != "" && msg.length > 0){
                                result.push({
                                    rule : rule['规则名称'],
                                    message : msg
                                });    
                            }

                            return cb();
                        });
                    }catch(e){
                        console.log('[ERROR] site check rule[%s] have error:%s', ruleName , e);
                        console.trace(e);
                        return cb(new Error('自动检测发生错误：'+ ruleName))
                    }
                }else{
                    return cb();
                }
            }
            , function(err){
                if(err) return share.rt(false, "运行sys_checkrule出错:" + err.message, res);

                share.rt(true, { result : result }, res);
            });
    });
}

var requirement_resolved_check = require('./checkrule_impl.js').requirement_resolved_rule;
exports.requirement_resolved_check = requirement_resolved_check;
exports.constructRequirementCheck = function(req, res){
    var arg = share.getParam("执行检查: constructRequirementCheck对象", req, res, [CHK.requireType, CHK.data]);
    if(!arg.passed) return;

    var data = arg.data,
        key = '满足需求_' + arg.requireType;
    
    if(!requirement_resolved_check[key]) return share.rt(true, { result : [] }, res);

    requirement_resolved_check[key](data, function(err, msg){
        if(err){
            console.log("[ERROR]执行检查%s发生错误:%s", key, err);
            return share.rt(false, "运行[" + key + "]出错:" + err.message, res);
        }

        if(!msg) return share.rt(true, { result : [] }, res);

        share.rt(true, { result : [{ 
            rule: '满足需求' ,
            message : msg 
        }] }, res);
    });
}


// ============================= 下面是单元测试用的代码 ================================
var isme = require('../sharepage.js').isme;
var tester = {
  testCheckRule: function(){
    check_rules['非高流量-LTE']({
        loc: {
            type:'Point',
            coordinates : [117.74646, 31.94757]
        }
    }, function(err, msg){
        if(err) console.log('ERROR:' , err);

        if(msg) console.log('MSG:' + msg);

        console.log("无消息提示。");
    });
  }
}

if(isme(__filename)){
  if(process.argv.length > 2 && isme(__filename)){
    testfn = process.argv[2];
    console.log("run test:%s", testfn);

    if(tester[testfn]){
        console.log("连接已建立");
        tester[testfn]();
    }
  }else{
    var testcmd = [];
    for(cmd in tester)
      testcmd.push(cmd);

    console.log('sys_checkrulectl.js '+ testcmd.join('|'));
  }
}




