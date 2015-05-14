// importcvs.js
var Collection = require('mongodb').Collection,
  Connection = require('mongodb').Connection,
  ObjectID = require('mongodb').ObjectID,
  debug = require('util').debug,
  inspect = require('util').inspect,
  Data = require('../mongo.js'),
  DBOP = require('../mongo.js').DBOP,
  csv = require('csv'),
  http = require('http'),
  isme = require('../sharepage.js').isme,
  extend = require('node.extend'),
  iconv = require('iconv-lite'),
  _us = require('underscore');

// ============ CellDataImporter ===============
function Importer(filename, args, opt){
    var self = extend({ encodeFrom : 'gbk' , encodeTo: 'utf8' }, opt),
        ids = [],
        args = args || {};

    if(filename){
        if(self.encodeFrom !== self.encodeTo){
          var input = fs.createReadStream(filename).pipe(iconv.decodeStream('gbk'));  
        }else{
          var input = fs.createReadStream(filename);
        }
    }
    
    self.import = function(fn, stateUpdater){
        input.on('error', function(err){
            console.trace(err);
            fn(err);
        });

        csv()
        .from(input)
        .transform(function(record, index, callback){
            if(index === 0){
                //跳过表头行
                return callback();
            }
            // 输出导入状态
            // if(stateUpdater){
            //   stateUpdater(record, index);
            // }

            var obj = self.createObjByType(record, index);
            extend(obj, args);
            self.updateObject(obj, function(err, objId){
                    if(err) console.log(err);
                    ids.push(objId);
                    callback(err);
                }, index, stateUpdater);
        }, {parallel: 1})
        .on("end", function (count) {
            console.log("importcsvfile success filename:[%s]", filename);
            fn(null, count - 1, ids);
        })
        .on('error',function(err){
            console.log("importcsvfile error:" + err.message);
            fn(err);
        });
    };
    return self;
}
exports.Importer = Importer ;

// 导入单行数据
function LineImporter(args, opt){
    var self = extend({}, opt),
        args = args || {};

    // 导入数据
    self.import = function(data, fn){
        /*input.on('error', function(err){
            console.trace(err);
            fn(err);
        });*/
        // 数据需要是有效的
        try{
            var dataobj = JSON.parse(data);   
        }catch(e){
            return fn(e);
        }

        var obj = self.createobj( dataobj );
        //extend(obj, args);
        // 导入数据
        self.updateObject(obj, function(err, objId){
                if(err) console.log(err);
                fn(err);
            });
    };
    return self;
}
exports.LineImporter = LineImporter ;

// ==========================================================================================
// 导入验证器
// ==========================================================================================
// 数据验证工具
// filename : 数据文件
// fields : 字段定义，字段名 ＋ '*', *表示必填项
function createDataValidator( filename, fields, args, formatfn){
    var enumdb = require('../sharepage/sys/data/sys_enumdb');
    var self = Importer( filename, {}, null ),
        formatfn = formatfn || function(obj){ obj.toString() };

    // 必填验证，如果传入的值不为空,返回true,否则返回false,并把错误内容写入context
    function _requirment(value){
        if(value) return [ true ];
        return [ false, '字段值不能为空'];
    };

    function _number(value){
        if(!value) return [true];
        if (!isNaN(value)){
            return parseFloat(value) >= 0 ? [true] : [false, '需要是有效的数字:大于0.'];
        }else{
            return  [false, '需要是有效的数字'];
        }
        //return isNaN(value) ? [false, '需要是有效的数字'] :  [true];
    };

    // 数据字典验证，导入的值必须是枚举类型中的值
    function _createEnumChecker(enums){
        var posibles = enums.join(',');
        return function(v){
            if(!v) return [true];
            return enums.indexOf(v) < 0 ? [false, '值[' + v + ']无效，可能值:' + posibles ] : [ true ]
        }
    };

    var valideRules = {},
        fieldnames = [];
    self.valideRules = valideRules;
    self.fieldnames = fieldnames;

    fields.forEach(function(field, i){
        //如果字段以'*'结尾，则为必填字段
        var rules = [];

        // 非空测试
        if(/\*$/.test(field)){
            rules.push(_requirment);
            field = field.replace(/\*$/, '');   
        }

        // 如果字段以#结尾，则为数字字段
        if(/#$/.test(field)){
            rules.push(_number);
            field = field.replace(/#$/, '');   
        }

        // 数据字典测试
        if(args.module && args.table){
            var enums = enumdb.getEnum(args.module, args.table, field);
            if(enums){
                rules.push(_createEnumChecker(enums));
            }
        }

        // 设置特殊字段检查
        if(args.checkRules && args.checkRules[field]){
            rules.push(args.checkRules[field]);
        }
        fieldnames.push(field);
        valideRules[field] = rules;
    });

    // 根据类型创建定义，从CSV文件的一行中创建对象
    self.createObjByType = function(record, line){
        var result = extend({});

        record.forEach(function(field, index){
            var fieldname = fieldnames[index];
            field = field.trim();

            result[fieldname] = field;
        });
        return result;
    };

    // 执行对象验证
    self.updateObject = function(obj, callback, index, stateUpdater){
        var context = [],
            keys = _us.keys(obj);
        if(keys.length !== fieldnames.length){
            stateUpdater( false
                , '字段个数不匹配,期望:' + fieldnames.length + ' 实际:' + keys.length
                , formatfn(obj), index);
            return callback();
        }

        keys.forEach(function(key, i){
            if(valideRules[key]){
                for(var ri = 0 ; ri <= valideRules[key].length - 1; ri++){
                    var rulefn = valideRules[key][ri],
                        chkres = rulefn(obj[key], obj);
                    if(!chkres[0]){
                        context.push( '[' + key +']' + chkres[1]);
                        break;
                    }
                }
            };
        });
        stateUpdater( context.length === 0, context.join(','), formatfn(obj), index);
        return callback();
    };
    return self;
};
exports.createDataValidator = createDataValidator;

//单行数据的验证工具，引用批量导入验证工具的规则完成验证
exports.createLineDataValidator = function(fields, args, formatfn){
    var self = LineImporter(args),
        helper = createDataValidator('', fields, args, formatfn),
        valideRules = helper.valideRules,
        fieldnames = helper.fieldnames;

        debugger;
        self.createobj = function(dataobj){
            return helper.createObjByType(dataobj,0);    
        }

        self.updateObject = function(obj, fn){
            var context = [],
            keys = _us.keys(obj);
            if(keys.length !== fieldnames.length){
                context.push('1,字段个数不匹配,期望:' + fieldnames.length + ' 实际:' + keys.length);
                return fn(new Error(context.join(';')));
            }

            keys.forEach(function(key, i){
                var msg = [];
                if(valideRules[key]){
                    for(var ri = 0 ; ri <= valideRules[key].length - 1; ri++){
                        var rulefn = valideRules[key][ri],
                            chkres = rulefn(obj[key], obj);
                        if(!chkres[0]){
                            msg.push( '[' + key +']' + chkres[1]);
                            break;
                        }
                    }
                    if(msg.length > 0) context.push( (i + 1) + ',' + msg.join(' ').replace(',', ''));
                };
            });
            fn( context.length === 0 ? null : new Error(context.join(';')));
        };
    return self;
}

// ===================== 一些其他的导入方法 ===================== 




// ========================= 下面是单元测试用的代码 ====================
var tester = {
    testValidator : function(){
        var validator = createDataValidator(
            '/Users/sanli/Desktop/sfguihua/hz-plan-test_gbk.csv'
            ,['规划站点名称*', '网络类型*', '归属地市*', '区县*', '建设方式*', '天面建设方式*', '经度*', '纬度*'
              , '覆盖区域*', '覆盖场景', '交通场景', '建设需求类型', '天线挂高', '频段', '载频数', '小区数'
              , '天面类型', '备注']
            , {}
            ,function(data){ return data['规划站点名称']});

            validator.import(function(err, count, cellIds){
                if(err) {
                    console.trace("导入/验证宏站规划数据发生错误", err);
                };
                console.log('验证完成');
            },function(){
                console.log(arguments);
            });
    }
}


if( isme(__filename) ){
    if( process.argv.length > 2 ){
        testfn = process.argv[2];
        console.log("run test:%s", testfn);
        console.log("连接已建立");
        tester[testfn]();    
    }else{
        var testcmd = [];
        for( cmd in tester )
            testcmd.push(cmd);

        console.log('mongo.js '+ testcmd.join('|'));
    }
}