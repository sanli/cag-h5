//PG对象是整个页面的驱动对象，页面的状态在PG对象的state中保存
var PG = new $P({
	default: {},

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
    	var jsondata = PG.state.data;
    	if(!jsondata){
    		return;
    	}else{
    		Module.fileinfo = JSON.parse(jsondata);
    	}

		var fileinfo = Module.fileinfo;
		var width = fileinfo.size.width,
			height = fileinfo.size.height,
			northEast = L.CRS.Simple.pointToLatLng(L.point([width, 0]), 18),
			southWest = L.CRS.Simple.pointToLatLng(L.point([0, height]), 18),
			bounds = L.latLngBounds(southWest, northEast);

		if(Module.map){
			Module.map.remove();
		}

		var options = {
			maxBounds: bounds,
			minZoom: fileinfo.minlevel,
		    crs: L.CRS.Simple,
		    fullscreenControl: true
		}
		// 如果是WebView版本，则移除控件
		if(Module.isWebview(state)){
			options.zoomControl = false;
			options.attributionControl = false;
		}

		var map = Module.map = L.map('map', options).fitBounds( bounds );	

		var la = state.layer || '',
			detectRetina = fileinfo.maxlevel - fileinfo.minlevel >= 4; //巨型画作才需要探测Retina屏
			
		Module.tileLayer = L.tileLayer( fileinfo._id +'/{z}' + la + '/{x}_{y}.jpg', {	
		   bounds: bounds,
		   maxZoom: fileinfo.maxlevel,
		   detectRetina: detectRetina
		}).addTo(map);

		if(Module.isWebview(state)){
			$('#bookmarkbtn').css('display', 'none');
		}else{
			map.attributionControl
					.setPrefix('<a href="/main.html?l=home"><span class="glyphicon glyphicon-home"></span>中华珍宝馆</a>');	
			if(Module.isIOS()){
				map.attributionControl
					.addAttribution('<a href="https://itunes.apple.com/cn/app/zhong-hua-zhen-bao-guan/id905220385?mt=8"><span class="glyphicon glyphicon-phone"></span>iOS APP</a>');	
			}
		}
		Module.initMap(map);
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

        if(!Module.isWebview(PG.state)){
			Module.commentctl = new MyControl();
			Module.commentctl.click = function(){
			 	Module.toggleEditState();
			};
			map.addControl(Module.commentctl);
		}
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
    	
		var info = Module.fileinfo;
		var sidehtml = tmpl('sidebarTpl', {
			info : info
		})
		$sidebar.html(sidehtml);
	    fn && fn(null);
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
		
		$('#bookmarkbtn').on('click', Module.pin);
	},

	// ====================================================================================================================================
	//    功能函数 
	// ====================================================================================================================================
	// 添加一个comment到边栏上
	isWebview : function(state){
		return state.view ? /^webview/.test(state.view) : false ;
	},

	isIOS : function(){
		return /(iPhone|iPad)/.test(navigator.userAgent)
	},
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
