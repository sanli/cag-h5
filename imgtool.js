// 图像处理工具
/**
 * 分层缩放，并切图，数据保存到mongoDB
 * 目录结构如下：
 *   分块图：
 *      {image_root}/{file_uuid}/level/{x}_{y}.jpg
 *   预览图：
 *      {image_root}/file_uuid/snap.jpg
 *   预览图进行等比缩放，宽度或者高度固定为256
 * 
 *   image_root = public/cag/
 * 
 * MongoDB保存结构：
 *   { _id , filename, desc,  maxlevel, minlevel, info }
 *
 * 其中的 _id就是file_uuid
 * 
 * maxlevel从12级开始，每上升一级，size缩小一半，size 小于512后结束
 */

 var gm = require('gm').subClass({ imageMagick: true }),
    async = require('async'),
    mkdirp = require('mkdirp'),
    paintdb = require('./data/paintdb.js'),
    inspect = require('util').inspect,
    updateFileInfo = require('./data/paintdb.js').updateFileInfo,
    updatePaintingInfo = require('./data/paintdb.js').updatePaintinginfo,
    queryfile = require('./data/paintdb.js').queryfile,
    graper = require('./imgtool/graper.js'),
    calcScaleLevel = require('./imgtool/commons.js').calcScaleLevel,
    cropper = require('./imgtool/croper.js');

/**
 * 图片信息导出为json文件，供静态网页使用，需要扫描输出目录，只有已经输出切割内容的文件才输出到
 * fileinfo.json中.
 * 
 * @outdir : 输出文件的位置，
 */
var extend = require('node.extend');
function generateFileinfo(outdir, fn){
    var croped = [];
    queryfile( {active : { $ne : false}  }
        , { files : false }
        , { author : 1 }
        , function(err, fileinfos){
            if(err) return fn(err);

            fileinfos.forEach(function(fileinfo){
                if(fs.existsSync(outdir + '/' + fileinfo._id)){
                    var  outfileinfo = extend(fileinfo.toObject());
                    delete outfileinfo.files;
                    var metaFilename = outdir + '/' + fileinfo._id + '/meta.json' ;
                    var out = JSON.stringify(outfileinfo);
                    fs.writeFileSync(metaFilename, out);
                    console.log('输出文件 meta info:%s', metaFilename);
                    croped.push(outfileinfo);
                }
            });

            var out = JSON.stringify(croped);
            fs.writeFileSync(outdir + '/fileinfo.json', out);
            console.log('输出json文件:%s', outdir + '/fileinfo.json');

            var jsonp = "var cagstore = " + out + ";"; 
            fs.writeFileSync(outdir + '/fileinfo.js', jsonp);
            console.log('输出JSONP文件:%s', outdir + '/fileinfo.js');

            var nodejs = "exports.cagstore = " + out + ";"; 
            fs.writeFileSync( 'cagstore.js', nodejs);
            console.log('输出nodejs文件:%s', 'cagstore.js');

            fn(null, out);
        });
}

/**
 * 导入制定文件到珍宝馆
 * paintingName : 藏品名称
 */
function processPainting( cond , fn ){
    // 1. 读取文件信息
    graper.grapfileinfo('/Users/sanli/Desktop/中华珍宝馆/高清精选', function(){
        console.log('STEP1 : 提取文件信息结束，开始分析作品信息...');

        // 2. 提取画作信息
        graper.grapPainting('/Users/sanli/Desktop/中华珍宝馆/高清精选', function(){
            console.log('STEP2 : 分析作品信息结束，开始分层切分...');

            // 3. 执行切分    
            //var crop = cropper.createImageMagickCropper('./cagstore'),
            var cagstoreFolder = '/Users/sanli/Documents/workspace/cag-h5/cagstore',
                crop = cropper.createPSCropper(cagstoreFolder),
                tasks = [];

            queryfile(cond, function(err, fileinfos){
                if(fileinfos.length === 0 ) return fn();

                console.log('STEP3 : 生成切分脚本...');
                async.eachSeries(fileinfos, function(fileinfo, callback){
                    crop.crop(fileinfo, function(err, outfile){
                        if(err) console.log('切分文件出错，跳过当前文件',err);

                        tasks.push({script: outfile, info : fileinfo});
                        callback();
                    });
                }, function(err){
                    if(err) {
                        console.trace(err);
                        return fn(err);
                    }

                    console.log('STEP4 : 组合新文件切分脚本');
                    var taskstr = [];
                    tasks.forEach(function(task){
                        var snapfile = cagstoreFolder + '/' + task.info._id + '/tb.jpg';
                        if(!fs.existsSync(snapfile)){
                            taskstr.push('//' + task.info.paintingName);
                            taskstr.push('$.evalFile("' + task.script + '");');
                        }
                    });
                    var tasksFile = cagstoreFolder + '/tasks_' + new Date().toISOString() + '.jsx'
                    fs.writeFileSync(tasksFile, taskstr.join('\n'));
                    console.log('执行完成,请使用ExtendScript工具运行任务文件:[' + tasksFile + ']');
                    console.log('执行完成后,请使用jpegoptim工具对生成的图片进行无损压缩');
                    fn();
                }); 
            });
        });        
    });
};

// ============================= 下面是单元测试用的代码 ================================
var isme = require('./sharepage.js').isme;
var tester = {
    // 导入藏品到珍宝馆存储系统
    importFile : function(){
        processPainting({}, function(err){
            if(err) console.log('发生错误:', err);
            console.log('执行结束');
        });
    },

    // 更新特定文件信息
    updateSelectedFileInfo : function(){
        grapfileinfo('/Users/sanli/Desktop/中华珍宝馆/高清精选', function(){
        //grapfileinfo('/root/cag/中华珍宝馆/高清精选', function(){
            console.log('执行结束');
        }, /^[明清元宋南北]/);
    },

    grapJXInfoPainting : function(){
        grapPainting('/Users/sanli/Desktop/中华珍宝馆/高清精选', function(){
        //grapPainting('/root/cag/中华珍宝馆/高清精选', function(){
            console.log('执行结束');
        })
    },

    cropall : function(){
        var crop = cropper('./cagstore');

        queryfile({ }, function(err, fileinfos){
            async.eachSeries(fileinfos, function(fileinfo, callback){
                crop.crop(fileinfo, function(err){
                    if(err) console.log('切分文件出错，跳过当前文件');
                    callback();
                });
            }, function(err){
                if(err) console.trace(err);

                console.log('执行完成,请使用jpegoptim工具对生成的图片进行无损压缩');
            }); 
        });
    },

    generateAllFileinfo : function(){
        generateFileinfo('./cagstore', function(err, str){
            if(err) console.trace(err);

            console.log("输出完成");
        })
    }

    // ===================================================
    // 以下是测试用的函数
    // ===================================================
}

if(isme(__filename)){
  if(process.argv.length > 2){
    testfn = process.argv[2];
    console.log("run test:%s", testfn);

    if(tester[testfn]){
        tester[testfn]();
    }
  }else{
    var testcmd = [];
    for(cmd in tester)
      testcmd.push(cmd)

    console.log( __filename + ' '+ testcmd.join('|'));
  }
}