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

 var   gm = require('gm').subClass({ imageMagick: true }),
    async = require('async'),
    mkdirp = require('mkdirp'),
    paintdb = require('./data/paintdb.js'),
    inspect = require('util').inspect,
    updateFileInfo = require('./data/paintdb.js').updateFileInfo,
    updatePaintingInfo = require('./data/paintdb.js').updatePaintinginfo,
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

    // 生成合适的缩略图，生成适合放到 height : 128px 的盒子中的图片
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

            fn(err, thumbfile)
        });
    };

    // 缩放文件, 生成临时文件，返回临时文件名称
    function resizelevel(fileinfo, idx, level, fn){
        var dir = outdir + '/' + fileinfo._id + '/' + level ,
            resizefile = outdir + '/' + fileinfo._id + '/temp_'+ level + '_' + idx +'.jpg' ,
            file = fileinfo.files[idx],
            sourcePath = file.sourcePath,
            width = file.size.width, 
            zoom = Math.pow(2, maxlevel - level ),
            resizeWith = Math.floor(width / zoom) ;

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
        .unsharp(0, 0.75, 0.75, 0.008)
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
        var firstTile = outdir + '/' + fileinfo._id + '/' + level + '/' + startXtile + '_' + startXtile + '.jpg';
        if(!opt.overwrite && fs.existsSync(firstTile)){
            console.log('分块文件:%s 已经存在，跳过...', firstTile);
            return fn();
        }

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
        var size = fileinfo.size,
            files = fileinfo.files ;
        levels = calcScaleLevel(size.width, size.height); //[13,14,15,16,17,18];
        console.log('开始分层生成缩略图 levels:%s size:%s', levels, inspect(size));

        // 分层切割文件
        async.eachSeries(levels, function(level, callback){
            var idx =0;
            async.eachSeries( files, function(file, eachfilecb){
                console.log("图片:%s level:%s subfileIdx:%s ", fileinfo.paintingName, level, idx);
                resizelevel(fileinfo, idx, level, function(err, resizefile){
                    if(err) return eachfilecb(err);

                    console.log("resize file to :%s level:%d success", resizefile, level);
                    cropfile(fileinfo, idx, resizefile, level, function(err){
                        if(err) {
                            console.log("剪切文件出错:%s", err);
                        }else{
                            console.log("剪切文件完成:%s level:%d", fileinfo.paintingName, level);    
                        }
                        
                        idx += 1;
                        eachfilecb();
                    }); 
                });
            }, function(err){
                callback(err);
            });
        }, function(err){
            if(err)
                console.trace(err);

            console.log('完成文件各个缩放级别的切割:%s', fileinfo.paintingName);
            fn(err);
        });
    }

    return {
        crop : crop,
        resizethumb : resizethumb
    };
}

// 计算合适的缩放级别
function calcScaleLevel(width, height){
    var levels = [], maxLevel = 18;

    //最多缩小到原来的1024倍
    for(i = 0; i<= 9; i++){
        var scale = Math.pow(2, i),
            sw = width / scale ,
            sh = height / scale ;

        if(sw < 256 || sh < 256){
            return levels;
        }else{
            levels.push(maxLevel - i);
        }
    }
};

/**
 * 图片信息抓取工具
 */
var path = require('path'),
    fs = require('fs');
function getfileinfo(filename, fn){
	var gmfile = gm(filename),
        basename = path.basename(filename),
        sourcePath = fs.realpathSync(filename),
		info = { fileName : basename , sourcePath : sourcePath };

    paintdb.getFileInfo( basename, function(err, curinfo){
        if(err) return console.trace(err);

        if(curinfo != null){
            console.log("文件[%s]已经扫描，跳过该文件", basename);
            return fn(null, info);
        }
        gmfile.identify(function(err, result){
            if(err)
                return fn(err);
            
            info.verbose = JSON.stringify(result);
            //info.identify = result;
            fn(null, info);
        });
    });

}

//按照命名规则，从文件名中提取文件信息
// eg: 元_赵孟頫_行书归去来辞卷_绢本_27.4x190_辽博_1.jpg
var infoMapper = [ 'age' , 'author', 'paintingName', 'mediaType', 'areaSize', 'ownerName'];
function getpaintinginfo(filename){
    var infos = filename.split('_'),
        fileInfo = { 
            updateTime : new Date(),
            isMultifile : false
        };

    if(infos.length < 3){
        console.log("文件信息太少：%s，无法提取", filename);
        return;
    }
    // 如果
    if(/^\d$/.test(infos[infos.length - 1])){
        fileInfo.isMultifile = true;
        fileInfo.multiIndex = infos.splice(infos.length - 1, 1);
    }

    for(i = 0 ; i<= infoMapper.length - 1 ; i++){
        var field = infoMapper[i],
            val = ( i <= (infos.length - 1) ? infos[i] : null);
        if(!val)
            continue;

        if( typeof(field) === 'string' ){
            fileInfo[field] = val
        }else if(typeof(field) === 'object'){
            fileInfo[filed.name] = filed.converter(val);
        } 
    }
    return fileInfo;
}

// 扫描目录，抓取所有文件信息
function grapfileinfo(dir, fn, match){
    var files = fs.readdirSync(dir);

    // 读取文件列表，并ji
    var nameMatch = match || /.*\.jpg$/;
    var jpgs = files.filter(function(filename){
        return nameMatch.test(filename);
    }).sort();

    async.eachSeries(jpgs, function(jpgfile, callback){
        var target = dir + "/" + jpgfile,
            basename = path.basename(jpgfile);

        console.log('读取文件信息：%s', target);

        //抓去文件信息
        getfileinfo(target , function(err, info){
            if(err) {
                console.trace(err);
                return callback(err);
            }

            updateFileInfo(info, function(err){
                callback(err);
            });
        });
    }, function(err){
        if(err) return fn(err);

        console.log('读取文件信息完成，一共扫描：%d个文件', jpgs.length);
        fn();
    });
};


function calcSize(painting){
    var files = painting.files,
        fileSize = 0, pixels = 0,
        fileNames = [],
        size = { width : 0 , height : 0};
    files.forEach(function(file){
        fileSize += parseFloat(file.filesize.toUpperCase().replace("MB"));
        pixels += parseFloat(file.pixels.toUpperCase().replace("MB"));
        size.width += file.size.width ;
        size.height = file.size.height ;
    });
    painting.fileSize = fileSize + "MB" ;
    painting.pixels = pixels * 100 ;
    painting.size = size ;

    // 计算最大最小缩放比率
    painting.maxlevel = 18 ;
    var levels = calcScaleLevel(size.width, size.height);
    painting.maxlevel = levels[0];
    painting.minlevel = levels[levels.length - 1];
    return painting;
};

// 扫描目录，抓取所有文件信息
function grapPainting(dir, fn){
    var files = fs.readdirSync(dir),
        paintings = {} ;
    // 读取文件列表，并ji
    var jpgs = files.filter(function(filename){
        return /.*\.jpg$/.test(filename);
    }).sort();

    async.eachSeries(jpgs, function(jpgfile, callback){
        var target = dir + "/" + jpgfile,
            basename = path.basename(jpgfile, '.jpg');

        console.log('读取文件信息：%s', target);

        var painting = getpaintinginfo(basename);
        if(!painting) return;

        //当前是是多端作品中的一段
        var paintingName = painting.paintingName
        if(!paintings[paintingName]){
            paintings[paintingName] = painting;
        }

        paintdb.getFileInfo(jpgfile, function(err, info){
            if(err) {
                console.trace(err);
                return callback(err);
            }

            var thePainting = paintings[paintingName];
            //console.log("info:%s thePainting:%s", inspect(info), inspect(thePainting));
            if(painting.isMultifile){
                info.multiIndex  = painting.multiIndex;
            }
            var files = thePainting.files ? thePainting.files : [];
            files.push(info);

            files.sort(function(a,b){ 
                return a.multiIndex > b.multiIndex  ? 1 : ( a.multiIndex < b.multiIndex ? -1 : 0)
            });

            thePainting.files = files;

            callback(err);
        });
    }, function(err){
        if(err) return fn(err);

        var paintingsToSave = [];
        for(paintingname in paintings){
            paintingsToSave.push( calcSize(paintings[paintingname]) );
        }

        debugger;
        console.log('Out: %s', inspect(paintingsToSave));
        //
        // 重新计算painting属性，并保存到数据库
        //
        var cnt = 0 ;
        async.eachSeries(paintingsToSave, function(painting, callback){

            updatePaintingInfo(painting, function(err){
                if(err){
                    console.log('保存艺术品:%s，出错:%s', painting.paintingName, err.message);
                    return callback(err);
                }

                console.log('保存艺术品:%s', painting.paintingName);
                callback();
            });
        },function(err){
            console.log('保存作品信息完成，一共：%d个文件', paintingsToSave.length);
            fn(err);
        });
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
                    console.log('输出文件:%s', metaFilename);
                    
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


// ============================= 下面是单元测试用的代码 ================================
var isme = require('./sharepage.js').isme;

var tester = {
    testGetfileinfo: function(){
		getfileinfo('./testimg/t1.jpg', function(err, info){
            console.log(info);
        }); 
    },

    updateJXInfo : function(){
        grapfileinfo('/Users/sanli/Desktop/中华珍宝馆/高清精选', function(){
        //grapfileinfo('/root/cag/中华珍宝馆/高清精选', function(){
            console.log('执行结束');
        })
    },

    // 更新特定文件信息
    updateOneFileInfo : function(){
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

        queryfile({_id : '538054ebab18e5515c68a7f5'}, function(err, fileinfos){
            fileinfos.forEach(function(fileinfo){
                crop.crop(fileinfo, console.log);
            }); 
        });
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

    testThumb : function(){
        var crop = cropper('./cagstore', { overwrite : true });

        queryfile({_id : '5380542cab18e5515c68a7df'}, function(err, fileinfos){
        //queryfile({ }, function(err, fileinfos){
            async.eachSeries(fileinfos, function(fileinfo, callback){
                crop.resizethumb(fileinfo, function(err, thumbfile){
                    if(err) console.log('生成缩略图失败');

                    console.log('生成缩略图:%s', thumbfile);
                    callback();
                });
            }); 
        });
    },

    testGenerateFileinfo : function(){
        generateFileinfo('./cagstore', function(err, str){
            if(err) console.trace(err);

            console.log(str);
        })
    },

    testGetpaintinfo : function(){
        console.log(getpaintinginfo("北宋_崔白_寒雀图卷(部分)_绢本_25.5X101_0"));
        console.log(getpaintinginfo("北宋_崔白_寒雀图卷(部分)_绢本_25.5X101_1"));
        console.log(getpaintinginfo("北宋_崔白_寒雀图卷(部分)_绢本"));
    },

    testCalcScaleLevel : function(){
        var levels = calcScaleLevel( 40392, 5315 );
        console.log("levels: %s", levels);
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