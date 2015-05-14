//#!本文件由share.js自动产生于Fri Dec 12 2014 17:12:38 GMT+0800 (CST), 产生命令行为: node share.js gen sys_utilities CRUD ..

/**
 * sys_utilities数据库访问类
 */
var inspect = require('util').inspect
  , ObjectID = require('mongodb').ObjectID
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , Data = require('../mongo.js')
  , Helper = require('../mongo.js').Helper
  , extend = require('node.extend')
  , csv = require('csv') 
  , share = require('../sharepage.js')
  , async = require('async');

// === 基本数据结构定义，按照实际需求修改 ===

// TODO: 下面为Demo数据结构，请改成模块实际数据结构
var sys_sys_utilities = new Schema({
    // ID字段在每个对象中会自动创建，除非需要自己创建_id,否者不要放开
    /* _id : Schema.Types.ObjectId, */
    // ---- 基本信息 ----
    // 名称
    moduleName : String,
    // 基本描述
    desc : String,
    // 模块相关文件
    files : [String],
    // 是否系统模块
    isSysModule : Boolean,
    // 模块是否启用
    isActive: Boolean,
    // 最后修改时间
    updateTime : Date
},  { collection: 'sys_sys_utilities' });

// 创建索引 
// TODO: 根据实际结构确定索引结构
sys_sys_utilities.index({_id : 1})
    .index({moduleName : 1});
var sys_utilities = mongoose.model('sys_sys_utilities ', sys_sys_utilities ),
    _Module = sys_utilities ;
exports.sys_utilities  = sys_utilities;


// 以下字段不用在列表查询的时候返回
// TODO:  需要修改为实际数据结构对应的字段
var defaultProjection = { updateTime : 0 };


// === 基本功能实现函数,一般不用修改 ===
// 创建对象
exports.create = function(data, fn){
  //判断模块名是否重复
  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  _Module.find({ moduleName: data.moduleName}
    , function(err, items){
      if(err)
        return fn(err);

      if(items.length > 0)
        return fn(new Error('与现有数据工具名称重复，不能创建'));

      var module = new _Module(data);
      _Module.create(module, function(err, newModule){
        if(err) console.log("新建sys_utilities出错 :" + err);
        fn(err, newModule);
      });
    });
};

// 更新对象
exports.update = function(_id, data, fn){
  //检查是否与现有重复
  // TODO: 唯一性判断逻辑需要修改为实际业务需要
  _Module.find({ moduleName: data.moduleName } 
    ,function(err, items){
      if(share.isConflict(items, _id))
        return fn(new Error('与现有sys_utilities名称重复，不能修改.'));

      _Module.findByIdAndUpdate(_id, {$set: data}, {new : false}, fn);
    });
};

//删除对象
exports.delete = function(_id, fn) {
    _Module.remove({ _id : _id } , fn);
}

// 查询数据，支持排序和分页
exports.list = function(cond, sort, page, fn){
    // 使用Aggregate查询数据
  _Module.find(cond, defaultProjection)
    .sort(sort)
    .skip(page.skip)
    .limit(page.limit)
    .exec(function(err, docs){
      if(err) console.trace("查询sys_utilities错误:", err);

      fn(err, docs);
    });
}

// 普通查询 TODO: 可能无用，可以移除
exports.query = function(cond, sort, fn){
    _Module.find(cond)
    .sort(sort)
    .exec(function(err, docs){
      if(err) console.trace("查询sys_utilities错误:", err);

      fn(err, docs);
    });
}

//返回某个查询的返回值数量，主要用于分页
exports.count = function(cond, fn){
  _Module.find(cond)
    .count(function(err, count){
      if(err) console.trace("统计sys_utilities数据量错误::", err);

      fn(err, count);
    });
}

//按照ID查询对象
exports.findById = function(_id, fn){
  _Module.findById(_id, function(err, doc){
    fn(err, doc ? doc.toObject() : {});
  });
}

/**
 * 通过CSV导入数据，需要导入数据的模块才需要实现
 * TODO: 在imp.js文件中实现一个导入器
 */
 var createFakeDataImporter = require('./imp.js').createFakeDataImporter,
    // 省份 城市  经度  纬度
    // TODO: 修改CVS文件格式
    cvsfield = ['省份',  '城市',  '经度',  '纬度'];
exports.importCSV = function(filename, fn) {
var args = {
      encodeFrom : 'utf8' , 
      encodeTo: 'utf8'
    };

    if(!fs.existsSync(filename)){
        return fn(new Error('数据文件:' + filename + ' 不存在'));
    }
    
    var imp = createFakeDataImporter(filename, _Module, cvsfield, args)
    imp.import(function(err, count, cellIds){
        if(err) {
            console.trace("测试黑点", err);
            return fn(err)
        };

        return fn(err, count, cellIds);
    }, updater);
};
exports.cvsfield = cvsfield;


exports.createExporter = function(){
    //TODO : 修改导出字段
    var columns = ['_id', '省份',  '城市',  '经度',  '纬度'];
    return {
        head : function(){
            return columns.join(',') + '\n';
        },
        data : function(data){
            var out = [
                data['_id'], data['省份'], data['城市'], data['经度'], data['纬度']
            ];
            return '"' + out.join('","') + '"\n' ;
        }
    }
}
// =============== 扩展的代码请加在这一行下面，方便以后升级模板的时候合并 ===================

// 规划名称在数据库中直接修改后通过这个脚本修正所有位置保存的名称
// 注册所有的数据源，地图数据来源于多种数据源需要分别对待

// 宏站规划数据（宏站 ＋ 室分 ＋ 流程）
var sfsiteplan = require('../data/sfsiteplandb.js').sfsiteplan,
    wfsiteplan = require('../data/wfsiteplandb.js').wfsiteplan,
    wfsite_plan_change = require('../data/wfsite_plan_changedb.js').wfsite_plan_change,
    // 室分规划数据
    wfsite_plan_sf = require('../data/wfsite_plan_sfdb.js').wfsite_plan_sf,
    wfsite_plan_change_sf = require('../data/wfsite_plan_sfdb.js').wfsite_plan_sf,
    // 室分配套设备
    sfslave_plan = require('../data/sfslave_plandb.js').sfslave_plan,
    wfslave_plan = require('../data/wfslave_plandb.js').wfslave_plan,
    wfslave_plan_change = require('../data/wfslave_plan_changedb.js').wfslave_plan_change,
    // 宏站设计勘察数据（宏站  + 室分 ＋ 流程）
    sfsite_design_hz = require('../data/sfsite_design_hzdb.js').sfsite_design_hz,
    wfsite_design_hz = require('../data/wfsite_design_hzdb.js').wfsite_design_hz,
    wfsite_design_change_hz = require('../data/wfsite_design_change_hzdb.js').wfsite_design_change_hz,
    wfsite_investigation_hz = require('../data/wfsite_investigation_hzdb.js').wfsite_investigation_hz;
    // 室分设计数据
    wfsite_design_sf = require('../data/wfsite_design_sfdb.js').wfsite_design_sf,
    wfsite_design_change_sf = require('../data/wfsite_design_change_sfdb.js').wfsite_design_change_sf,
    // 室分配套设计数据
    sfslave_design = require('../data/sfslave_designdb.js').sfslave_design,
    wfslave_design = require('../data/wfslave_designdb.js').wfslave_design,
    wfslave_design_change = require('../data/wfslave_design_changedb.js').wfslave_design_change;

exports.fix_plan_name_change = function(oldkey, newkey, fn){
    // 填充值
    function _fillkey(data, newkey){
        data['规划站点名称'] = newkey.规划站点名称;
        data['city'] = newkey.city;
        data['区县'] = newkey.区县;
    }
    // 更新规划流程
    function _update_plan_wf(oldkey, newkey, _Module, callback){
        _Module.findOne(oldkey, function(err, wkflow){
                if(err){
                    console.trace(err);
                    return callback(err);
                }

                if(!wkflow){
                    console.log('目标流程［%s］不存在', oldkey.规划站点名称);
                    return callback();
                }

                var wkflowobj = wkflow.toObject(),
                    _id = wkflow._id;
                delete wkflowobj._id;

                _fillkey(wkflowobj, newkey);
                _fillkey(wkflowobj.siteDataSnap, newkey);
                wkflowobj.steps.forEach(function(step){
                    if(step['step'] === "导入数据" || step['step'] === "修改数据"){
                        _fillkey(step.siteData, newkey);
                    }
                });

                _Module.update ({ _id : _id}, {$set : wkflowobj}, function(err){
                    if(err) {
                        console.log("更新宏站规划流程出错 %s -> %s, ERROR : %s", oldkey.规划站点名称, newkey.规划站点名称, err);
                        callback(err);
                    }

                    console.log("更新宏站规划流程， %s -> %s", oldkey.规划站点名称, newkey.规划站点名称);
                    callback();
                });
            });
    }

    // 1. 修改规划流程，和规划库
    async.series(
        [
            function(callback){
                sfsiteplan.update(oldkey, newkey, function(err){
                    if(err){
                        console.trace(err);
                        return callback(err);
                    }

                    console.log("更新宏站规划库， %s -> %s", oldkey.规划站点名称, newkey.规划站点名称);
                    callback();
                });
            },
            function(callback){
                _update_plan_wf(oldkey, newkey, wfsiteplan, callback );
            },
            function(callback){
                _update_plan_wf(oldkey, newkey, wfsite_plan_change, callback );
            }
        ],
        function(err){
            if(err) log.tarce(err);
            console.log("更新宏站规划库， %s -> %s", oldkey.规划站点名称, newkey.规划站点名称);
            fn(err);
        });
    
    // 2. 修改“勘察设计流程”和“勘察设计库”
}

// 修复流程中没有区县字段的bug
exports.fix_city_key = function(fn){
    async.eachSeries([ wfsiteplan, wfsite_plan_change, 
        wfsite_plan_sf, wfsite_plan_change_sf,
        wfsite_design_hz, wfsite_design_change_hz, wfsite_investigation_hz,
        wfsite_design_sf, wfsite_design_change_sf]
    , function(_Module, callback){
        _Module.find({ '区县' : { $exists : false}}, function(err, workflows){
            if(err) return callback(err);

            async.eachSeries(workflows, function(workflow, changecallback){
                if(!workflow.siteDataSnap['区县']) return changecallback();

                workflow['区县'] = workflow.siteDataSnap['区县'];
                workflow.save(function(err){
                    if(err) return changecallback(err);

                    console.log('修改站点［%s］区县成功', workflow['规划站点名称'] || workflow['实际站点名称']);
                    changecallback();
                });
            }, callback);
        });
    },function(err){
        console.log("全部流程已经加上区县数据");
    });
}

// 为所有进行中的流程数据加上sid，这些sid会在最后入库
function fix_wfplan_sid(module, fn){
    module.find({ 
        sid: { $exists : false } , wfstate : { $ne : '流程结束' } 
    }, function(err, sites){
        if(err) return fn(err);
        if(!sites) return fn();

        async.eachSeries(sites, function(site, callback){
            if(site.sid) return callback(new Error('site已经有sid:'+ site.sid +', _id:' + site._id));

            site.sid = new ObjectID();
            site.save(function(err){
                if(err) return callback(err);

                console.log('为数据 站点名称:%s, 增加sid:%s', site['规划站点名称'] || site['实际站点名称'] || site['物业点名称']
                    , site.sid);
                callback(err);
            });
        }, fn);
    });
}

// 重新为所有没有sid的流程到库中寻找sid
function fix_wf_sid_with_data(wfmodule, datamodule, fn, namekey){
    var namekey = namekey || '规划站点名称';
    wfmodule.find({ 
        sid: { $exists : false } 
    }, function(err, sites){
        if(err) return fn(err);
        if(!sites) return fn();

        async.eachSeries(sites, function(siteflow, callback){
            if(siteflow.sid) return callback(new Error('siteflow已经有sid:'+ siteflow.sid +', _id:' + siteflow._id));

            var name = siteflow[namekey],
                cond = { city : siteflow['city'] };

            cond[namekey] = name;
            datamodule.findOne(cond, function(err, sitedata){
                    if(err) return callback(err);
                    if(!sitedata) {
                        console.log('[WARN] 流程数据[%s]找不到对应的入库数据,无法填补sid', name);
                        return callback();
                    }
                    
                    if(!sitedata.sid) {
                        console.log('[WARN] 流程数据[%s]对应的入库数据无sid', name);
                        return callback();   
                    }
                    wfmodule.update({ _id : siteflow._id}, { $set :  { sid : sitedata.sid, 'siteDataSnap.sid' : sitedata.sid} }
                        ,function(err){
                            if(err) return callback(err);

                            console.log('为流程数据[%s]修复sid:[%s]', name, sitedata.sid);
                            callback();
                        });
                });
        }, fn);
    });
}


// 为所有已入库的数据加上sid，并查询对应的流程数据，为流程数据加上正确的sid
function fix_sfsiteplan_data_sid(fn){
    sfsiteplan.find({ sid: { $exists : false } }, function(err, sites){
        if(err) return fn(err);
        if(!sites) return fn();

        async.eachSeries(sites, function(site, callback){
            if(site.sid) return callback(new Error('site已经有sid:'+ site.sid +', _id:' + site._id));

            site.sid = new ObjectID();
            site.save(function(err){
                if(err) return callback(err);

                console.log('为数据 站点名称:%s, 增加sid:%s', site['规划站点名称'], site.sid);

                wfsite_plan_change.update(
                    { 规划站点名称 : site['规划站点名称'] , 区县 : site['区县'] },
                    { $set : { sid : site.sid , 'siteDataSnap.sid' : site.sid } },
                    { multi : true },
                    function(err, cnt){
                        if(err){
                            console.log("更行变更记录出错:", err);
                            return callback(err);
                        }
                        console.log("更新变更记录 cnt:", cnt);

                        wfsiteplan.update(
                            { 规划站点名称 : site['规划站点名称'] , 区县 : site['区县'] },
                            { $set : { sid : site.sid, 'siteDataSnap.sid' : site.sid } },
                            { multi : true },
                            function(err, cnt){
                                if(err){
                                    console.log("更行流程记录出错:", err);
                                    return callback(err);
                                }
                                console.log("更新流程记录 cnt:", cnt);

                                callback(err);
                            });
                    });
            });
        }, fn);
    });
}

// 为所有已入库的数据加上sid，并查询对应的流程数据，为流程数据加上正确的sid
function fix_sfslave_plan_data_sid(fn){
    sfslave_plan.find({ sid: { $exists : false } }, function(err, sites){
        if(err) return fn(err);
        if(!sites) return fn();

        async.eachSeries(sites, function(site, callback, getter ){
            if(site.sid) return callback(new Error('site已经有sid:'+ site.sid +', _id:' + site._id));

            site.sid = new ObjectID();
            site.save(function(err){
                if(err) return callback(err);

                console.log('为数据 站点名称:%s, 增加sid:%s', site['物业点名称'], site.sid);

                wfslave_plan_change.update(
                    { 物业点名称 : site['物业点名称'] , 区县 : site['区县'] },
                    { $set : { sid : site.sid , 'siteDataSnap.sid' : site.sid } },
                    { multi : true },
                    function(err, cnt){
                        if(err){
                            console.log("更行变更记录出错:", err);
                            return callback(err);
                        }
                        console.log("更新变更记录 cnt:", cnt);

                        wfslave_plan.update(
                            { 物业点名称 : site['物业点名称'] , 区县 : site['区县'] },
                            { $set : { sid : site.sid, 'siteDataSnap.sid' : site.sid } },
                            { multi : true },
                            function(err, cnt){
                                if(err){
                                    console.log("更行流程记录出错:", err);
                                    return callback(err);
                                }
                                console.log("更新流程记录 cnt:", cnt);

                                callback(err);
                            });
                    });
            });
        }, fn);
    });
}


// 修复勘察设计库中的数据
function fix_design_sid(fn){
    function _update_desing_module( module, callback, getter ){
        // 勘察设计库
        module.find({  }
            , function(err, sites){
                if(err) return callback(err);

                async.eachSeries(sites, function(site, sitecb){
                    var name = getter ? getter(site) : site['规划站点名称'];
                    sfsiteplan.findOne({ 规划站点名称 : name, city : site['city']}
                        , function(err, siteplan){
                            if(err) return sitecb(err);
                            if(!siteplan){
                                console.log('WARN: 站点没有对应的规划站点:[%s]', name);
                                return sitecb();
                            }
                            if( siteplan.sid.toString() === site.sid.toString() ) return sitecb();

                            module.update(
                                { _id : site._id }, 
                                { $set : { sid : siteplan.sid, 'siteDataSnap.sid' : siteplan.sid } }, 
                                function(err){
                                    if(err) return sitecb(err);

                                    console.log('更新站点设计信息 sid:[%s] 规划站点名称:[%s]'
                                        , siteplan.sid, name);
                                    sitecb();
                                });
                        });
                }, callback);
            });
    };

    async.series([
        function(callback){
            _update_desing_module( sfsite_design_hz, callback );
        },
        function(callback){
            // 勘察流程
            _update_desing_module( wfsite_investigation_hz, callback , function(site){ return site.siteDataSnap['规划站点名称']});
        },
        function(callback){
            // 设计流程
            _update_desing_module( wfsite_design_hz, callback, function(site){ return site.siteDataSnap['规划站点名称']} );
        },
        function(callback){
            // 设计流程
            _update_desing_module( wfsite_design_change_hz, callback, function(site){ return site.siteDataSnap['规划站点名称']} );
        }
    ], fn);
}


// 修复勘察设计库中的数据
function fix_sfslave_design_sid(fn){
    function _update_desing_module( module, callback , getter ){
        // 勘察设计库
        module.find({ sid: { $exists : false } }
            , function(err, sites){
                if(err) return callback(err);
                async.eachSeries(sites, function(site, sitecb){
                    var name = getter ? getter(site) : site['立项批复物业点名称'];
                    sfslave_plan.findOne({ 物业点名称 : name, 区县 : site['区县']}
                        , function(err, siteplan){
                            if(err) return sitecb(err);
                            if(!siteplan){
                                console.log('WARN: 站点没有对应的规划站点:[%s]', name);
                                return sitecb();
                            }

                            module.update(
                                { _id : site._id }, 
                                { $set : { sid : siteplan.sid, 'siteDataSnap.sid' : siteplan.sid } }, 
                                function(err){
                                    if(err) return sitecb(err);

                                    console.log('更新站点设计信息 sid:[%s] 规划站点名称:[%s]'
                                        , siteplan.sid, name);
                                    sitecb();
                                });
                        });
                }, callback);
            });
    };

    async.series([
        function(callback){
            _update_desing_module( sfslave_design, callback );
        },
        function(callback){
            // 设计流程
            _update_desing_module( wfslave_design, callback, function(site){ return site.siteDataSnap['立项批复物业点名称']} );
        },
        function(callback){
            // 设计变更流程
            _update_desing_module( wfslave_design_change, callback, function(site){ return site.siteDataSnap['立项批复物业点名称']} );
        },
    ], fn);
}

// 修复规划数据的数据状态，逻辑如下:
//   如果发现勘察流程中有数据，一律更新成“归档”，否则如果”变更“流程中有记录，更新成变更中，其他的全部更新为“流程完成”
function fix_sfsiteplan_datastat(fn){

    // 更新数据状态，如果已经正确，直接退出
    function _update_siteplan_datastat(site, stat, fn){
        //发现勘察流程中有数据
        if(site['数据状态'] === stat) return fn();

        var sid = site['sid'];
        sfsiteplan.update({ _id : site._id }
            , { $set : { '数据状态' : stat } }
            , function(err){
                if(err){
                    console.log('更新 sid:%s, 数据状态到:%s 出错:%s', sid, stat, err );
                }else{
                    console.log('更新 sid:%s 数据状态为:%s', sid, stat );
                }
                fn(err);
            });
    }

    sfsiteplan.find({}, function(err, sites){
        if(err) return fn(err);

        async.eachSeries(sites, function(site, callback){
            var datastat = site['数据状态'];

            var sid = site.sid;
            wfsite_plan_change.find({ sid : sid, wfstate : { $ne : '流程结束' } }
                ,function(err, planchange){
                if(err) return callback(err);   

                if(planchange.length > 0){
                    // 否则如果”变更“流程中有记录，更新成变更中
                    _update_siteplan_datastat( site, '变更中', callback );
                }else{
                    wfsite_investigation_hz.find({ sid : sid }, function(err, invsite){
                        if(err) return callback(err);

                        if(invsite.length > 0 ){
                            _update_siteplan_datastat( site, '归档', callback );
                        }else{
                            // 其他的全部更新为“流程完成”
                            _update_siteplan_datastat( site, '流程完成', callback );      
                        }
                    });
                } 
            });

        }, function(err){
            if(err){
                console.log('更新状态出错：', err);
            }else{
                console.log('更新状态完成：', err);
            }
            fn(err);
        });
    });
}

// ============================= 下面是单元测试用的代码 ================================
var isme = require('../sharepage.js').isme;
var tester = {
    // 所有宏站设计相关流程到规划库中查找sid
    run_fix_design_sid : function(){
        fix_design_sid(function(err){
            if(err) console.trace(err);
            console.log('修改流程数据完成');
        });
    },

    // 所有室分配套设计相关流程到规划库中查找sid
    run_fix_sfslave_design_sid : function(){
        fix_sfslave_design_sid(function(err){
            if(err) console.trace(err);
            console.log('修改流程数据完成');
        });
    },    

    run_fix_wfplan_hz_sid : function(){
        fix_wfplan_sid(wfsiteplan, function(err){
            if(err) console.trace(err);
            console.log('修改流程数据完成');
        });
    },

    // 流程中没有sid的，到库中查询一次
    run_fix_wfsiteplan_sid_with_data : function(){
        fix_wf_sid_with_data(wfsiteplan, sfsiteplan, function(err){
            if(err) console.trace(err);
            console.log('修改流程数据完成');
        });
    },

    // 
    run_fix_wfsiteplan_change_sid_with_data : function(){
        fix_wf_sid_with_data(wfsite_plan_change, sfsiteplan, function(err){
            if(err) console.trace(err);
            console.log('修改流程数据完成');
        });
    },

    run_fix_wfplan_sfslave_sid : function(){
        fix_wfplan_sid(wfslave_plan, function(err){
            if(err) console.trace(err);
            console.log('修改流程数据完成');
        });
    },

    run_fix_sfsiteplan_data_sid : function(){
        fix_sfsiteplan_data_sid(function(err){
            if(err) console.trace(err);
            console.log('修改流程数据完成');
        });
    },

    run_fix_sfsiteplan_datastat : function(){
        fix_sfsiteplan_datastat(function(err){
            if(err) console.trace(err);
            console.log('修改规划状态数据完成');
        });
    },

    //找出已经开始勘察设计，但是还未变更结束的数据
    get_conflict_siteplan_change_and_investigation : function(){
        wfsite_investigation_hz.find({}, function(err, designsites){
            if(err) return fn(err);

            async.eachSeries(designsites, function(site, callback){
                wfsite_plan_change.find({ sid : site.sid, wfstate : { $ne : '流程结束' } }
                    ,function(err, planchange){
                        if(err) return callback(err);

                        if(planchange.length > 0){
                            // 否则如果”变更“流程中有记录，更新成变更中
                            console.log('发现一个状态为勘察设计，但是启动了规划变更的站点 sid:%s 规划名称: '
                                , site.sid, site['规划站点名称']);
                        }
                        callback(); 
                    });
            },function(err){
                if(err) console.trace(err);

                console.log('完成');
            });
        });
    },

    //找出已经开始勘察设计，但是规划状态不为“归档"的数据
    get_conflict_siteplan_stat_and_investigation : function(){
        wfsite_investigation_hz.find({}, function(err, designsites){
            if(err) return fn(err);

            async.eachSeries(designsites, function(site, callback){
                sfsiteplan.findOne({ sid : site.sid }
                    ,function(err, plansite){
                        if(err) return callback(err);

                        if(plansite){
                            // 否则如果”变更“流程中有记录，更新成变更中
                            if(plansite['数据状态'] != '归档'){
                                console.log('发现一个状态为勘察设计，但是规划库中的状态不为[归档]的站点 sid:%s 规划名称: %s, 数据状态:%s'
                                    , site.sid, plansite['规划站点名称'], plansite['数据状态']);    
                            }
                        }else{
                            console.log('发现一个勘察设计中的站点，没有规划数据 sid:%s 规划名称: '
                                , site.sid, site['规划站点名称']);
                        }
                        callback(); 
                    });
            },function(err){
                if(err) console.trace(err);

                console.log('完成');
            });
        });
    },

    run_fix_sfslave_plan_data_sid : function(){
        fix_sfslave_plan_data_sid(function(err){
            if(err) console.trace(err);
            console.log('修改流程数据完成');
        });
    },

    testImportCSV: function(){
        exports.importCSV ("../uploads/td_tmpl.csv", 'td', function(err, cnt){
            if(err) return console.log("import err", err);
            console.log("import success, count:" + cnt );
        });
    },

  testFixPlanName : function(){
    exports.fix_plan_name_change(
        { "规划站点名称": "云计算", "city": "淮南" }, 
        { "规划站点名称": "徐马村", "city":"淮南", "区县":"淮南" },
        function(err){
            console.log('执行完成。');
        }
    )
  },

  testFixCityKey : function(){
    exports.fix_city_key(function(err){
        console.log('执行完成。');
    });
  },

  testGenId : function(){
      //var id = new ObjectID();
    var id = new ObjectID().generate();
    console.log(id);
  }
}

if(isme(__filename)){
  if(process.argv.length > 2 && isme(__filename)){
    testfn = process.argv[2];
    console.log("run test:%s", testfn);

    if(tester[testfn]){
      tester[testfn]();
    }
  }else{
    var testcmd = [];
    for(cmd in tester)
      testcmd.push(cmd);

    console.log('sys_utilitiesdb.js '+ testcmd.join('|'));
  }
}

