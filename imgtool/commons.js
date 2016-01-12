//comment.js

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
exports.calcScaleLevel = calcScaleLevel;


// 计算文件大小和缩放比例
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

    var thumbsize = calcThumbSize(painting);
    painting.snapSize = thumbsize;
    return painting;
};
exports.calcSize = calcSize;

// 计算缩略图的大小
function calcThumbSize(fileinfo){
    var width = fileinfo.size.width, 
        height = fileinfo.size.height,
        resizeWith = Math.floor(width > height ? width * ( 128 / height) : 128),
        thumbsize = { 
            width : resizeWith > 460 ? 460 : resizeWith , 
            height : Math.round(( resizeWith / width ) * height) 
        };
    return thumbsize;
}
exports.calcThumbSize = calcThumbSize;


// ============================= 下面是单元测试用的代码 ================================
var isme = require('../sharepage.js').isme;
var tester = {
    // ===================================================
    // 以下是测试用的函数
    // ===================================================
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
