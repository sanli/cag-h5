/*
jake lint
jake release
*/
function hint(msg, paths) {
	return function () {
		console.log(msg);
		jake.exec('node node_modules/jshint/bin/jshint -c ' + paths,
				{printStdout: true}, function () {
			console.log('\tCheck passed.\n');
			complete();
		});
	}
}

desc('Check source for errors with JSHint');
task('lint', {async: true}, hint('Checking for JS errors...', 'public/js'));

desc('合并和压缩js文件');
task('build', {async: true}, function () {
	console.log(arguments);
	var buildName = new Date().getTime();
	genpage(buildName);

	jake.mkdirP('release/cagstore');
	jake.exec([
			'rm -frv release/js/cag_139*.js release/cagstore/fileinfo*.js*',
			'cp cagstore-online/fileinfo.json release/cagstore/fileinfo_'+ buildName+'.json',
			'cp cagstore-online/fileinfo.js release/cagstore/fileinfo_'+ buildName+'.js',
	],function(){
		build(complete, buildName);	
	});
});

// ================== implements ===============
var fs = require('fs'),
    jshint = require('jshint'),
    UglifyJS = require('uglify-js'),
    zlib = require('zlib'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    ejs = require('ejs');

function genpage(buildName){
	var tempfile = "views/mainpage.html",
        outfile = "release/main.html";

        if(!fs.existsSync(tempfile))
            throw new Error("模板文件不存在：" + tempfile);

        var outpath = path.resolve('.', path.dirname(outfile));
        if(!fs.existsSync(outpath)){
            makedirSync(outpath);
        }

        var str = fs.readFileSync(tempfile, 'utf8'), 
            ret = ejs.render(str, {
            	stamp : buildName,
            	target : 'release'
            });

        fs.writeFileSync(outfile, ret);
        console.log("生成文件:%s", outfile);
}

function getFiles() {
	return [
		'public/js/sharepage.base.js',
		'public/js/sharepage.js',
		'public/js/leaflet-src.js',
		'public/js/main.js'
	];
}

function getSizeDelta(newContent, oldContent, fixCRLF) {
	if (!oldContent) {
		return ' (new)';
	}
	if (newContent === oldContent) {
		return ' (unchanged)';
	}
	if (fixCRLF) {
		newContent = newContent.replace(/\r\n?/g, '\n');
		oldContent = oldContent.replace(/\r\n?/g, '\n');
	}
	var delta = newContent.length - oldContent.length;

	return delta === 0 ? '' : ' (' + (delta > 0 ? '+' : '') + delta + ' bytes)';
}

function loadSilently(path) {
	try {
		return fs.readFileSync(path, 'utf8');
	} catch (e) {
		return null;
	}
}

function combineFiles(files) {
	var content = '';
	for (var i = 0, len = files.length; i < len; i++) {
		content += fs.readFileSync(files[i], 'utf8') + '\n\n';
	}
	return content;
}

function bytesToKB(bytes) {
    return (bytes / 1024).toFixed(2) + ' KB';
};

function build(callback, buildName) {
	var files = getFiles();
	console.log('Concatenating and compressing ' + files.length + ' files...');

	var newSrc = combineFiles(files),
	    pathPart = 'release/js/cag' + (buildName ? '_' + buildName : ''),
	    srcPath = pathPart + '.js',

	    oldSrc = loadSilently(srcPath),
	    srcDelta = getSizeDelta(newSrc, oldSrc, true);

	console.log('\tUncompressed: ' + bytesToKB(newSrc.length) + srcDelta);

	if (newSrc !== oldSrc) {
		fs.writeFileSync(srcPath, newSrc);
		console.log('\tSaved to ' + srcPath);
	}

	var path = pathPart + '_min.js',
	    oldCompressed = loadSilently(path),
	    newCompressed = UglifyJS.minify(newSrc, {
	        warnings: true,
	        fromString: true
	    }).code,
	    delta = getSizeDelta(newCompressed, oldCompressed);

	console.log('\tCompressed: ' + bytesToKB(newCompressed.length) + delta);

	var newGzipped,
	    gzippedDelta = '';

	function done() {
		if (newCompressed !== oldCompressed) {
			fs.writeFileSync(path, newCompressed);
			console.log('\tSaved to ' + path);
		}
		console.log('\tGzipped: ' + bytesToKB(newGzipped.length) + gzippedDelta);
		callback();
	}

	zlib.gzip(newCompressed, function (err, gzipped) {
		if (err) { return; }
		newGzipped = gzipped;
		if (oldCompressed && (oldCompressed !== newCompressed)) {
			zlib.gzip(oldCompressed, function (err, oldGzipped) {
				if (err) { return; }
				gzippedDelta = getSizeDelta(gzipped, oldGzipped);
				done();
			});
		} else {
			done();
		}
	});
};


jake.addListener('complete', function () {
  process.exit();
});
