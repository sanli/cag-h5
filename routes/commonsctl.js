// commons.js

var share = require('../sharepage.js'),
    commonsdb = require('../data/commonsdb.js'),
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

// 返回地市列表
exports.cityDept = function(req, res){
    res.json(commonsdb.citys);
}

// 显示一个全局通用的错误页面
exports.errpage = function(err, req, res){
    // TODO : 简单回复一句话，似乎略显简陋
    res.send('出错了:' + err);
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

// var selectorMap = {
//     siteType : ['宏站','室分'],
//     宏站_siteType : ['宏站'],
//     宏站_网络类型 : ['GSM','TD','LTE'],
//     宏站_覆盖区域 : ['城市区域','县城区域','县辖农村','市辖农村'],  
//     宏站_覆盖场景 : ['高校园区','政府机关','办公写字楼','交通枢纽','乡镇农村','住宅小区','宾馆饭店','商业建筑','工厂企业','公共场所'],
//     宏站_交通场景 : ['城区','农村','高铁','高速','其他道路', '其他'],
//     宏站_频段: ['GSM900','DCS1800','A频段','F频段','D频段'], 
//     宏站_天面类型 : ['铁塔','美化天线','景观塔','抱杆'],
//     宏站_天线类型 : ['电下倾3度', '电下倾3度', '电下倾6度'],
//     宏站_设备厂家 : ['卡特','诺西','爱立信','华为','中兴'],
//     宏站_建设方式 : ['共址', '新建'],
//     宏站_天面建设方式 : ['新建天馈F', '共天馈F'],

//     室分_网络类型 : ['GSM','TD','LTE','WLAN'],
//     室分_siteType : ['室分'],
//     室分_覆盖区域 : ['城市区域','县城区域','县辖农村','市辖农村'],
//     室分_覆盖场景 : ['高校园区','政府机关','办公写字楼','交通枢纽','乡镇农村','住宅小区','宾馆饭店','商业建筑','工厂企业','公共场所'],
//     室分_频段 : ['GSM900','DCS1800','A频段','F频段','D频段','E频段'],  
//     室分_主设备建设方式 : ['新建','升级','替换升级'],
//     室分_分布系统建设方式 : ['新建单路','新建双路','单路改造单路','单路改造双路','双路改造双路','新建光分布系统','新建FEMTO'],
//     室分_合路方式 : ['GSM','TD','LTE','WLAN'],
//     室分_站点需求属性 : ['政企市场', '流量', '覆盖']
// }

var selectorMap = {
    '项目管理_项目信息_站点类型'                      :  ['宏站', '室分'],
    '项目管理_项目信息_网络类型'                      :  ['GSM', 'TD', 'LTE', 'WLAN'],
    '规划审核_规划-宏站_网络类型'                     :  ['GSM', 'TD', 'LTE'],
    '规划审核_规划-宏站_覆盖区域'                     :  ['城市区域', '县城区域', '县辖农村', '市辖农村'],
    '规划审核_规划-宏站_交通场景'                     :  ['城区', '农村', '高铁', '高速', '其他道路', '其他'],
    '规划审核_规划-宏站_频段'                        :  ['GSM900', 'DCS1800', 'A频段', 'F频段', 'D频段'],
    '规划审核_规划-宏站_天面类型'                     :    ['铁塔', '美化天线', '景观塔', '抱杆'],
    '规划审核_规划-室分_网络类型'                     :    ['GSM', 'TD', 'LTE', 'WLAN'],
    '规划审核_规划-室分_覆盖区域'                     :    ['城市区域', '县城区域', '县辖农村', '市辖农村'],
    '规划审核_规划-室分_覆盖场景'                     :    ['高校园区 ,政府机关 ,办公写字楼 ,交通枢纽 ,乡镇农村 ,住宅小区 ,宾馆饭店 ,商业建筑 ,工厂企业 ,公共场所'],
    '规划审核_规划-室分_频段'                        :    ['GSM900', 'DCS1800', 'A频段', 'F频段', 'D频段', 'E频段'],
    '规划审核_规划-室分_主设备建设方式'                :    ['新建', '升级', '替换升级'],
    '规划审核_规划-室分_分布系统建设方式'               :    ['新建单路', '新建双路', '单路改造单路', '单路改造双路', '双路改造双路', '新建光分布系统', '新建FEMTO'],
    '规划审核_规划-室分_合路方式'                     :    ['G', 'T', 'L', 'W', 'G/T', 'G/L', 'G/W', 'T/L', 'T/W', 'L/W', 'G/T/L', 'G/T/W', 'G/L/W', 'T/L/W', 'G/T/L/W'],
    '规划审核_规划-室分_站点需求属性'                  :    ['政企市场', '流量', '覆盖'],
    '规划审核_规划-室分_建设优先级'                   :    ['一级','二级','三级'],
    '勘察设计审核_勘察设计-宏站_设备厂家'             :  ['卡特', '诺西', '爱立信', '华为', '中兴'],
    '勘察设计审核_勘察设计-宏站_网络类型'             :  ['GSM', 'TD', 'LTE'],
    '勘察设计审核_勘察设计-宏站_建设方式'             :  ['共址', '新建'],
    '勘察设计审核_勘察设计-宏站_天面建设方式'           :    ['新建天馈F', '共天馈F'],
    '勘察设计审核_勘察设计-宏站_覆盖区域'             :  ['城市区域', '县城区域', '县辖农村', '市辖农村'],
    '勘察设计审核_勘察设计-宏站_交通场景'             :  ['城区', '农村', '高铁', '高速', '其他道路', '其他'],
    '勘察设计审核_勘察设计-宏站_天线类型'             :  ['电下倾3度', '电下倾3度', '电下倾6度'],
    '勘察设计审核_勘察设计-宏站_频段'               :    ['GSM900', 'DCS1800', 'A频段', 'F频段', 'D频段'],
    '勘察设计审核_勘察设计-宏站_天面类型'             :  ['铁塔', '美化天线', '景观塔', '抱杆'],
    '勘察设计审核_勘察设计-室分_网络类型'             :  ['GSM', 'TD', 'LTE', 'WLAN '],
    '勘察设计审核_勘察设计-室分_覆盖区域'             :  ['城市区域', '县城区域', '县辖农村', '市辖农村'],
    '勘察设计审核_勘察设计-室分_覆盖场景'             :  ['高校园区', '政府机关', '办公写字楼', '交通枢纽', '乡镇农村', '住宅小区', '宾馆饭店', '商业建筑', '工厂企业', '公共场所'],
    '勘察设计审核_勘察设计-室分_频段'               :    ['GSM900', 'DCS1800', 'A频段', 'F频段', 'D频段', 'E频段'],
    '勘察设计审核_勘察设计-室分_主设备建设方式'      :  ['新建', '升级', '替换升级'],
    '勘察设计审核_勘察设计-室分_分布系统建设方式'     :  ['新建单路', '新建双路', '单路改造单路', '单路改造双路', '双路改造双路', '新建光分布系统', '新建FEMTO'],
    '勘察设计审核_勘察设计-室分_合路方式'             :  ['G', 'T', 'L', 'W', 'G/T', 'G/L', 'G/W', 'T/L', 'T/W', 'L/W', 'G/T/L', 'G/T/W', 'G/L/W', 'T/L/W', 'G/T/L/W'],
    '勘察设计审核_勘察设计-室分_站点需求属性'        :    ['政企市场', '流量', '覆盖'],
    '综资数据同步_E-NODEB_应急类型'              :  ['抗地震＋抗台风', '常规站', '抗洪水＋抗台风＋抗冰雪', '抗震＋抗洪＋抗台风＋抗冰雪', '应急通信车', '抗洪水＋抗冰雪', '抗震＋抗洪＋抗冰雪', '抗震', '抗台风', '测试站', '抗台风＋抗冰雪', '50年一遇防洪基站', '抗冰雪', '抗震＋抗洪', '抗洪水', '抗洪水＋抗台风', '应急站 ', '抗震＋抗冰雪', '抗震＋抗台风＋抗冰雪', '抗震＋抗洪＋抗台风'],
    '综资数据同步_E-NODEB_VIP级别'                :    ['VIP', '非VIP'],
    '综资数据同步_E-NODEB_生产厂家'                 :  ['华为', '诺西', '新邮通', '爱立信', '中兴', '大唐', '普天', '烽火', '阿尔卡特'],
    '综资数据同步_E-NODEB_生命周期状态'           : ['工程（默认值）', '退网', '在网'],
    '综资数据同步_E-UTRANCELL_边界小区类型'    :    ['非边界小区', '省际', '省内'],
    '综资数据同步_E-UTRANCELL_生命周期状态'    :    ['工程（默认值）', '退网', '在网'],
    '综资数据同步_SF_EUTRANCELL_合路类型'    :    ['WLAN合路', 'GSM合路', '独立天馈系统'],
    '综资数据同步_SF_EUTRANCELL_项目类型'    :    ['小区覆盖系统', '室内分布系统', '室外覆盖系统'],
    '综资数据同步_SF_EUTRANCELL_站点分布'    :    ['县城城区', '农村乡镇', '一般城区', '其他重点区域', '密集城区'],
    '综资数据同步_SF_EUTRANCELL_覆盖场景'    :    ['高校园区', '政府机关', '办公写字楼', '交通枢纽', '乡镇农村', '住宅小区', '宾馆饭店', '商业建筑', '工厂企业', '公共场所'],
    '综资数据同步_TOWER_铁塔类型'           :    ['落地角钢塔', '楼顶角钢塔', '落地四管塔', '落地三管塔', '楼顶三管塔', '落地内爬单管塔', '落地外爬单管塔', '楼顶单管塔', '落地拉线塔', '楼顶拉线塔', '楼顶井字架', '落地景观塔', '楼顶景观塔', '抱杆', '桅杆', '楼顶美化天线', '集束天线', '其他'],
    '综资数据同步_TOWER_铁塔产权'           :    ['移动', '自建', '其他', '联通', '租用', '承德电信', '承德移动', '电信', '自有'],
    '综资数据同步_TOWER_共建单位'           :    ['无', '联通', '电信+联通', '电信'],
    '综资数据同步_TOWER_共享单位'           :    ['无', '联通', '电信+联通', '电信'],
    '综资数据同步_ANTENNA_天线类型'         :    ['单频单极化', '单频双极化', '单频双极化电调', '双频双极化', '双频双极化电调', '三频双极化', '三频双极化电调', '智能天线'],
    '基站维护_搬迁表单_网络制式（2/3/4G)'      :  ['GSM,TD,LTE'],
    '基站维护_告警及故障_设备类型'              :  ['BTS（对应GSM站点）', 'NODEB（对应TD站点）', 'ENODEB（对应LTE站点）', 'BSC', 'RNC'],
    '数据管理_GSM或TD_小区类型'              :    ['常规宏站', '宏站', '交通干线', '拉远宏站', '普通宏站', '室分', '综合覆盖-城区室内', '综合覆盖-其他', '综合覆盖-室内', '综合覆盖-乡镇农村拉远', '综合覆盖-住宅小区'],
    '数据管理_GSM或TD_覆盖室内'              :    ['是', '否'],
    '数据管理_GSM或TD_覆盖区域'              :    ['城市区域', '县城区域', '县辖农村', '市辖农村'],
    '数据管理_GSM或TD_频段'                  :       ['GSM900', 'DCS1800', 'A频段', 'F频段', 'D频段'],
    '数据管理_LTE_小区类型'                    :    ['常规宏站', '宏站', '交通干线', '拉远宏站', '普通宏站', '室分', '综合覆盖-城区室内', '综合覆盖-其他', '综合覆盖-室内', '综合覆盖-乡镇农村拉远', '综合覆盖-住宅小区'],
    '数据管理_LTE_覆盖类型'                    :    ['室内,室外'],
    '数据管理_LTE_覆盖区域'                      :    ['城市区域', '县城区域', '县辖农村', '市辖农村'],
    '数据管理_LTE_频段'                         :    ['GSM900', 'DCS1800', 'A频段', 'F频段', 'D频段'],
    '数据管理_WLAN_覆盖区域'                     :    ['城市区域', '县城区域', '县辖农村', '市辖农村'],
    '数据管理_宏站_网络类型'                      :    ['GSM', 'TD', 'LTE'],
    '数据管理_宏站_覆盖区域'                      :    ['城市区域', '县城区域', '县辖农村', '市辖农村'],
    '数据管理_宏站_交通场景'                      :    ['城区', '农村', '高铁', '高速', '其他道路', '其他'],
    '数据管理_宏站_频段'                         :    ['GSM900', 'DCS1800', 'A频段', 'F频段', 'D频段'],
    '数据管理_室分_网络类型'                      :    ['GSM', 'TD', 'LTE'],
    '数据管理_室分_覆盖区域'                      :    ['城市区域', '县城区域', '县辖农村', '市辖农村'],
    '数据管理_室分_覆盖场景'                      :    ['高校园区', '政府机关', '办公写字楼', '交通枢纽', '乡镇农村', '住宅小区', '宾馆饭店', '商业建筑', '工厂企业', '公共场所'],
    '数据管理_室分_频段'                         :    ['GSM900', 'DCS1800', 'A频段', 'F频段', 'D频段', 'E频段'],
    '数据管理_WLAN导入表_覆盖区域'                :    ['城市区域', '县城区域', '县辖农村', '市辖农村'],
}



// 基站数据类型选择框
//  name : 输出控件的ID
//  field : 字段名称，例如 ： 网络类型
//  siteType : 站点类型：宏站｜室分
//  opt : 渲染参数
//  TODO : deprecated, 将会移除
// exports.siteTypeSelector = function(name, field, siteType, opt){
//     if(typeof siteType === 'object'){
//         opt = siteType; siteType = "";
//     }
//     opt = opt || { allowEmpty : false , required : false};

//     var key = ( siteType ?  siteType + "_" : "" ) + field ;
//     if(!selectorMap[key]) return '<span>程序错误：类型无效{' + key + '}</>';

//     var selector =  "<select name=" + name + " class=\"form-control\" " 
//         + (opt.required ? "required": "") + " >";

//     selector += ( opt.allowEmpty ?  "<option value='>不选择</option>" : "");
//     selectorMap[key].forEach(function(type){
//         selector += "<option value=" + type + ">" + type + "</option>\n";
//     });
//     return selector += "</select>"
// }

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

// 根据角色判断用户是否具有执行某个功能的权利
// 有返回true，没有返回false
var sysroledb = require('../sharepage/sys/data/sys_roledb.js');
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

// 回写JSON内容
exports.writejson = function(res, json){
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(json);
};

