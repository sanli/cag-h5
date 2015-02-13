//cagstore_paintdb.js
/**
 * 基于cagstore实现的paintdb，当mongodb失效的时候，以此代替
 */

var cagstore = require('../cagstore.js').cagstore,
	outline = newOutline(),
	ages = {},
	authors = {};


// 寻找存在的元素，如果不存在就创建一个，如果存在就更新
function findOrAdd(list, finder, newer, updater){
	var out = list.filter(finder);
	out.length > 0 ? updater(list, out[0]) : newer(list);
}

// 如果属性已经存在就更新，否者创建
function existOrAdd(obj, property, newer, updater){
	if(obj[property]){
		updater(obj[property]);
	}else{
		obj[property] = newer();
	}
}

//创建一个大纲对象
function newOutline(){
	var _outline = [];
		self = {
		putPainting : function(painting){
			var age = painting.age,
				author = painting.author,
				paintingName = painting.paintingName;

			findOrAdd(_outline, function(theage){ return theage._id === age; }
				, function(outline){
					outline.push({
						_id : age,
						authors: [ { name : author,  paintings : [ paintingName ] } ]
					});
				}
				, function(outline, theage){
					findOrAdd(theage.authors, function(theauthor){ return theauthor.name === author }
					, function(authors){
						authors.push({ name : author,  paintings : [ paintingName ] });
					}
					, function( authors, theauthor){
						if(theauthor.paintings.indexOf(paintingName) < 0)
							theauthor.paintings.push[paintingName];
					});
				});
		},

		// 返回整个JSON对象
		json : function(){
			return _outline;
		}
	}
	return self;
}

// 预处理cagstore
function preprocess(cagstore){
	cagstore.forEach(function(painting){
		var age = painting.age,
			author = painting.author,
			paintingName = painting.name;

		if(painting.author === '李晓明') return;
		outline.putPainting(painting);
		//创建分类视图
		existOrAdd(ages, age, function(){ return [painting];}, function( paintings ){ 
			paintings.push(painting); 
		});
		existOrAdd(authors, author, function(){ return [painting];}, function( paintings ){ 
			paintings.push(painting); 
		});
	});
}
preprocess(cagstore);

exports.incViewCount = function(_id, fn){
   // Do nothing
}

// 查询某个艺术品详细信息
exports.queryfile = function(query, project, sort, fn, nocache){
    if(typeof(project) === 'function'){
        fn = project;
        sort = {};
        project = {};
    }

    if(query['author']){
    	author = query['author'];
    	authorpainting = authors[author];
    	authorpainting ? fn(null, authorpainting) : fn(new Error("该作者没有收录：[" + author + "]")) ;
    }else if(query['age']){
    	age = query['age'];
    	agepainting = ages[age];
    	agepainting ? fn(null, agepainting) : fn(new Error("该年代没有收录：[" + age + "]")) ;
    }else if(query['essence']){
		fn(null, [].concat(authors['王羲之']).concat(authors['仇英']));
    }else{
    	//fn(new Error("当前运行在简单模式下，无法实现该查询"));
    	fn(null, [].concat(authors['王羲之']).concat(authors['仇英']));
    }
}

// 返回所有作品大纲
exports.outline = function(query, fn){
    return fn(null, outline.json());
}


//按照ID查询对象，Do nothing
exports.findById = function(_id, fn){
  fn(null, {});
}

// ============================= 下面是单元测试用的代码 ================================
//var isme = require('./sharepage.js').isme;
var tester = {
    // 导入藏品到珍宝馆存储系统
    printOutline : function(){
        console.log(JSON.stringify(outline.json()));
    },

    printAges : function(){
    	console.log(ages);	
    },

    printAuthors : function(){
    	console.log(authors);
    }
}

//if(isme(__filename)){
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
//}


