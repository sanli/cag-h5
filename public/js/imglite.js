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
    	// load painting data
    	$('div.main').spin();
    	$.getJSON(_cdn("/cagstore/"+ state.uuid + "/meta.json"), function(data){
    		var fileinfo = Module.fileinfo = data;
			document.title = "中华珍宝馆-" + fileinfo.age + '-' + fileinfo.author + '-' + fileinfo.paintingName,
			$('#painting-title').text(fileinfo.paintingName); 

			var width = fileinfo.size.width,
				height = fileinfo.size.height,
				northEast = L.CRS.Simple.pointToLatLng(L.point([width, 0]), 18),
				southWest = L.CRS.Simple.pointToLatLng(L.point([0, height]), 18),
				bounds = L.latLngBounds(southWest, northEast);

			if(Module.map){
				Module.map.remove();
			}
			var map = Module.map = L.map('map',{
				minZoom: fileinfo.minlevel,
			    maxBounds: bounds,
			    crs: L.CRS.Simple
			}).fitBounds( bounds );	//打开图片时，页面处于图片中间

			var la = state.layer || '';
			Module.tileLayer = L.tileLayer( _cdn('/cagstore/'+ state.uuid +'/{z}' + la + '/{x}_{y}.jpg'), {	
			   bounds: bounds,
			   maxZoom: fileinfo.maxlevel,
			   detectRetina: true
			}).addTo(map);

			if(Module.isWebview(state)){
				Module.map.removeControl(Module.map.attributionControl);
			}else{
				map.attributionControl.setPrefix(
					'<a href="/main.html"><span class="glyphicon glyphicon-home"></span>中华珍宝馆</a> '
				);	
			}
			Module.initMap(map);
			$('div.main').spin(false);
    	}).fail(function() {
		    $('#map').html("<h3>您寻找的艺术品［" + state.uuid + "］不存在，请<a href=\"/main.html\">返回首页</a></h3>");
		    $('div.main').spin(false);
		});
    },

    // 初始化图片，创建控件
    initMap : function(map){
		// side bar
		$('#sidebar').css('display', '');
		var sidebar = L.control.sidebar('sidebar', {
            closeButton: true,
            position: 'right'
        });
        Module.sidebar = sidebar;
        map.addControl(sidebar);
    	// sidebar.on('show', function () {});
        // sidebar.on('shown', function () { console.log('Sidebar is visible.'); });
        // sidebar.on('hide', function () { console.log('Sidebar will be hidden.'); });
        // sidebar.on('hidden', function () { console.log('Sidebar is hidden.'); });

        L.DomEvent.on(sidebar.getCloseButton(), 'click', function () {
            Module.setEditState(false);
        });

		Module.commentctl = new MyControl();
		Module.commentctl.click = function(){
			Module.toggleEditState();
		};
		map.addControl(Module.commentctl);


		var drawnItems = new L.FeatureGroup();
		Module.drawnItems = drawnItems;
		map.addLayer(drawnItems);
    },

    toggleEditState : function(){
    	Module.setEditState(!Module.editing);
    	if(!Module.commentsLoaded){
    		// 载入前20个comment 
    		Module.loadComments( Module.fileinfo._id, 0 , 20 );
    		Module.commentsLoaded = true;
    	}
    },

    loadComments : function( paintingId, skip, limit ){
    	var $sidebar = $('#sidebar');
    	$sidebar.spin();
    	$.getJSON("/comments.json"
    		, { paintingId : paintingId , page : { skip : skip, limit : limit } }
    		, function(data){
    			if(data.R === 'N')
	    			return $.alert('#sidebar', '读取评析信息错误。', 3000);

	    		var comments = data;
	    		$.each(comments, function(i, comment){
	    			Module.pushComment2Sidebar(comment);
	    		});
				$sidebar.spin(false);
	    	}).fail(function() {
			    $.alert('#sidebar','读取评析信息错误。', 3000);
			    $sidebar.spin(false);
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
		$('#sidebar').click('a.modal-link', function(e){
			e.preventDefault();
			var $a = $(e.target),
				target = $a.data('target'),
				toggle = $a.data('toggle'),
				href = $a.attr('href');

			if( toggle === 'modal' && target ){
				$(target).modal({ remote : href });
			}
		});


		function votefn(url){
			return function(e){
				e.preventDefault();
				var $tgt = $(e.target),
					$block = $tgt.closest('div.comment-block'),
					commentId = $block.data('comment');

				$block.spin();
				$M.doquery(url, { _id : commentId}, { 
		        	successfn : function(module){
		        		$tgt.closest('a').find('.vote-span').text(module.cnt);
						$block.spin(false);
		        	},
		            alertPosition : '#sidebar'
		        });
			}
		}

		// 定位赏析区域
		$('#sidebar').on('click', 'a.comment-image-wrap', function(e){
			e.preventDefault();
			var $tgt = $(e.target),
				$block = $tgt.closest('div.comment-block'),
				commentId = $block.data('comment'),
				comment = Module.comments[commentId];

			if(comment){
				var area = comment.area,
					zoom = area.zoom,
					lb = area.bounds;
				if(!comment.layer){

					var northEast = L.CRS.Simple.pointToLatLng(L.point([ lb[0], lb[1] ]), zoom),
						southWest = L.CRS.Simple.pointToLatLng(L.point([ lb[2], lb[3] ]), zoom),
						bounds = L.latLngBounds(southWest, northEast),
						layer = L.rectangle(bounds, {
							color : '#c61c1d',
							fillColor : "#FFFFE0",
							weight: 3,
							opacity: 0.8,
							fillOpacity: 0.1,
							dashArray : '5,3,2',
							lineJoin : 'bevel'
						});
					comment.layer = layer;
				}

				// 关闭侧栏
				Module.setEditState(false);
				// 显示区域，并定位
				Module.drawnItems.clearLayers().addLayer(comment.layer);
				// 移动到位置，并且自动缩放
				Module.map.fitBounds(comment.layer.getBounds(), {maxZoom : zoom});	
			}
		});
		// 赞
		$('#sidebar').on('click','a.upper-vote-ctl', votefn('/comment/upVote'));
		// 踩
		$('#sidebar').on('click','a.down-vote-ctl', votefn('/comment/downVote'));
		// 保存
		$('#sidebar').on('click','a.commit-ctl', function(e){
			e.preventDefault();
			var $tgt = $(e.target),
				$block = $tgt.closest('div.comment-block'),
				commentId = $block.data('comment'),
				textarea = $block.find('textarea.comment-input'),
				content = textarea.val(),
				data = {
					content : content
				};

			$block.spin();
			$M.doquery('/comment/update', { _id : commentId , data :data }, { 
	        	successfn : function(module){
	        		//$block.find().replace();
	        		textarea.replaceWith(module.comment.content);
	        		$block.find('a.commit-ctl').addClass('hide');
	        		$block.find('a.edit-ctl').removeClass('hide');
					$block.spin(false);
	        	},
	            alertPosition : '#sidebar'
	        });
		});

		// 重新编辑
		$('#sidebar').on('click','a.edit-ctl', function(e){
			e.preventDefault();
			var $tgt = $(e.target),
				$block = $tgt.closest('div.comment-block'),
				comment = $block.find('p.comment-content'),
				commentId = $block.data('comment'),
				content = comment.text().trim();
			comment.empty().append('<textarea class="comment-input">' + content+ '</textarea>');
			$block.find('a.commit-ctl').removeClass('hide');
	        $block.find('a.edit-ctl').addClass('hide');
		});

		// 删除
		$('#sidebar').on('click','a.remove-ctl', function(e){
			e.preventDefault();
			var $tgt = $(e.target),
				$block = $tgt.closest('div.comment-block'),
				commentId = $block.data('comment'),
				textarea = $block.find('textarea.comment-input'),
				content = textarea.val();

			$block.spin();
			$M.doquery('/comment/delete', { _id : commentId }, { 
	        	successfn : function(module){
					$block.spin(false);
	        		$block.remove();

	        		var comment = Module.comments[commentId]
	        		if(comment && comment.layer && Module.drawnItems.hasLayer(comment.layer))
	        			 Module.drawnItems.removeLayer(comment.layer);
	        	},
	            alertPosition : '#sidebar'
	        });
		});
	},

	// ====================================================================================================================================
	//    功能函数 
	// ====================================================================================================================================
	// 添加一个comment到边栏上
	pushComment2Sidebar : function(comment, append){
		var $block = $(Module.renderCommentBlock(comment, Module.fileinfo));
        //$('#sidebar div.page-header').after($block);
        if(append){
        	$('#comment-list').append($block);
        }else{
        	$('#comment-list').prepend($block);
        }
		$block.find("img.lazy").lazyload({
			container : "#sidebar",
		    effect : "fadeIn",
		    skip_invisible : false
		});
		Module.comments[comment._id] = comment;
	},

	renderCommentBlock : function(comment, fileinfo){
		var zoom = comment.area.zoom,
			bounds = comment.area.bounds,
			width = bounds[2] -  bounds[0],
			height = bounds[3] - bounds[1],
			x = Math.min( Math.max(bounds[0], 0), fileinfo.size.width - width),
			y = Math.min( Math.max(bounds[1], 0), fileinfo.size.height - height),
			paintingId = fileinfo._id,
			snapindex = Math.floor(x / 30000),
			x = x - snapindex * 30000,
			url = "http://supperdetailpainter.u.qiniudn.com/cagstore/"+ paintingId +"/temp_" + zoom + "_" + snapindex + ".jpg?imageMogr2/crop/!"
				+ width +"x"+ height + "a"+ x +"a"+y;

		return tmpl('commentTmpl', {
			snapurl : url,
			comment : comment,
			width : width,
			height: height
	  	});
	},

	isWebview : function(state){
		return state.view ? /^webview/.test(state.view) : false ;
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
        title: '打开赏析面板'
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
