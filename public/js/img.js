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
    	// load painting data
    	$('div.main').spin();
    	$.getJSON("/cagstore/"+ state.uuid + "/meta.json", function(data){
    		var fileinfo = data;
				document.title = "中华珍宝馆-" + fileinfo.age + '-' + fileinfo.author + '-' + fileinfo.paintingName; 

			var width = fileinfo.size.width,
				height = fileinfo.size.height,
				northEast = L.CRS.Simple.pointToLatLng(L.point([width, 0]), 18),
				southWest = L.CRS.Simple.pointToLatLng(L.point([0, height]), 18),
				bounds = L.latLngBounds(southWest, northEast);

			if(Module.map){
				Module.map.remove();
			}
			var map = Module.map = L.map('map',{
				maxZoom: fileinfo.maxlevel,
			    minZoom: fileinfo.minlevel,
			    maxBounds: bounds,
			    crs: L.CRS.Simple
			}).setView( [0, 0], fileinfo.minlevel);	

			var la = state.layer || '';
			Module.tileLayer = L.tileLayer('/cagstore/'+ state.uuid +'/{z}' + la + '/{x}_{y}.jpg', {	
			   bounds: bounds, 
			   reuseTiles : true
			}).addTo(map);

			if(Module.isWebview(state)){
				Module.map.removeControl(Module.map.attributionControl);
			}else{
				map.attributionControl.setPrefix('<a href="/main.html"><span class="glyphicon glyphicon-home"></span>中华珍宝馆</a>  | <a href="#share" data-toggle="modal" data-target="#share"><span class="glyphicon glyphicon-share"></span>分享到...</a> |  <a href="#about" data-toggle="modal" data-target="#about"><span class="glyphicon glyphicon-info-sign"></span>关于</a>');	
			}

			$('div.main').spin(false);
    	});
    },

    // 
	bind : function(){},

	// ====================================================================================================================================
	//      功能函数 
	// ====================================================================================================================================
	isWebview : function(state){
		return state.view ? /^webview/.test(state.view) : false ;
	}
});

function init(){
	PG.bind();
	Module.bind();
	$(window).trigger('hashchange');
};


$(document).ready(init);
