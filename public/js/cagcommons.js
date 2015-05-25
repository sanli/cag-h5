//sfmiscommons.js
/**
 * 扩展一些cagcommons独有的功能函数, 需要在sharepage.js之后载入
 */
!function ($P) {
    "use strict";

    var fn = $P.prototype;
    fn.getuser = function(fn, opt){
        opt = opt || { 
            asklogin : true,
            asktitle : "请先登录中华珍宝馆，随后这幅画会加入到您的收藏中"
        };
        if (PG.userinfo)
            return fn(null, PG.userinfo);
        $M.doquery('/whoami', {}, 
            { 
                successfn : function(data){
                    if(data.tourist){
                        PG.userinfo = data;
                        fn(null, PG.userinfo);    
                    }else if(opt.asklogin){
                        PG.asklogin(fn, { 
                            title : opt.asktitle
                        });
                    }else{
                        fn(null);
                    }
                },
                failfn: function(data){
                    fn(new Error(data));
                }
            });
    };

    fn.islogin = function(){
        return !!PG.userinfo;
    }

    fn.asklogin = function(fn, opt){
        opt = opt || { title : "登录到中华珍宝馆" };
        //弹出对话框
        $.showmodal('#loginDlg',  function(){
            if ($('#login-form').validate().form()){
                // save change
                var data = $('#login-form').getdata({checkboxAsBoolean : true});

                $('#login-form').spin();
                $M.doquery("/tourist/login", { data: data }
                    ,{  
                        successfn : function(result){
                            $('#login-form').spin('false');
                            fn(result.userinfo);
                            $('#loginDlg').modal('hide');
                        }, 
                        alertPosition : '#loginDlg .modal-body'
                    });
            }
        }, null, {  title : opt.title });
    }

    fn.loadCity = function( options ){
        options = options || { el : "#deptId"}
        var PG = this, 
            $el = $(options.el);
        $.getJSON("/cityDept.json", function(citys) {

            $el.each(function(idx, element){
                var $one = $(element);
                $.each(citys, function(i, city){
                    $one.append("<option value='"+city.deptId+"'>"+city.city+"</option>"); 
                });    
            });

            PG.getuser(function(err, user){
                if(err) return ;
                if(user && user.deptId){
                    $el.val(user.deptId);
                    if (user.deptId !=="1"){
                        $el.prop('disabled', 'disabled');
                    }
                }                  
            });
        });
    };

    fn.loadSysconf = function(fn, fail){
        $M.doquery('/sysconf/retrive', {}
            , { successfn : function(res){
                fn(res.doc);
            }, failfn : fail });
    };
}($P);


/**
 * 一些基本功能函数，做一些通用的页面操作,一般和页面上的某个元素互动
 * $.expandContent : 扩大或者缩小主操作区域
 */
(function ($) {
  "use strict";
  $.extend({
    // 扩大或者缩小主操作区域
    expandContent : function(expand){
      var $serviceCtlBar = $('#serviceCtlBar'),
          $mainContent = $('#mainContent'),
          $icon = $('#extendBtn i');

        if(expand === false){
            $serviceCtlBar.removeClass('span9').addClass('span12');
            $mainContent.removeClass('span9').addClass('span12');
            $icon.removeClass('icon-arrow-right')
                .closest('li').removeClass('active');
            return;
        }else if(expand === true){
            $serviceCtlBar.removeClass('span12').addClass('span9');
            $mainContent.removeClass('span12').addClass('span9');
            $icon.addClass('icon-arrow-right')
                .closest('li').addClass('active');
            return;
        }

        if($serviceCtlBar.hasClass('span9')){
            $serviceCtlBar.removeClass('span9').addClass('span12');
            $mainContent.removeClass('span9').addClass('span12');
            $icon.removeClass('icon-arrow-right')
                .closest('li').removeClass('active');
        }else{
            $serviceCtlBar.removeClass('span12').addClass('span9');
            $mainContent.removeClass('span12').addClass('span9');
            $icon.addClass('icon-arrow-right')
                .closest('li').addClass('active');
        }
    },

    //显示删除修改等控制条，加上了简单的动画
    showControlBlock : function($cell, editing, $showBtnGroup){
        var isEditing = editing === true || editing === 'true';
        if(isEditing){
            $cell.find('.action-ctl').addClass('show');
            setTimeout(function(){ 
                $cell.find('.action-ctl').addClass('in'); 
            }, 100); // 延后100毫秒，否则动画不能正常显示
        }else{
            $cell.find('.action-ctl').removeClass('show').removeClass('in');
        }

        if($showBtnGroup) { 
            //重新设置按钮状态
            $($showBtnGroup.find('label.btn').removeClass('active')[ isEditing ? 1 : 0]).addClass('active');
        }        
    },

    //显示查询控制条，加上了简单的动画
    showSearchBlock : function($searchPanel, searching, $searchBtnGroup){
        var show = (searching === true || searching === 'true');
        if(show){
            $searchPanel.addClass('show');
            setTimeout(function(){ $searchPanel.addClass('in'); }, 100); // 延后100毫秒
        }else{
            $searchPanel.removeClass('in').removeClass('show');  // 延后100毫秒
        };

        if($searchBtnGroup) { 
            //重新设置按钮状态
            $($searchBtnGroup.find('label.btn').removeClass('active')[ show ? 1 : 0]).addClass('active');
        }
    },
    // 这是我的一个小彩蛋
    art_is_fun: function(hide){
        if(!hide){
            if($('#art-is-fun').length > 0){
                $.get('/art_is_fun', function(data){
                    $('#art-is-fun').addClass('in').text(data);
                });
            }
        }else{
            $('#art-is-fun').removeClass('in');
        }
        
    }
  });
})(window.jQuery);



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