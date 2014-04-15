var gm = require('gm');


function resizeTest(){
	gm('testimg/t1.jpg')
	.resize(1000)
	.write('testimg/o1.jpg', function (err) {
	  if (err) 
	  	console.trace(err);
	});	
}


function clipTest(){
	gm('testimg/t1.jpg')
	.crop(256,256, 512,0)
	.write('testimg/o2.jpg', function (err) {
	  if (err) 
	  	console.trace(err);
	});	
}

var async = require('async');
function sizeTest(){
	var t1 = gm('testimg/t1.jpg').size(function(err, value){
		var wcnt = Math.ceil(value.width / 256 ), 
			hcnt = Math.ceil(value.height / 265 ),
			wextend = wcnt * 256,
			hextend = hcnt * 256;

		console.log( [wcnt, hcnt] );
		var taskqueue = [];
		for(i = 0 ; i<= wcnt - 1; i++){
			for(j = 0 ; j <= hcnt - 1; j ++){
				// gm('testimg/t1.jpg')
				// .crop(256,256, 256 * i ,256 * j )
				// .write('testimg/12_'+ i+ '_' + j +'.jpg', function (err) {
				//   if (err) 
				//   	console.trace(err);
				// });	
				taskqueue.push({
					file: 'testimg/t1.jpg',
					cropArea: [256, 256, 256 * i, 256 * j],
					outfile: 'testimg/12_'+ i + '_' + j +'.jpg'
				})
			}
		}

		async.eachSeries(taskqueue, function(task, fn){
			console.log("分切文件：%s, 生成：%s", task.file, task.outfile);
			var args = task.cropArea;

			gm('testimg/t1.jpg')
			.extent( wextend, hextend )
			.crop( args[0], args[1], args[2], args[3] )
			.write( task.outfile , function (err) {
				if (err) {
					console.trace(err);
					return fn(err);
				}
				fn();
			});	
			
		}, function(err){
			if(err)
				console.trace(err);

			console.log("处理完成，")
		});
	});
}

//clipTest();
sizeTest();