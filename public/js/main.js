//PG对象是整个页面的驱动对象，页面的状态在PG对象的state中保存
var PG = new $P({
	default: {
		type: 'essence',  // 'list' , 'query'
		// 当前列表页面最左边的paintingid,如果为空表示处在列表的最前端
		// 如果有值，就滚动到对应的位置
		current : '',
		// 查询条件， query状态下有效
		cond: { },
		href : ''
	},

	bind: function(){
		this.bindhash();
		$(PG).on('statechange', Module.onPageStateChange);
	},

    // 执行某个动作，并把结果保存到page cache中，以Key为键，下次调用不再重复执行
    once : function(key, fn){
    	if(!PG[key]){
    		PG[key] = fn();
    	}
    }
}); 

var Module = $.extend(new $M(), {

	// =============================================================================================================================
	//  事件处理函数 
	// =============================================================================================================================
	onPageStateChange : function (){
		var state = PG.state;
		// 初始化页面各个控件的状态
        Module.applyPageState(state);
        // 载入数据
        Module.loadPageData(state);
	},

	// 根据页面状态设置控件状态
	applyPageState : function(state){
		Module.updateStatusBar(state);

		if(PG.outline){
			$('#topbar li').removeClass('active') ; 
	    	if(state.type === 'essence'){
	    		$('#essence').parents('li').addClass('active');
			}else if(state.type === 'list'){
				$('#list').parents('li').addClass('active');
			}	
			state.href && Module.scrollTo(state.href);
    	}
	},

    // 根据页面状态，载入数据
    loadPageData: function(state, page){
    	if(!PG.essence){
    		$('div.main-container').spin("large");
	    	$.getJSON("/cagstore/essence.json", function(data){
	    		PG.essence = data;
	    		if(data.R === 'N')
	    			return $.alert('.main-container', '读取精选推荐数据错误，情稍后再试', 3000);

		    	var out = tmpl('paintinglistTmpl', {
					cagstore : data,
					opacity : false,
					cdn: _cdn(),
					isMobile : $.isMobile()
				});
				$('#paintingListRow').append(out);

	    		$("img.lazy").lazyload({
	    			container : '#paintingListRow',
				    effect : "fadeIn",
				    skip_invisible : false
				});	
				
				$('div.main-container').spin(false);
				Module.updateStatusBar(PG.state);
	    	});
    	}
    	
    	if(!PG.outline){
	    	$.getJSON("/cagstore/outline.json", function(data){
	    		PG.outline = data;
	    		if(data.R === 'N')
	    			return $.alert('.main-container', '读取作品大纲错误，请稍后再试', 3000);

	    		Module.initStatusBar();
	  			var out = tmpl('outlineTmpl', {
	  				outline : data
	  			});
	  			$('#paintinglist').append(out);
	  			$("div.loading-box").lazyload({
				    effect : "fadeIn",
				    skip_invisible : false,
				    appear : function(idx, settings){
				    	var $this = $(this),
				    		age = $this.data('age'),
				    		author = $this.data('author');

				    	Module.loadAuthor(author, $this);
				    }
				});

				Module.applyPageState(PG.state);
	    	});
    	}
    },

    // 载入某个作者的所有作品
    loadAuthor: function(author, $div){
    	$div.spin();
    	$.getJSON("/cagstore/fileinfo.json", { cond: { author : author } }
    		,function(data){
	    		PG.cags = (PG.cags ? PG.cags.concat(data) : data) ;
	    		if(data.R === 'N')
	    			return $.alert('.main-container', '读取作者［' + author + '］数据错误，情稍后再试', 3000);

		    	var out = tmpl('paintinglistTmpl', {
					cagstore : data,
					opacity : true,
					cdn: _cdn(),
					isMobile : $.isMobile()
				});
				
				var outdiv = $(out);
				outdiv.replaceAll($div)
					.find("img.lazy")
					.lazyload({
						container : "#author-" + author + "-list",
					    effect : "fadeIn",
					    skip_invisible : false,
					    appear : function(){
					    	outdiv.find("div.thumbnail").css('opacity', 1);
					    }
					});

				Module.loading = false;
				$div.spin(false);
				Module.updateStatusBar(PG.state);
	    	});	
    },

    // 载入查询内容
    loadSearch : function(cond, $div){
    	var key = cond.key,
    		regKey = 'Reg(' + key + ')',
    		cond = { $or :[ { author : regKey } , { paintingName :  regKey } ] };
    	$div.spin();
    	$.getJSON("/cagstore/search.json", { cond: cond }
    		,function(data){
	    		PG.search = data ;
	    		if(data.R === 'N')
	    			return $.alert('.main-container', '查询错误，情稍后再试', 3000);

	    		if(data.length === 0){
	    			return $div.empty().append("<h3><span class=\"label label-warning\">目前没有这个相关的画作，请等待，或者给我们提需求，我们会尽量收录。</span></h3>");
	    		}

	    		var out = tmpl('paintinglistTmpl', {
					cagstore : data,
					opacity : true,
					cdn : _cdn(),
					isMobile : $.isMobile()
				});
				
				$div.empty().append(out)
					.find("img.lazy")
					.lazyload({
						container : $div,
					    effect : "fadeIn",
					    skip_invisible : false,
					    appear : function(){
					    	$div.find("div.thumbnail").css('opacity', 1);
					    }
					});

				Module.loading = false;
				$div.spin(false);
				Module.updateStatusBar(PG.state);
	    	});	
    },

    initStatusBar : function(){
    	var outline = PG.outline, 
    		ages = [], authors = [], paintings = [];

    	$.each(outline, function( idx, age){
    		ages.push(age._id);
    		authors = authors.concat($.map(age.authors, function(author){
    			paintings = paintings.concat(author.paintings);
    			return author.name;
    		}));
    	});
    	PG.ages = ages;
    	PG.authors = authors;
    	PG.paintings = paintings;

    	var ageItems = $.map(ages, function(age){
    		return '<li role="presentation"><a href="#type=list&href=age-' + age + '" data-target="#age-' + age + '">' + age + '</a></li>';
    	});
    	$('#statusAge').append(ageItems.join(''));

    	var authorItems = $.map(authors, function(author){
    		return '<li class="col-sm-3"><a href="#type=list&href=author-' + author + '" data-target="#author-' + author + '">' + author + '</a></li>'
    	});
    	$('#statusAuthor').append(authorItems.join(''));	
    },

    // 更新状态条
    updateStatusBar : function(state){
    	if(state.type === 'essence'){
    		$('#statusTitle').empty().append('精选推荐'+ (PG.essence ? ' <span class="label label-default">' + PG.essence.length + '幅</span>' : ''));
    	}else if(state.type === 'list'){
    		$('#statusTitle').empty().append('全部浏览'+ (PG.paintings ? ' <span class="label label-default">' + PG.paintings.length + '幅</span>' : ''));
    	}else if(state.type === 'search'){
    		$('#statusTitle').empty().append('查询结果'+ (PG.search ? ' <span class="label label-default">' + PG.search.length + '幅</span>' : ''));
    	}
    	$('body').scrollspy('refresh');
    },

    scrollTo : function(href){
    	// TODO: 通过动画滑动过去会比较好，但是目前没有找到方法如何在滑动的同时不触发装载图片，需要找到更到的方法
     	// $("body").animate({ scrollTop: $('#' + href).offset().top }, 300, function(){
		// 	console.log("set PG.scrolling = false");
		// });
		 $("body").scrollTop( $('#' + href).offset().top );
    },

	bind : function(){
		$('body').scrollspy({ target: '.bottom-bar' });
		$('#searchForm').submit(function(event){
			// 查询内容
			var cond = $('#searchForm').getdata();
			if(cond.key === ''){
				return $('.searchbox').css('display','none');
			}else{
				$('.searchbox').css('display','');
				Module.loadSearch(cond, $('#searchListRow'));
				PG.pushState({ type : 'search', href : 'searchHref', key: cond.key});
			};
			event.preventDefault();	
		});

		$("img.lazy").lazyload({
			effect : "fadeIn",
		    skip_invisible : false
		});	
	},

	activate : function( $painting ){
		PG.activeTarget = $painting ;
	}

	// ====================================================================================================================================
	//      功能函数 
	// ====================================================================================================================================
});

(function ($) {

	var ie = 'ActiveXObject' in window,
		ielt9 = ie && !document.addEventListener,

	    // terrible browser detection to work around Safari / iOS / Android browser bugs
	    ua = navigator.userAgent.toLowerCase(),
	    webkit = ua.indexOf('webkit') !== -1,
	    chrome = ua.indexOf('chrome') !== -1,
	    phantomjs = ua.indexOf('phantom') !== -1,
	    android = ua.indexOf('android') !== -1,
	    android23 = ua.search('android [23]') !== -1,
		gecko = ua.indexOf('gecko') !== -1,

	    mobile = typeof orientation !== undefined + '',
	    msPointer = window.navigator && window.navigator.msPointerEnabled &&
	              window.navigator.msMaxTouchPoints && !window.PointerEvent,
		pointer = (window.PointerEvent && window.navigator.pointerEnabled && window.navigator.maxTouchPoints) ||
				  msPointer,
	    retina = ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
	             ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') &&
	              window.matchMedia('(min-resolution:144dpi)').matches),

	    doc = document.documentElement,
	    ie3d = ie && ('transition' in doc.style),
	    webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
	    gecko3d = 'MozPerspective' in doc.style,
	    opera3d = 'OTransition' in doc.style,
	    any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs;


	// PhantomJS has 'ontouchstart' in document.documentElement, but doesn't actually support touch.
	// https://github.com/Leaflet/Leaflet/pull/1434#issuecomment-13843151

	var touch = !window.L_NO_TOUCH && !phantomjs && (function () {

		var startName = 'ontouchstart';

		// IE10+ (We simulate these into touch* events in L.DomEvent and L.DomEvent.Pointer) or WebKit, etc.
		if (pointer || (startName in doc)) {
			return true;
		}

		// Firefox/Gecko
		var div = document.createElement('div'),
		    supported = false;

		if (!div.setAttribute) {
			return false;
		}
		div.setAttribute(startName, 'return;');

		if (typeof div[startName] === 'function') {
			supported = true;
		}

		div.removeAttribute(startName);
		div = null;

		return supported;
	}());


	$.mybrowser = {
		ie: ie,
		ielt9: ielt9,
		webkit: webkit,
		gecko: gecko && !webkit && !window.opera && !ie,

		android: android,
		android23: android23,

		chrome: chrome,

		ie3d: ie3d,
		webkit3d: webkit3d,
		gecko3d: gecko3d,
		opera3d: opera3d,
		any3d: any3d,

		mobile: mobile,
		mobileWebkit: mobile && webkit,
		mobileWebkit3d: mobile && webkit3d,
		mobileOpera: mobile && window.opera,

		touch: touch,
		msPointer: msPointer,
		pointer: pointer,

		retina: retina
	};

	$.isMobile = function(){
		return $.mybrowser.mobile;
	}
}(jQuery));

function init(){
	PG.bind();
	Module.bind();
	$(window).trigger('hashchange');
};


$(document).ready(init);
