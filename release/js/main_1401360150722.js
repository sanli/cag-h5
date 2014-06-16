//PG对象是整个页面的驱动对象，页面的状态在PG对象的state中保存
var PG = new $P({
	default: {
		cond: { },
		sort: { by : '_id' , order: 1 }
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

	//根据页面状态设置控件状态
	applyPageState : function(state){},

    //根据页面状态，载入数据
    loadPageData: function(state, page){
    	$('div.main-container').spin("large");
    	$.getJSON("/cagstore/fileinfo.json", function(data){
    		PG.cags = data;
	    	var out = tmpl('paintinglistTmpl', {
				cagstore : data
			});
			$('#paintinglist div.row').append(out);
			$("img.lazy").lazyload({
				container : "#paintinglist",
			    effect : "fadeIn"
			});	
			$('div.main-container').spin(false);
    	});
    },

	bind : function(){},

	// ====================================================================================================================================
	//      功能函数 
	// ====================================================================================================================================
});

function init(){
	PG.bind();
	Module.bind();
	$(window).trigger('hashchange');
};

$(document).ready(init);


