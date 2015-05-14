//PG对象是整个页面的驱动对象，页面的状态在PG对象的state中保存
var PG = new $P({
	default: {
		uuid: '538054ebab18e5515c68a7eb'
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

	comments : {},

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

	applyPageState : function(state){
		
    },

    // 根据页面状态，载入数据
    loadPageData: function(state, page){
		var fileinfo = Module.fileinfo;
		var width = fileinfo.size.width,
			height = fileinfo.size.height,
			northEast = L.CRS.Simple.pointToLatLng(L.point([width, 0]), 18),
			southWest = L.CRS.Simple.pointToLatLng(L.point([0, height]), 18),
			bounds = L.latLngBounds(southWest, northEast);

		if(Module.map){
			Module.map.remove();
		}
		var map = Module.map = L.map('map',{
			maxBounds: bounds,
			minZoom: fileinfo.minlevel,
		    crs: L.CRS.Simple,
		    fullscreenControl: true
		}).fitBounds( bounds );	

		var la = state.layer || '',
			detectRetina = fileinfo.maxlevel - fileinfo.minlevel >= 4; //巨型画作才需要探测Retina屏
			
		Module.tileLayer = L.tileLayer( _cdn('/cagstore/'+ state.uuid +'/{z}' + la + '/{x}_{y}.jpg'), {	
		   bounds: bounds,
		   maxZoom: fileinfo.maxlevel,
		   detectRetina: detectRetina
		}).addTo(map);

		if(Module.isWebview(state)){
			Module.map.removeControl(Module.map.attributionControl);
		}else{
			map.attributionControl
				.setPrefix('<a href="/main.html?l=home"><span class="glyphicon glyphicon-home"></span>中华珍宝馆</a>')
				.addAttribution('<a href="/main.html?l=more"><span class="glyphicon glyphicon-share-alt"></span>更多图片</a>');
		}
		Module.initMap(map);

		// check existing of painting
    	$('div.main').spin();
    	$.getJSON(_cdn("/cagstore/"+ state.uuid + "/meta.json"), function(data){
				$('div.main').spin(false);
  		}).fail(function() {
		     $('#map').html("<h3>您寻找的艺术品［" + state.uuid + "］不存在，请<a href=\"/main.html\">返回首页</a></h3>");
		     $('div.main').spin(false);
		});
    },

    // 初始化图片，创建控件
    initMap : function(map){
    	map.on('dragstart', function(){
		 	$('div.leaflet-control-attribution').addClass('popup');
		});
		map.on('dragend', function(){
			$('div.leaflet-control-attribution').removeClass('popup');
		});
		
    	$('#sidebar').css('display', '');
		var sidebar = L.control.sidebar('sidebar', {
            closeButton: true,
            position: 'right'
        });
        Module.sidebar = sidebar;
        map.addControl(sidebar);
    	sidebar.on('show', function () {
    		// sidebar was showout 
        });

        L.DomEvent.on(sidebar.getCloseButton(), 'click', function () {
        	Module.setEditState(false);
        });

		Module.commentctl = new MyControl();
		Module.commentctl.click = function(){
		 	Module.toggleEditState();
		};

		map.addControl(Module.commentctl);
		setTimeout(function(e){
			Module.toggleEditState();	
		},800);
    },

    toggleEditState : function(){
    	if(!Module.commentsLoaded){
    		Module.loadInfo( Module.fileinfo._id);
    		Module.commentsLoaded = true;
    	}

    	Module.setEditState(!Module.editing);
    },

    loadInfo : function( paintingId, fn ){
    	var $sidebar = $('#sidebar');
    	$.getJSON("/cagstore/info.json"
    		, { uuid : paintingId }
    		, function(data){
    			if(data.R === 'N')
	    			return $.alert('#sidebar', '读取藏品信息错误。', 3000);

	    		var info = data;
	    		Module.pushInfo2Sidebar(info);
	    		fn && fn(null);
	    	}).fail(function() {
			    $.alert('#sidebar','读取藏品信息错误。', 3000);
			    fn && fn(new Error('读取文件信息错误。'));
			});
    },

    setEditState : function(isEditing){
    	Module.editing = isEditing;

    	var sidebar = Module.sidebar;
    	if(isEditing){
    		sidebar.show();
    	}else{
    		sidebar.hide();
    	}
    },

    // 绑定事件处理函数
	bind : function(){
		$('#sidebar').on('click', 'a.modal-link', function(e){
			e.preventDefault();
			var $a = $(e.target),
				target = $a.data('target'),
				toggle = $a.data('toggle'),
				href = $a.attr('href');

			if( toggle === 'modal' && target ){
				$(target).modal({ remote : href });
			}
		});

		$('#sidebar').mouseenter(function(e){
			$('#sidebar').css('opacity', 1);
		});
		$('#sidebar').mouseleave(function(){
			$('#sidebar').css('opacity', 0.75);
		});
		// 将当前画作加入用户书签
		$('#bookmarkbtn').click(Module.pin);
	},

	// ====================================================================================================================================
	//    功能函数 
	// ====================================================================================================================================
	// 添加一个comment到边栏上
	pushInfo2Sidebar : function(info){
		$('#comment-list a.download').popover();
		$('#comment-list button').popover();
		  (function() {
		      var ds = document.createElement('script');
			    ds.type = 'text/javascript';ds.async = true;
			    ds.src = (document.location.protocol == 'https:' ? 'https:' : 'http:') + '//static.duoshuo.com/embed.unstable.js';
			    ds.charset = 'UTF-8';
			    (document.getElementsByTagName('head')[0] 
			     || document.getElementsByTagName('body')[0]).appendChild(ds);
		  })();
	},

	isWebview : function(state){
		return state.view ? /^webview/.test(state.view) : false ;
	},

	pin : function(e){
		if($(e.target).data('bookmarked'))
			return;

		var file = Module.fileinfo;
		$('#bookmarkbtn').spin();
		PG.getuser(function(err, user){
			$M.doquery('/bookmark/pin', {
				title : file.paintingName,
				paintingid : file._id
			}, {
				successfn : function(result){
					$('#bookmarkbtn').spin(false);
                    $('#bookmarkbtn').removeClass('btn-default').addClass('btn-info')
                    	.data('bookmarked', true);
                }, 
                alertPosition : '#loginDlg .modal-body'
			});
			
		}, { asklogin : true });
	}
});


function init(){
	PG.bind();
	Module.bind();
	$(window).trigger('hashchange');
	
};


// 按钮控件
var MyControl = L.Control.extend({
    options: {
        position: 'topright',
        title: '打开信息面板'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control my-custom-control');
        this.link = L.DomUtil.create('a', 'glyphicon glyphicon-pencil', container);
        this.link.title = this.options.title;
        L.DomEvent.on(this.link, 'click', this._click, this);
        return container;
    },

    _click : function(e){
    	L.DomEvent.stopPropagation(e);
		L.DomEvent.preventDefault(e);
		this.click(e);
    },

    click : function(e){
    	console.log("should replace with implementing.");
    }
});

$(document).ready(init);
