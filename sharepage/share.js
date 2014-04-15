var fs = require('fs'),
    path = require('path'),
    ejs = require('ejs');

// 自动生成模块代码
var genCmd = {
    help : [
        "参数：gen {module_name} {module_type} {out_dir}",
        "  module_name: 模块名称",
        "  module_type: 模块类型(CRUD,LIST...)",
        "  out_dir: 输出文件目录,如果没有指定，就输出到当前目录的上一级目录",
        "\n  例如: gen building CRUD crudtmp"
    ],

    templs : [
        { file: "back_db.js" , out : "data/{module_name}db.js" },
        { file: "back_route.js" , out : "routes/{module_name}ctl.js" },
        { file: "front_module.js" , out : "public/js/{module_name}.js" },
        { file: "front_module.html" , out : "views/{module_name}page.html" },
    ],

    exec : function(args){
        var moduleName = args[0],
            moduleType = args[1];
            outdir = args[2] || 'tempout';
        console.log("开始生成模块文件, 模块名称：[%s], 模块类型：[%s], 输出目录:[%s]",
            moduleName, moduleType, outdir);

        genCmd.templs.forEach(function(templ){
            var tempfile = moduleType + "/" + templ.file,
                outfile = outdir + "/" + templ.out.replace("{module_name}", moduleName);
            if(!fs.existsSync(tempfile))
                throw new Error("模板文件不存在：" + tempfile);

            var outpath = path.resolve('.', path.dirname(outfile));
            if(!fs.existsSync(outpath)){
                makedirSync(outpath);
            }

            var str = fs.readFileSync(tempfile, 'utf8'), 
                ret = ejs.render(str, {
                    module_name: moduleName,
                    module_type: moduleType,
                    open : "<M%" ,
                    close : "%M>" ,
                });

            if(fs.existsSync(outfile))
                outfile = outfile+ ".new";

            fs.writeFileSync(outfile, ret);
            console.log("生成文件:%s", outfile);
        });
    }
}

function makedirSync(dirname){
    var current = '' ,
        dirname = path.resolve('.', dirname);
    dirname.split("/").forEach(function(dir){
        current = current + "/" + dir
        if(!fs.existsSync(current)){
            console.log("mkdir:%s", current);
            fs.mkdirSync(current);
        }
    });
}

////打包和发布项目命令
var testCmd = {
    help : [
        "执行测试, test mkdir /tmp/aaa/bbb/ccc",
    ],

    //打包和发布项目
    exec: function(args){
        var caseName = args[0];
        testCmd[caseName](args.slice(1, args.length));
    },

    mkdir : function(args){
        var dir = args[0];
        if(dir){
            makedirSync(dir);
            if(fs.existsSync(dir)){
                console.log("[SUCCESS] : 目录:[%s]创建成功",dir);
            }else{
                console.log("[FAILED] : 目录:[%s]创建失败",dir);
            }
        }
    }
}

////打包和发布项目命令
var buildCmd = {
    help : [
        "参数：build {out_dir}",
    ],

    //打包和发布项目
    exec: function(args){

    }
}

// 打印每个命令对应的帮助信息
var helpCmd = {
    help : [
        "参数：help {cmd_name}",
    ],

    exec : function(args){
        //console.log(args);
        var cmd = args[0];
            cmdObj = share[cmd];
        console.log(cmdObj.help.join("\n"));
    }
}

var share = {
    gen : genCmd,
    help: helpCmd,
    build: buildCmd,
    test : testCmd,
}

function printUsage(){
    var cmd = [];
    for(cmdname in share)
        cmd.push(cmdname);
    console.log('share.js '+ cmd.join('|'));
}

//console.log(process.argv);
if(process.argv.length > 2){
    fn = process.argv[2];
    if(share[fn]){
        console.log("run cmd:%s", fn);
        share[fn].exec(process.argv.slice(3, process.argv.length));
    }else{
        printUsage();
    }
}else{
    printUsage();
}