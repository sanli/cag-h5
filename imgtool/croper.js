//croper.js
var gm = require('gm').subClass({ imageMagick: true }),
    async = require('async'),
    mkdirp = require('mkdirp'),
    paintdb = require('../data/paintdb.js'),
    inspect = require('util').inspect,
    updateFileInfo = require('../data/paintdb.js').updateFileInfo,
    updatePaintingInfo = require('../data/paintdb.js').updatePaintinginfo,
    queryfile = require('../data/paintdb.js').queryfile,
    graper = require('./graper.js'),
    calcScaleLevel = require('./commons.js').calcScaleLevel;

/**
 * 基于ImageMagic的图片分割器，对小文件速度比较快。
 * 但是处理超大文件（x > 50000 ）非常慢,对于大文件需要使用PSCropper
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

    // 生成合适的缩略图，生成适合放到 height : 128px 的盒子中的图片
    function resizethumb(fileinfo, fn){
        var dir = outdir + '/' + fileinfo._id ,
            thumbfile = dir + '/tb.jpg', 
            width = fileinfo.size.width, 
            height = fileinfo.size.height,
            resizeWith = Math.floor(width > height ? width * ( 128 / height) : thumbsize); 

        mkdirp.sync(dir);

        var size = { width : resizeWith > 460 ? 460 : resizeWith , height : Math.round(( resizeWith / width ) * height) }
        //不覆盖生成已经存在的文件
        if(!opt.overwrite && fs.existsSync(thumbfile)){
            console.log('文件:%s 已经存在，跳过...', thumbfile);
            return fn(null, thumbfile, size);
        }

        console.log(fileinfo.files);
        var filename = fileinfo.files[0].sourcePath;
        resizer = gm(filename)
        .resize(resizeWith)

        if(resizeWith > 460)
            resizer.crop(460, 128, resizeWith - 460, 0);

        resizer.interlace('Plane')
        .quality(80)
        .unsharp(0, 0.75, 0.75, 0.008)
        .strip();

        resizer.write(thumbfile, function (err) {
            if (err) {
                console.trace(err);
                return fn(err);
            }

            fn(err, thumbfile, size)
        });
    };

    // 缩放文件, 生成临时文件，返回临时文件名称
    function resizelevel(fileinfo, idx, level, fn){
        var dir = outdir + '/' + fileinfo._id + '/' + level ,
            file = fileinfo.files[idx],
            sourcePath = file.sourcePath,
            width = file.size.width, 
            zoom = Math.pow(2, maxlevel - level ),
            resizeWith = Math.floor(width / zoom),
            ext = resizeWith < 60000 ? 'jpg' : 'tif',
            resizefile = outdir + '/' + fileinfo._id + '/temp_'+ level + '_' + idx +'.' +  ext ;

        //如果文件夹不存在就创建文件夹
        mkdirp.sync(dir);

        console.log("生成缩小图, resizefile:%s, level:%s resizeWith:%s, zoom:%s", resizefile, level, resizeWith, zoom);
        //不覆盖生成已经存在的文件
        if(!opt.overwrite && fs.existsSync(resizefile)){
            console.log('文件:%s 已经存在，跳过...', resizefile);
            return fn(null, resizefile);
        }

        gm(sourcePath)
        .interlace('Plane')
        .quality(80)
        //.unsharp(0, 0.75, 0.75, 0.008)
        .strip()
        .resize(resizeWith)
        .write(resizefile, function (err) {
            if (err) {
                console.trace(err);
                return fn(err);
            }

            fn(null, resizefile);
        });
    };

    // 计算当前文件在整个图块中的开始位置
    function getPrefixDelta(fileinfo, idx, zoom){
        if(idx === 0) return 0;

        var prefix = 0;
        for(i = 0 ; i< idx; i++){
            console.log(fileinfo.files[i].size.width);
            prefix += fileinfo.files[i].size.width ;
        }

        var res = Math.round( ( prefix / zoom ) / tilesize);
        console.log("prefix:%s, idx:%s, zoom:%s, startXtile:%s", prefix, idx, zoom, res);
        return res;
    };

    //对缩放后的文件进行分割
    function cropfile(fileinfo, idx, resizefile, level, fn){
        debugger;
        console.log("cropfile.length:%s idx:%s", fileinfo.files.length, idx );
        var file = fileinfo.files[idx],
            size = file.size,
            zoom = Math.pow(2, maxlevel - level ),
            width = Math.floor(size.width / zoom),
            height = Math.floor(size.height / zoom),
            wcnt = Math.ceil(width / tilesize ), 
            hcnt = Math.ceil(height / tilesize ),
            wextend = wcnt * tilesize,
            hextend = hcnt * tilesize,
            startXtile = getPrefixDelta(fileinfo, idx, zoom);

        // 如果分切目录已经存在就跳过，否则进行分切
        console.log("生成分块图, resizefile:%s, level:%s startXtile:%s", resizefile, level, startXtile);
        //不覆盖生成已经存在的文件
        var firstTile = outdir + '/' + fileinfo._id + '/' + level + '/' + startXtile + '_0.jpg';
        if(!opt.overwrite && fs.existsSync(firstTile)){
            console.log('分块文件:%s 已经存在，跳过...', firstTile);
            return fn();
        }

        // 为了批量生成切片文件，需要解决gm的一个bug, args.js文件中
        // return this.out("-crop", w + "x" + h + "+" + (x || 0) + "+" + (y || 0) + (percent ? '%' : ''));
        // 替换为
        // return this.out("-crop", w + "x" + h + "+" + ( x ? ( x + "+" ) : "" ) + ( y ? y : "" ) + (percent ? '%' : ''));
        // 参考：https://github.com/aheckmann/gm/issues/442
        gm(resizefile)
        .interlace('Plane')
        .background('#FFFFE0')
        .extent(wextend, hextend)
        .crop( 256, 256 )
        .strip()
        .set('filename:tile', '%[fx:page.x/256+' + startXtile + ']_%[fx:page.y/256]')
        .write(outdir + '/' + fileinfo._id + '/' + level + '/' + '%[filename:tile].jpg', function (err) {
            if (err) {
                console.trace(err);
                return fn(err);
            }

            fn();
        });
    };

    // 对文件进行切割
    function crop(fileinfo, fn){
        //不覆盖生成已经切割过的文件
        var targetdir = outdir + '/' + fileinfo._id,
            file = fileinfo.files[0],
            sourcePath = file.sourcePath;
        // 生成jpg.html是整个过程的最后一步，如果没有生成jpg.html，判断为
        if(!opt.overwrite && fs.existsSync(targetdir + '/jpg.html')){
            console.log('文件:%s 已经切割，跳过...', sourcePath );
            return fn(new Error('文件: ' + sourcePath + ' 已经切割，跳过...' ));
        }

        var size = fileinfo.size,
            files = fileinfo.files ;
        levels = calcScaleLevel(size.width, size.height); //[13,14,15,16,17,18];
        console.log('开始分层生成缩略图 levels:%s size:%s', levels, inspect(size));

        // 分层切割文件
        async.eachSeries(levels, function(level, callback){
            var idx =0;
            async.eachSeries( files, function(file, eachfilecb){
                console.log("图片:%s level:%s subfileIdx:%s ", fileinfo.paintingName, level, idx);
                var file = fileinfo.files[idx],
                    sourcePath = file.sourcePath;
                if(!fs.existsSync(sourcePath)){
                    console.log('源文件:%s 不存在，跳过这个级别的切割',  sourcePath);
                    return callback();
                }

                if(fs.existsSync(targetdir + '/' + level + '/0_0.jpg')){
                    console.log('文件:%s 已经存在，跳过这个级别的切割', targetdir + '/' + level + '/0_0.jpg' );
                    return callback();
                }
                resizelevel(fileinfo, idx, level, function(err, resizefile){
                    if(err) return eachfilecb(err);

                    console.log("resize file to :%s level:%d success", resizefile, level);
                    cropfile(fileinfo, idx, resizefile, level, function(err){
                        if(err) {
                            console.log("剪切文件出错:%s", err);
                        }else{
                            console.log("剪切文件完成:%s level:%d", fileinfo.paintingName, level);
                        }
                        
                        // 删除生成的缩略图文件
                        fs.unlink(resizefile, function(err){
                            if(err) console.log("删除文件出错:%s", err);

                            idx += 1;
                            eachfilecb();
                        });
                    }); 
                });
            }, function(err){
                callback(err);
            });
        }, function(err){
            if(err)
                console.trace(err);

            console.log('完成文件各个缩放级别的切割:%s ,开始生成缩略图', fileinfo.paintingName);
            resizethumb(fileinfo, function(err){
                if(err){
                    console.trace(err);  
                } else{
                    console.log('生成缩略图完成:%s ,', fileinfo.paintingName);
                }
                fn(err);
            })
            
        });
    }

    return {
        crop : crop,
        resizethumb : resizethumb
    };
};
exports.createImageMagickCropper = cropper;


var fs = require('fs'),
    path = require('path'),
    ejs = require('ejs');
/**
 * 创建一个PS分割器，这个分割器会生成在PS中执行的JS脚本，在JS中运行，完成整个分割过程，执行过程与
 * ImageMagic分割器完全一样
 */
function PSCropper(outdir, options){
    // 生成photoshop执行文件，完成整个切割过程
    function crop(fileinfo, fn){
        var tempfile = 'imgtool/cropertmpl.ejs';
        if(!fs.existsSync(tempfile))
            return fn(new Error("模板文件不存在：" + tempfile));


        var sourcePath = fileinfo.files[0].sourcePath;
        if(!fs.existsSync(sourcePath))
            return fn(new Error("原文件不存在：" + sourcePath));

        mkdirp.sync(outdir + '/' + fileinfo._id);
        var outfile = outdir + '/' + fileinfo._id + '/crop.jsx',
            str = fs.readFileSync(tempfile, 'utf8'),
            ret = ejs.render(str, {
                basedir : '/Users/sanli/Documents/workspace/cag-h5',
                filename : fileinfo.files[0].sourcePath,
                maxlevel : fileinfo.maxlevel,
                minlevel : fileinfo.minlevel,
                outdir : outdir + '/' + fileinfo._id
            });

        if(fs.existsSync(outfile)){
            return fn(new Error('文件已经生成, 跳过:' + outfile));
        }
        fs.writeFileSync(outfile, ret);
        console.log("生成文件:%s", outfile);
        fn(null, outfile);
    };

    //
    return {
        crop : crop
    };
}
exports.createPSCropper = PSCropper;

// ============================= 下面是单元测试用的代码 ================================
var isme = require('../sharepage.js').isme;
var tester = {
    cropall : function(){
        var crop = cropper('./cagstore');

        queryfile({}, function(err, fileinfos){
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


    // ===================================================
    // 以下是测试用的函数
    // ===================================================
    testThumb : function(){
        var crop = cropper('./cagstore');

        //queryfile({_id : '5380542cab18e5515c68a7df'}, function(err, fileinfos){
        queryfile({ }, function(err, fileinfos){
            async.eachSeries(fileinfos, function(fileinfo, callback){
                crop.resizethumb(fileinfo, function(err, thumbfile, size){
                    if(err) console.log('生成缩略图失败');

                    console.log('生成缩略图:%s size:%s', thumbfile, inspect(size));
                    // 更新缩略图size信息
                    var updater = {
                        paintingName : fileinfo.paintingName,
                        snapSize : size
                    }
                    paintdb.updatePaintinginfo(updater, function(err){
                        if(err) console.log('保存缩略图信息失败');

                        callback();
                    });
                });
            }); 
        });
    },

    testCropper : function(){
        var crop = cropper.createImageMagickCropper('./cagstore');

        queryfile({_id : '538054ebab18e5515c68a7f5'}, function(err, fileinfos){
            fileinfos.forEach(function(fileinfo){
                crop.crop(fileinfo, console.log);
            }); 
        });
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

