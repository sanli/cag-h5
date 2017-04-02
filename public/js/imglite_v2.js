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
		var height = fileinfo.size.height;
        var width = fileinfo.size.width;
        var maxlevel = fileinfo.maxlevel;
        //var minlevel = fileinfo.minlevel;
        var minlevel = 12;

        var ratio = Math.pow(2, maxlevel - minlevel);
        var minmap_width = Math.floor(width / ratio);
        var minmap_height = Math.floor(height / ratio);
        var minmap_top = 0;
        var minmap_left = $("#imgview").width() - minmap_width - 0 ;
        var viewOptions = {
            //debugMode: true,
            id: "imgview",
            prefixUrl:     "/images/",
            // Render the best closest level first, ignoring the lowering levels which provide the effect of very blurry to sharp. 
            // It is recommended to change setting to true for mobile devices.
            immediateRender : true,
            placeholderFillStyle : '#00ff00',
            visibilityRatio: 1.0,
            maxZoomPixelRatio : 1.5,
            preserveImageSizeOnResize : true,
            // 减小内存使用
            maxImageCacheCount : 128,
            // 减小CPU使用 
            // useCanvas : false,
            // visibilityRatio: 0.96,
            // defaultZoomLevel : 4,
            // showRotationControl: true,
            // sequenceMode: true,
            // showNavigator:  true,
            // showReferenceStrip: true,
            // gestureSettingsTouch : {
            //    pinchRotate : true
            //},
            // 只在网页版显示缩略图
            controlsFadeDelay : 1800,
            controlsFadeLength : 1600,
            tileSources:   [{
                height : height,
                width : width,
                tileSize: 512,
                minLevel: minlevel,
                maxLevel: maxlevel,
                getTileUrl: function( level, x, y ){
                    // return "http://cag.share-net.cn/cagstore/" + uuid + "/" + (level + 13) + "/" + x + "_" + y + ".jpg";
                    return _media("/cagstore/" + state.uuid + "/" + level + "/" + x + "_" + y + ".jpg");
                }
            }],
        };

        var viewer = Module.viewer = OpenSeadragon(viewOptions);
        // 聚焦到cavas上，才可以通过键盘控制
        document.getElementById('imgview').querySelector('.openseadragon-canvas').focus();
		Module.initViewer(viewer, fileinfo);
		$('div.main').spin(false);
    },

    // 这个函数由
    toggleEditState : function(){
    	if(!Module.commentsLoaded){
    		Module.loadInfo( Module.fileinfo._id);
    		Module.commentsLoaded = true;
    	}

    	Module.setEditState(!Module.editing);
    },

    // 计算图片物理尺寸对应的像素尺寸
    calcPixelsPerMeter : function(fileinfo){
    	var size = /([\d\.]+)[xX*]([\d\.]+)/.exec(fileinfo.areaSize);
    	if(!size) return null;
		// 物理尺寸，一般单位是cm
		var pyheight = parseFloat(size[1]);
		var pywidth = parseFloat(size[2]);
		function _calc(pix, py){
			if(!isNaN(py))
				return pix * 100 / py;  // 物理尺寸的单位是厘米	
			return null;
		}

		// 使用比较短的一条边来计算比例，因为比较短的边一般来说不会被截取掉能够得到稍微精确的结果
		var ratio = null;
		if(fileinfo.size.width < fileinfo.size.height){
			if( (ratio = _calc(fileinfo.size.width, pywidth)) != null ) return ratio;
			if( (ratio = _calc(fileinfo.size.height, pyheight))!= null ) return	ratio;
		}else{
			if( (ratio = _calc(fileinfo.size.height, pyheight)) != null ) return ratio;
			if( (ratio = _calc(fileinfo.size.width, pywidth)) != null ) return ratio;
		}
		return null;
    },

    // 初始化图片，创建控件
    initViewer : function(viewer, fileinfo){
    	// 创建比例尺
		if (fileinfo.areaSize) {
        	var pixelsPerMeter = Module.calcPixelsPerMeter(fileinfo);
        	if(pixelsPerMeter){
        		viewer.scalebar({
				  	minWidth: '75px',
				  	pixelsPerMeter: pixelsPerMeter,
				  	boundsarThickness : 1,
				  	stayInsideImage : false,
					color : '#a1412d',
					fontColor : '#a1412d',
				});
        	}
        }


        if(!Module.isWebview()){
        	// 加入button
			var buttons = [];
			buttons.push( new OpenSeadragon.Button({
	            tooltip:    '显示相关信息',
	            srcRest:    '/images/info_rest.png',
	            srcGroup:   '/images/info_grouphover.png',
	            srcHover:   '/images/info_hover.png',
	            srcDown:    '/images/info_pressed.png',
	            onClick:     function(){ 
	            	Module.toggleEditState();
	            }
	        }));
			buttons = new OpenSeadragon.ButtonGroup({
	    		buttons: buttons
	        });
	        var navControl  =  buttons.element;
	        Module.viewer.addControl(
	            navControl,
	            { anchor: OpenSeadragon.ControlAnchor.BOTTOM_RIGHT }
	        );	
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
    	$panel = $('#infopanel');

    	if(isEditing){
    		$panel.show();
    		setTimeout(function(){
    			$panel.addClass('in');
    		}, 100);
    	}else{
    		$panel.removeClass('in').one($.support.transition.end, function(){
    			$panel.hide();
    		});
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

		$('#infopanel button.close').on('click', function(){
			Module.setEditState(false);
		});
	},

	// ====================================================================================================================================
	//    功能函数 
	// ====================================================================================================================================
	// 添加一个comment到边栏上
	pushInfo2Sidebar : function(info){
		// 多说
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

	isWebview : function(){
		return PG.state.view ? /^webview/.test(PG.state.view) : false ;
	},

	pin : function(e){
		if($('#bookmarkbtn').data('bookmarked'))
			return;

		$('#bookmarkbtn').attr('disabled', true);
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
                    	.data('bookmarked', true).attr('disabled', false);
                }, 
                alertPosition : '#loginDlg .modal-body'
			});
		}, { asklogin : true });
	}
});


function init(){
	$('div.main').spin();
	PG.bind();
	Module.bind();
	$(window).trigger('hashchange');
};


// 按钮控件
// var MyControl = L.Control.extend({
//     options: {
//         position: 'topright',
//         title: '打开信息面板'
//     },

//     onAdd: function (map) {
//         var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control my-custom-control');
//         this.link = L.DomUtil.create('a', 'glyphicon glyphicon-pencil', container);
//         this.link.title = this.options.title;
//         L.DomEvent.on(this.link, 'click', this._click, this);
//         return container;
//     },

//     _click : function(e){
//     	L.DomEvent.stopPropagation(e);
// 		L.DomEvent.preventDefault(e);
// 		this.click(e);
//     },

//     click : function(e){
//     	console.log("should replace with implementing.");
//     }
// });

$(document).ready(init);
