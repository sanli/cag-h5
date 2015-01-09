//PG对象是整个页面的驱动对象，页面的状态在PG对象的state中保存
var PG = new $P({
  default: {
    uuid: '5380542cab18e5515c68a7df'
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
      // 载入数据
      Module.loadPageData(state);
  },

  // 根据页面状态，载入数据
  loadPageData: function(state, page){
    // load painting data
    $('div.main').spin();
    var fileinfo = Module.fileinfo;
    document.title = fileinfo.age + '_' + fileinfo.author + '_' + fileinfo.paintingName + "_中华珍宝馆离线图片",
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
      maxBounds: bounds,
      minZoom: fileinfo.minlevel,
        crs: L.CRS.Simple,
        fullscreenControl: true
    }).fitBounds( bounds ); 

    var la = state.layer || '',
      detectRetina = fileinfo.maxlevel - fileinfo.minlevel >= 4;
      
    Module.tileLayer = L.tileLayer('{z}' + la + '/{x}_{y}.jpg', { 
       bounds: bounds,
       maxZoom: fileinfo.maxlevel,
       detectRetina: detectRetina
    }).addTo(map);

    map.attributionControl
      .setPrefix('<a href="' + Module.baseurl + 'main.html?l=offline">中华珍宝馆</a>')
      .addAttribution('<a data-toggle="modal" href="#help">帮助</a>');

    setTimeout(function(){
		if(Module.online)
     		map.attributionControl
     	  	.addAttribution(' | <a href="' + Module.baseurl + 'img.html?uuid=' + Module.uuid + '&l=offline#uuid=' + Module.uuid + '&view=paintingview">切换在线图片</a>');
    },3000);
    
    Module.initMap(map);
    $('div.main').spin(false);
  },

  // 初始化图片，创建控件
  initMap : function(map){
  	map.on('dragstart', function(){
		$('div.leaflet-control-attribution').addClass('popup');
	});
	map.on('dragend', function(){
		$('div.leaflet-control-attribution').removeClass('popup');
	});
  },

  // 绑定事件处理函数
  bind : function(){
  	//TODO:
  }

  // ====================================================================================================================================
  //    功能函数 
  // ====================================================================================================================================
});

function init(){
  detectOnline();
  PG.bind();
  Module.bind();
  $(window).trigger('hashchange');
};
function detectOnline(){
	var a =  document.createElement('script');
	a.async = 1
	a.src= Module.baseurl + "detect.js";
	var m=document.getElementsByTagName('script')[0];
	m.parentNode.insertBefore(a,m);
}
