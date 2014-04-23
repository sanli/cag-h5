//PG对象是整个页面的驱动对象，页面的状态在PG对象的state中保存
var PG = new $P({
	default: {
		cond: {},
		sort: { by : '_id' , order: 1 },
		uuid: '5343c5c2f883b828efa79ffa',
		view: 'listview'
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
		var fileinfo = PG.cags[state.uuid];

		var width = fileinfo.size.width,
			height = fileinfo.size.height;

		var northEast = L.CRS.Simple.pointToLatLng(L.point([width, 0]), 18),
			southWest = L.CRS.Simple.pointToLatLng(L.point([0, height]), 18),
			bounds = L.latLngBounds(southWest, northEast);

		if(!Module.map){
			var map = Module.map = L.map('map',{
				maxZoom: 18,
			    minZoom: 14,
			    maxBounds: bounds,
			    crs: L.CRS.Simple
			}).setView( [0, 0], 15);	
			Module.tileLayer = L.tileLayer('/cagstore/'+ state.uuid +'/{z}/{x}_{y}.jpg', {	
			   // bounds: bounds, 
			}).addTo(map);
			map.attributionControl.setPrefix('<a href="https://groups.google.com/forum/#!forum/chinaartgallery">中华珍宝馆论坛</a>');
		}else{
			Module.map.setMaxBounds(bounds).setView([0,0], 15);
			Module.tileLayer.setUrl('/cagstore/'+ state.uuid +'/{z}/{x}_{y}.jpg');
		}

		Module.showListView(state.view === 'listview');
    },

    //根据页面状态，载入数据
    loadPageData: function(state, page){

    },

	bind : function(){
		var out = tmpl('paintinglistTmpl', {
			cagstore : cagstore
		});
		$('#paintinglist div.row').append(out);
		$("img.lazy").lazyload({
			container : "#paintinglist",
		    effect : "fadeIn"
		});
		$('#selectArt').click(function(e){
			$li = $(e.target).closest('li');
			Module.toggleListView($li);
		});
	},

	// ====================================================================================================================================
	//      功能函数 
	// ====================================================================================================================================
	//比较两个查询条件是否完全相等
	showListView : function(show){
		var $li = $('#selectArt').closest('li');
		if(show){
			$li.addClass('active');
			$('#paintinglist').css('display', 'block');	
		}else{
			$li.removeClass('active');
			$('#paintinglist').css('display', 'none');	
		}
	},

	toggleListView : function($li){
		$li = $li || $('selectArt').closest('li');
		if($li.hasClass('active')){
			$li.removeClass('active');
			$('#paintinglist').css('display', 'none');	
		}else{
			$li.addClass('active');
			$('#paintinglist').css('display', 'block');	
		}
	}
});

function init(){
	initFileInfo(cagstore);
	PG.bind();
	Module.bind();
	$(window).trigger('hashchange');
};

function initFileInfo(cagstore){
	PG.cags = {};
	$.each(cagstore, function(idx, fileinfo){
		PG.cags[fileinfo._id] = fileinfo;
	});
}

$(document).ready(init);
