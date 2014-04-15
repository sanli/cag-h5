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

 var gm = require('gm'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    updateinfo = require('./data/paintdb.js').updateinfo,
    queryfile = require('./data/paintdb.js').queryfile;

/**
 * 图片信息分割器
 */
function cropper( outdir, options ){
    var opt = options || { 
            // 是否覆盖生成文件，
            //   false : 已经生成的文件不再重复生成
            //   true : 重复生成文件
            overwrite : false
        };

    var maxlevel = 18,
        minlevel = 13,
        tilesize = 256,
        thumbsize = 128;

    // 生成合适的缩略图，生成适合放到128px的盒子中的图片
    function resizethumb(fileinfo, fn){
        var dir = outdir + '/' + fileinfo._id ,
            thumbfile = dir + '/tb.jpg', 
            width = fileinfo.size.width, 
            height = fileinfo.size.height,
            resizeWith = Math.floor(width > height ? width * ( 128 / height) : thumbsize); 

        mkdirp.sync(dir);

        //不覆盖生成已经存在的文件
        if(!opt.overwrite && fs.existsSync(thumbfile)){
            console.log('文件:%s 已经存在，跳过...', thumbfile);
            return fn(null, thumbfile);
        }

        gm(fileinfo.sourcePath)
        .resize(resizeWith)
        .write(thumbfile, function (err) {
            if (err) {
                console.trace(err);
                return fn(err);
            }

            fn(null, thumbfile);
        });
    }

    // 缩放文件, 生成临时文件，返回临时文件名称
    function resizelevel(fileinfo, level, fn){
        var dir = outdir + '/' + fileinfo._id + '/' + level ,
            resizefile = dir + '/temp.jpg' ,
            width = fileinfo.size.width, 
            zoom = Math.pow(2, maxlevel - level ),
            resizeWith = Math.floor(width / zoom) ;

        //如果文件夹不存在就创建文件夹
        mkdirp.sync(dir);

        //不覆盖生成已经存在的文件
        if(!opt.overwrite && fs.existsSync(resizefile)){
            console.log('文件:%s 已经存在，跳过...', resizefile);
            return fn(null, resizefile);
        }

        gm(fileinfo.sourcePath)
        .resize(resizeWith)
        .write(resizefile, function (err) {
            if (err) {
                console.trace(err);
                return fn(err);
            }

            fn(null, resizefile);
        });
    };

    //对缩放后的文件进行分割
    function cropfile(fileinfo, resizefile, level, fn){
        var size = fileinfo.size,
            zoom = Math.pow(2, maxlevel - level );
            width = Math.floor(size.width / zoom),
            height = Math.floor(size.height / zoom),
            wcnt = Math.ceil(width / tilesize ), 
            hcnt = Math.ceil(height / tilesize ),
            wextend = wcnt * tilesize,
            hextend = hcnt * tilesize;;

        var taskqueue = [];
        for(i = 0 ; i<= wcnt - 1; i++){
            for(j = 0 ; j <= hcnt - 1; j ++){
                taskqueue.push({
                    file: resizefile,
                    cropArea: [tilesize, tilesize, tilesize * i, tilesize * j],
                    outfile: outdir + '/' + fileinfo._id + '/' + level + '/' + i + '_' + j +'.jpg'
                });
            }
        }

        async.eachSeries(taskqueue, function(task, callback){
            console.log("分切文件：%s, 生成：%s", task.file, task.outfile);
            var args = task.cropArea;

            //不覆盖生成已经存在的文件
            if(!opt.overwrite && fs.existsSync(task.outfile)){
                console.log('文件:%s 已经存在，跳过...', task.outfile);
                return callback(null);
            }

            gm(task.file)
            .extent(wextend, hextend)
            .crop( args[0], args[1], args[2], args[3] )
            .write( task.outfile , function (err) {
                if (err) {
                    console.trace(err);
                    return callback(err);
                }
                callback();
            }); 
            
        }, function(err){
            if(err) console.trace(err);

            console.log("处理完成")
            fn(err);
        });
    };

    // 对文件进行切割
    function crop(fileinfo, fn){
        var size = fileinfo.size,
            levels = [13,14,15,16,17,18];

        // 生成缩略图
        resizethumb(fileinfo, function(err, tbfile){
            if(err) console.trace("生成缩略图出错", err);

            console.log('生成缩略图完成:%s', tbfile);
        });

        // 分层切割文件
        async.eachSeries(levels, function(level, callback){
            resizelevel(fileinfo, level, function(err, resizefile){
                if(err) return callback(err);

                console.log("resize file to :%s level:%d", resizefile, level);
                cropfile(fileinfo, resizefile, level, function(err){
                    if(err) {
                        console.log("剪切文件出错:%s", err);
                    }else{
                        console.log("剪切文件完成:%s level:%d", fileinfo.filename, level);    
                    }
                    
                    fs.unlinkSync(resizefile);
                    callback(null);
                });
            });
        }, function(err){
            if(err)
                console.trace(err);

            console.log('完成文件各个缩放级别的切割:%s', fileinfo.filename);
            fn(err);
        });
    }

    return {
        crop : crop,
        resizethumb : resizethumb
    };
}

/**
 * 图片信息抓取工具
 */
var path = require('path'),
    fs = require('fs');
function getfileinfo(filename, fn){
	var gmfile = gm(filename),
        basename = path.basename(filename),
        sourcePath = fs.realpathSync(filename),
		info = { filename : basename , sourcePath : sourcePath },
        cmd = ['size','format'/*,'depth','color','res'*/,'filesize'/*,'identify','orientation'*/] ;

    async.eachSeries(cmd, function(operator, callback){
        gmfile[operator](function(err, result){
            if(err)
                return callback(err);
            console.log("do %s", operator);

            info[operator] = result;
            callback();
        });
    }, function(err){
        if(err){
            console.trace(err);
            fn(err);
        }

        fn(null, info);
    })
}

function grapfileinfo(dir, fn){
    var files = fs.readdirSync(dir);
    var jpgs = files.filter(function(filename){
        return /.*\.jpg$/.test(filename);
    });

    async.eachSeries(jpgs, function(jpgfile, callback){
        var target = dir + "/" + jpgfile;
        console.log('读取文件信息：%s', target); 
        getfileinfo(target , function(err, info){
            if(err) {
                console.trace(err);
                return fn(err);
            }

            updateinfo(info, function(err){
                callback(err);
            })
        });
    }, function(err){
        if(err) return fn(err);

        console.log('读取文件信息完成，一共扫描：%d个文件', jpgs.length);
        fn();
    });
}


/**
 * 图片信息导出为json文件，供静态网页使用，需要扫描输出目录，只有已经输出切割内容的文件才输出到
 * fileinfo.json中.
 * @outdir : 输出文件的位置，
 */
var extend = require('node.extend');
function generateFileinfo(outdir, fn){
    var croped = [];
    queryfile({active : { $ne : false}  }, function(err, fileinfos){
        if(err) return fn(err);

        fileinfos.forEach(function(fileinfo){
            if(fs.existsSync(outdir + '/' + fileinfo._id)){
                var  outfileinfo = extend(fileinfo.toObject());
                delete outfileinfo.sourcePath;
                console.log(outfileinfo);
                croped.push(outfileinfo);
            }
        });
        var out = JSON.stringify(croped);
        fs.writeFileSync(outdir + '/fileinfo.json', out);
        var jsonp = "var cagstore = " + out + ";"; 
        fs.writeFileSync(outdir + '/fileinfo.js', jsonp);
        fn(null, out);
    });
}


/**
 * 输出整个静态化site到七牛云存储上
 */
function releaseSite(){
    // 切块文件

    // 刷新生成文件Info

    // 发布到七牛云存储上

}

// ============================= 下面是单元测试用的代码 ================================
var isme = require('./sharepage.js').isme;

var tester = {
    testGetfileinfo: function(){
		getfileinfo('./testimg/t1.jpg', function(err, info){
            console.log(info);
        }); 
    },

    updateZBGinfo : function(){
        grapfileinfo('/Users/sanli/Desktop/中华珍宝馆/馆藏珍品', function(){
            console.log('执行结束');
        })
    },

    updateZGCSinfo : function(){
        grapfileinfo('/Users/sanli/Desktop/中华珍宝馆/中国传世名画超清图', function(){
            console.log('执行结束');
        })
    },

    testCropper : function(){
        var crop = cropper('./cagstore');

        queryfile({_id : '5343c717f883b828efa7a16f'}, function(err, fileinfos){
            fileinfos.forEach(function(fileinfo){
                crop.crop(fileinfo, console.log);
            }); 
        });
    },

    cropall : function(){
        var crop = cropper('./cagstore');

        queryfile({ sourcePath : RegExp('^/root') }, function(err, fileinfos){
            async.eachLimit(fileinfos, 2, function(fileinfo, callback){
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

    testThumb : function(){
        var crop = cropper('./cagstore');

        queryfile({_id : '5343c5c1f883b828efa79fe1'}, function(err, fileinfos){
            fileinfos.forEach(function(fileinfo){
                crop.resizethumb(fileinfo, function(err, thumbfile){
                    if(err) console.log('生成缩略图失败');

                    console.log('生成缩略图:%s', thumbfile);
                });
            }); 
        });
    },

    testGenerateFileinfo : function(){
        generateFileinfo('./cagstore-online', function(err, str){
            if(err) console.trace(err);

            console.log(str);
        })
    }
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