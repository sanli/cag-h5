//PG对象是整个页面的驱动对象，页面的状态在PG对象的state中保存
var PG = new $P({
	default: {
		type: 'essence',  // 'list' , 'query'
		// 当前列表页面最左边的paintingid,如果为空表示处在列表的最前端
		// 如果有值，就滚动到对应的位置
		current : '',
		// 查询条件， query状态下有效
		cond: {},
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
		if(PG.outline){
			$('#topbar li').removeClass('active'); 
			$('#' + state.type + '-zone').parents('li').addClass('active');
	  		//state.href && Module.scrollTo(state.href);
    	}
	},

    // 根据页面状态，载入数据
    loadPageData: function(state, page){
    	var stateType = state.type;
    	// 载入精选
    	if(stateType === 'essence'){
    		Module.loadEssence();
    		if($('#outline-panel').hasClass('in'))
    			$('#outline-panel').collapse('hide');
    	}else if(stateType === 'age'){
    		if(!state.author){
    			// 没有指定作者，就展开藏品目录
    			$('#paintingListRow').empty();
    			$('#outline-panel').collapse('show');
    		}else{
				// 载入指定作者
				Module.loadAuthor(state.age, state.author, $('#paintingListRow'));
				$('#outline-panel').collapse('hide');
				
    		}
    	}else if(stateType === 'modern'){
    		$('#outline-panel').collapse('hide');
    		Module.loadAuthor('当代', state.author, $('#paintingListRow'))
    	}else if(stateType === 'search'){
    		$('#outline-panel').collapse('hide');
    	}
    	
    	// 载入大纲
    	Module.loadOutline();
    },

    // 按照查询条件载入数据
    loadEssence : function(url, cond, opt){
    	$('#paintinglist').spin("large");

    	$.getJSON("/cagstore/essence.json", function(data){
    		PG.essence = data;
    		if(data.R === 'N')
    			return $.alert('.main-container', '读取精选推荐数据错误，情稍后再试', 3000);

	    	var out = tmpl('paintinglistTmpl', {
	    		label : '精选馆',
				cagstore : data,
				opacity : false,
				cdn: _cdn(),
				isMobile : $.isMobile()
			});
			$('#paintingListRow').empty().append(out);
			$('#paintingListRow a.download').popover();

    		$("img.lazy").lazyload({
    			container : $('#paintingListRow'),
			    effect : "fadeIn",
			    skip_invisible : false
			});	
			
			$('#paintinglist').spin(false);
    	});
    },

    loadOutline : function(){
		if(!PG.outline){
	    	$.getJSON("/cagstore/outline.json", function(data){
	    		PG.outline = data;
	    		if(data.R === 'N')
	    			return $.alert('.main-container', '读取作品大纲错误，请稍后再试', 3000);

	    		Module.initOutlineDlg();
	    	});
    	}
    },

    // 载入某个作者的所有作品
    loadAuthor: function(age, author, $div){
    	$('#paintinglist').spin("large");
    	$.getJSON("/cagstore/fileinfo.json", { cond: { age : age, author : author } }
    		,function(data){
	    		PG.cags = (PG.cags ? PG.cags.concat(data) : data) ;
	    		if(data.R === 'N')
	    			return $.alert('.main-container', '读取作者［' + author + '］数据错误，情稍后再试', 3000);

		    	var out = tmpl('paintinglistTmpl', {
		    		label : age + ( author ? ( ' - ' +  author) : "" ),
					cagstore : data,
					opacity : true,
					cdn: _cdn(),
					isMobile : $.isMobile()
				});

				var outdiv = $(out);
				$div.empty().append(outdiv)
					.find("img.lazy")
					.lazyload({
						container : $div,
					    effect : "fadeIn",
					    skip_invisible : false,
					    appear : function(){
					    	outdiv.find("div.thumbnail").css('opacity', 1);
					    }
					});

				Module.loading = false;
				$('#paintinglist').spin(false);
	    	});	
    },

	// 载入新发布的作品，最多载入50个
    loadRecent: function($div){
    	$('#paintinglist').spin("large");
    	$.getJSON("/cagstore/search.json", { cond : cond }
    		,function(data){
	    		PG.search = data ;
	    		if(data.R === 'N')
	    			return $.alert('.main-container', '查询错误，情稍后再试', 3000);

	    		if(data.length === 0){
	    			return $div.empty().append("<h3><span class=\"label label-warning\">目前没有新发布的画作，请等待</span></h3>");
	    		}

	    		var out = tmpl('paintinglistTmpl', {
	    			label : "查询结果",
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
	    			label : "查询结果",
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
	    	});	
    },

    // init outline dialog
    initOutlineDlg : function(){
    	var out = tmpl('outlineDlgTmpl', {
			outline : PG.outline
		});
		$('#outline-dlg').append(out);

		var navOut = tmpl('outlineNavTmpl', {
			outline : PG.outline
		});
		$('#outline-navi').append(navOut);
		$('#outline-navi a.change-view').click(function(e){
			// 切换到对应的年代，并滚动到位置
			e.preventDefault();
			var targetage = $(e.target).closest('a').data('target'),
				targethref = $('a[data-age=' + targetage + ']');

			$('#outline-panel div.panel-body')
				.animate({ 
					scrollTop: targethref.offset().top - 90 
				}, 300
				, function(){});
		});
		$('#outline-panel a.scroll-view').click(function(e){
			e.preventDefault();
			var targetage = $(e.target).closest('a').data('target');
			if(targetage === "top"){
				var scrollto  = 0;
			}else{
				var targethref = $('a[data-age=' + targetage + ']'),
					scrollto  = targethref.offset().top - 90 ;	
			}
			
			
			
			var targetage = $(e.target).closest('a').data('target'),
				targethref = $('a[data-age=' + targetage + ']');

			$('#outline-panel div.panel-body')
				.animate({ scrollTop: scrollto }
					, 300
					, function(){});
		});
    },

    scrollTo : function(href){
    	// TODO: 通过动画滑动过去会比较好，但是目前没有找到方法如何在滑动的同时不触发装载图片，需要找到更到的方法
     	// $("body").animate({ scrollTop: $('#' + href).offset().top }, 300, function(){
		// 	console.log("set PG.scrolling = false");
		// });
		$("body").scrollTop( $('#' + href).offset().top - 80 );
    },

	bind : function(){
		$('body').scrollspy({ target: '.bottom-bar' });
		$('#searchForm').submit(function(event){
			// 查询内容
			var cond = $('#searchForm').getdata();
			Module.loadSearch(cond, $('#paintingListRow'));
			PG.pushState({ type : 'search', href : 'searchHref', key: cond.key});
			event.preventDefault();	
		});

		$("img.lazy").lazyload({
			effect : "fadeIn",
		    skip_invisible : false
		});
		// 点击弹出评论对话框
		$("#recent-comment").on('click', 'a', function(e){
			var targetUrl = $(e.target).attr('href');
			if(/main.html#comments$/.test(targetUrl)){
				$('#comment').modal();
				e.preventDefault();
			}
		});

		//在手机模式下自动关闭菜单
		$('#topbar a.change-view').click(function(){
			if($("#topbar").hasClass('in')){
				$("#topbar").collapse('toggle');
			}
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
	if($.mybrowser.ielt9 && !$.mybrowser.mobile){
		return $('body').html('<h3 class="alert alert-warning" style="position: relative;">发生异常：当前浏览器版不兼容</h3>' 
			+ '<h4 class="alert alert-success" style="position: relative;">中华珍宝馆不支持IE9.0以下版本，请换用其他浏览器或者升级你的IE。我们推荐使用"谷歌浏览器"，"火狐"或者是"360安全浏览器"。</h4>');
	}
	PG.bind();
	Module.bind();
	$(window).trigger('hashchange');
};


$(document).ready(init);
