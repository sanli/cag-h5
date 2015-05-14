//#!本文件由share.js自动产生于Thu Mar 13 2014 10:50:31 GMT+0800 (CST), 产生命令行为: node share.js gen sysconf CRUD ..
/**
 * 系统配置，用于保存管理员级别的系统配置信息，可以在运行时修改配置，系统启动时需要缓存全部配置信息
 */
//基站数据访问
var inspect = require('util').inspect
  , ObjectID = require('mongodb').ObjectID
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Data = require('../../mongo.js')
  , Helper = require('../mongo.js').Helper
  , extend = require('node.extend')
  , sp = require('../sharepage.js')
  , ud = require('underscore')
  , csv = require('csv')
  , isme = require('../sharepage.js').isme;

// === 基本数据结构定义，按照实际需求修改 ===
// 定义配置的存储结构，可以由share.js自动生成
var sys_conf = {
    // 全局配置信息
    global : {
        desc: "通用全局配置信息",
        appname : { label: '程序名称', desc: "当前程序名称", type: String, default: "基于互联网地图的用户行为分析系统" },
        version : { label: '版本', desc: "程序版本", type: String, default: "1.0" },
    },

    /*
     * 应用建议配置
     * 【规划建设】的判断条件：条件1：未建设；条件2：业务量高，数据流量达到1G；条件3：用户数高于20；条件4：覆盖率低于80%。
     * 【维护优化】的判断条件：条件1：已建设；条件2：业务量低，数据流量低于100M；条件3：用户数高于20；条件4：覆盖率低于80%。
     * 【终端营销】的判断条件：条件1：业务量高，数据流量达到1G；条件2：用户数高于20；条件3：TD终端占比高于30%。
     * 【市场推广】的判断条件：条件1：业务量低，数据流量低于100M；条件2：用户数高于20；条件3：TD终端占比高于30%；条件4：覆盖率高于95%。
    */
    items : [{
        label: '规划建设缺省值', desc: "应用建议-规划建设-判定缺省值配置",
        alreadyConstract : { label: '已建设', desc:'是否已建设', type: Boolean, default: false },
        wyData2 : { label: '业务量', desc:'业务量(GSM+TD的全天数据流量)', type: Number, default: 1024 },
        abis1 : { label:'用户数', desc:'用户数', type: Number, default: 20 },
        abis2 : { label:'覆盖率', desc:'覆盖率', type: Number, default: 80 }
    }],
    suggestion_needoptimization : {
        desc: "应用建议-维护优化-判定缺省值配置",
        alreadyConstract : { label:'已建设', desc:'是否已建设', type: Boolean, default: true },
        wyData2 : { label:'业务量', desc:'业务量(GSM+TD的全天数据流量)', type: Number, default: 100 },
        abis1 : { label:'用户数', desc:'用户数', type: Number, default: 20 },
        abis2 : { label:'覆盖率', desc:'覆盖率', type: Number, default: 80 }
    },
    suggestion_needmarket : {
        desc: "应用建议-终端营销-判定缺省值配置",
        wyData2 : { label:'业务量', desc:'业务量(GSM+TD的全天数据流量)', type: Number, default: 100 },
        abis1 : { label:'用户数', desc:'用户数', type: Number, default: 20 },
        abis9 : { label:'终端占比', desc:'TD终端占比', type: Number, default: 30 }
    },
    suggestion_needspread : {
        desc: "应用建议-市场推广-判定缺省值配置",
        wyData2 : { label:'业务量', desc:'业务量(GSM+TD的全天数据流量)', type: Number, default: 100 },
        abis1 : { label:'用户数', desc:'用户数', type: Number, default: 20 },
        abis9 : { label:'终端占比', desc:'TD终端占比', type: Number, default: 30 },
        abis2 : { label:'覆盖率', desc:'覆盖率', type: Number, default: 95 }
    },

    /**
     * 后评估配置
     * GSM：判断最终是否合格的条件为：楼宇覆盖率>=95% &&楼宇GSM忙时话音业务量/载频数/6.6/0.7>=70%，两个条件必须同时满足才最终合格，同时显示在哪个条件上造成的不合格。
     * TD：显示楼宇关联的所有TD小区号（可在一列中）；判断最终是否合格的条件为：楼宇所有关联TD小区的全天数据流量的平均值>=50M。
     * WLAN：显示楼宇关联的所有热点名称；判断楼宇关联的所有热点的总数据流量之和/总AP数之和>=45G。
     */
    laterevaluate_gsm : {
        desc: "GSM后评估配置",
        check1 : { desc:'覆盖率', type: Number, default: 95 },
        check2 : { desc:'楼宇GSM忙时话音业务量/载频数/6.6/0.7', type: Number, default: 95 }
    },
    laterevaluate_td : {
        desc: "TD后评估配置",
        check1 : { desc:'楼宇所有关联TD小区的全天数据流量的平均值', type: Number, default: 50 }
    },
    laterevaluate_wlan : {
        desc: "WLAN后评估参数配置",
        check1 : { desc:'楼宇关联的所有热点的总数据流量之和/总AP数之和', type: Number, default: 50 }
    },
    admin_message : {
        desc: "公告消息",
        showmessage1 : { label: '是否显示消息', desc:'是否给任何登录用户现实消息', type: Boolean, default: false },
        message1 : { desc:'可以编辑一条公告消息，所有账号登陆后，该消息一直显示', type: String, default: '', inputType : "text" }
    },
    dashboard_auditeanalysis : {
        desc: "质量预警状态看板配置",
        // 室内常驻用户数
        abis1_check : { label: '室内常驻用户数', desc:'是否判断', type: Boolean, default: false },
        abis1_value : { desc:'室内常驻用户数绝对值', type: Number, default: 1000 },
        abis1_delta : { desc:'室内常驻用户数降幅(％)', type: Number, default: 5 },
        // 总话音业务量(Erl)
        wyData1_check : { label: '总话音业务量', desc:'是否判断', type: Boolean, default: false },
        wyData1_value : { desc:'总话音业务量(Erl)', type: Number, default: 1000 },
        wyData1_delta : { desc:'室内常驻用户数降幅(％)', type: Number, default: 5 },
        // 总数据流量<br/>(MB)
        wyData2_check : { label: '总数据流量', desc:'是否判断', type: Boolean, default: false },
        wyData2_value : { desc:'总数据流量(MB)', type: Number, default: 1000 },
        wyData2_delta : { desc:'总数据流量降幅(%)', type: Number, default: 5 },
        // 覆盖率<br/>(%)
        abis2_check : { label: '覆盖率', desc:'是否判断', type: Boolean, default: false },
        abis2_value : { desc:'覆盖率(%)', type: Number, default: 95 },
        abis2_delta : { desc:'覆盖率降幅(%)', type: Number, default: 5 },
        // 话音质量<br/>(%)
        abis3_check : { label: '话音质量', desc:'是否判断', type: Boolean, default: false },
        abis3_value : { desc:'话音质量(%)', type: Number, default: 95 },
        abis3_delta : { desc:'话音质量降幅(%)', type: Number, default: 5 },
        // 平均覆盖电平<br/>（dB）
        abis4_check : { label: '平均覆盖电平', desc:'是否判断', type: Boolean, default: false },
        abis4_value : { desc:'平均覆盖电平（dB）', type: Number, default: 95 },
        abis4_delta : { desc:'平均覆盖电平降幅(%)', type: Number, default: 5 },
        // 掉话率<br/>(%)
        abis5_check : { label: '掉话率', desc:'是否判断', type: Boolean, default: false },
        abis5_value : { desc:'掉话率(%)', type: Number, default: 95 },
        abis5_delta : { desc:'掉话率降幅(%)', type: Number, default: 5 },
        //寻呼成功率<br/>(%)
        abis6_check : { label: '寻呼成功率', desc:'是否判断', type: Boolean, default: false },
        abis6_value : { desc:'寻呼成功率(%)', type: Number, default: 95 },
        abis6_delta : { desc:'寻呼成功率降幅(%)', type: Number, default: 5 },
        //质差切换占比<br/>(%)
        abis7_check : { label: '质差切换占比', desc:'是否判断', type: Boolean, default: false },
        abis7_value : { desc:'质差切换占比(%)', type: Number, default: 95 },
        abis7_delta : { desc:'质差切换占比降幅(%)', type: Number, default: 5 },
        //乒乓切换占比<br/>(%)
        abis8_check : { label: '乒乓切换占比', desc:'是否判断', type: Boolean, default: false },
        abis8_value : { desc:'乒乓切换占比(%)', type: Number, default: 95 },
        abis8_delta : { desc:'乒乓切换占比降幅(%)', type: Number, default: 5 },
        //TD终端占比<br/>(%)
        abis9_check : { label: 'TD终端占比', desc:'是否判断', type: Boolean, default: false },
        abis9_value : { desc:'TD终端占比(%)', type: Number, default: 95 },
        abis9_delta : { desc:'TD终端占比降幅(%)', type: Number, default: 5 }
    },
};
exports.sysconfMeta = sysconf_meta;

var schema = sp.deepOmit(sysconf_meta, [ 'desc', 'label']),
    sys_conf = new Schema( schema,  { collection: 'sys_conf' }),
    _Module = mongoose.model('sys_conf', sys_conf);
exports.Sysconf = Sysconf = _Module ;

// === 基本功能实现函数,一般不用修改 ===
// 查询数据
exports.list = function(fn){
    exports.getSysconf(fn);
}

exports.update = function(_id, data, fn){
    _Module.update({}, {$set: data}, { multi : true }, function(err){
        if(err){
            console.trace("query sysconf page error:", err);  
        }else{
            cache.remove('sysconf')
        }

        fn(err);
    });
}

exports.query = function(type, cond, sort, fn){
    exports.getSysconf(fn);
}

// 极为简单的Cache
function Cache(){
    var self = {};

    self.put = function( key, value){
        self[key] = value;
    }

    self.get = function( key){
        return self[key];
    }

    self.remove = function ( key ){
        delete self[key];
    }

    self.exists = function(key){
        return !!self[key];
    }

    return self;
};
var cache = Cache();

// =============== 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===================
exports.getSysconf = function(fn){
    if(cache.exists('sysconf')) 
        return fn(null, cache.get('sysconf'));

    _Module.findOne().exec(function(err, sysconf){
        if(err) console.trace("query sysconf page error:", err);

        cache.put('sysconf', sysconf);
        fn(err, sysconf);
    });
}

// ============================= 下面是单元测试用的代码 ================================
var tester = {
    list: function(){
        exports.query(null, null, null, function(err, sysconf){
            if(err) console.trace(err);

            console.log(sysconf);
        });
    },

    initSysconf : function(){
        exports.getSysconf(function(err, sysconf){
            console.log(sysconf);
            if(sysconf) return console.log('[WARN] sysconf already exists, skip init');

            var conf = new Sysconf();
            conf.save(function(err){
                if(err) return console.trace(err);

                console.log('init sysconf success');
            });
        });
    }
}

if(isme(__filename)){
  if(process.argv.length > 2 && isme(__filename)){
    testfn = process.argv[2];
    console.log("run test:%s", testfn);

    if(tester[testfn]){
      Data(function(){ 
        console.log("连接已建立");
        tester[testfn]();
      });   
    }
  }else{
    var testcmd = [];
    for(cmd in tester)
      testcmd.push(cmd);

    console.log('sysconfdb.js '+ testcmd.join('|'));
  }
}


