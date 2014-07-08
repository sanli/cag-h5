// graper.js
/**
 * 图片信息抓取工具，从文件中提取包含的作品信息，并保存到数据库中
 */

var gm = require('gm').subClass({ imageMagick: true }),
    async = require('async'),
    mkdirp = require('mkdirp'),
    paintdb = require('../data/paintdb.js'),
    inspect = require('util').inspect,
    updateFileInfo = require('../data/paintdb.js').updateFileInfo,
    updatePaintingInfo = require('../data/paintdb.js').updatePaintinginfo,
    queryfile = require('../data/paintdb.js').queryfile,
    commons = require('./commons.js');

var path = require('path'),
    fs = require('fs');
// 用imagemagick提取文件基本信息，文件大小，像素度等
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
exports.getfileinfo = getfileinfo;

// 按照命名规则，从文件名中提取作品信息
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

/**
 * 扫描图片文件目录，抓取所有文件信息
 * 已经扫描过的文件不会重复扫描
 */
function grapfileinfo(dir, fn, match){
    var files = fs.readdirSync(dir);

    // 读取文件列表，并读取文件信息
    var nameMatch = match || /.*\.(jpg|tif)$/;
    var jpgs = files.filter(function(filename){
        return nameMatch.test(filename);
    }).sort();    
    
    async.eachSeries(jpgs, function(jpgfile, callback){
        var target = dir + "/" + jpgfile,
            basename = path.basename(jpgfile);

        console.log('读取文件信息：%s', target);

        // 分析文件信息，并保存到数据库
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
exports.grapfileinfo = grapfileinfo;


// 扫描目录，根据文件信息计算该文件所属于的作品信息
function grapPainting(dir, fn){
    var files = fs.readdirSync(dir),
        paintings = {} ;
    // 读取文件列表，并ji
    var jpgs = files.filter(function(filename){
        return /.*\.(jpg|tif)$/.test(filename);
    }).sort();

    async.eachSeries(jpgs, function(jpgfile, callback){
        var target = dir + "/" + jpgfile,
            basename = path.basename(path.basename(jpgfile, '.jpg'), '.tif');

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
            paintingsToSave.push( commons.calcSize(paintings[paintingname]) );
        }

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
exports.grapPainting = grapPainting;



// ============================= 下面是单元测试用的代码 ================================
var isme = require('../sharepage.js').isme;
var tester = {
    testGetpaintinfo : function(){
        console.log(getpaintinginfo("北宋_崔白_寒雀图卷(部分)_绢本_25.5X101_0"));
        console.log(getpaintinginfo("北宋_崔白_寒雀图卷(部分)_绢本_25.5X101_1"));
        console.log(getpaintinginfo("北宋_崔白_寒雀图卷(部分)_绢本"));
    },

    testGetfileinfo: function(){
        getfileinfo('./testimg/t1.jpg', function(err, info){
            console.log(info);
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
