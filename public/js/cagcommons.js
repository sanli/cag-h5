//sfmiscommons.js
/**
 * 扩展一些SFMis独有的功能函数, 需要在sharepage.js之后载入
 */
!function ($P) {
    "use strict";

    var fn = $P.prototype;
    fn.getuser = function(fn){
        if (PG.user)
            return fn(null, PG.user);
        $M.doquery('/getloginuser', {}, 
            { 
                successfn : function(data){
                    PG.user = data.user;
                    fn(null, PG.user);
                }, 
                failfn: function(data){
                    fn(new Error(data));
                }
            });
    };

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

    fn.getcellinfo = function(cellid, type, fn, fail){
        $M.doquery('/cell/getcellinfo'
            , { cellid: cellid, type: type } 
            , { successfn : fn , failfn : fail });
    };

    fn.caclCoverState = function(cellids, type, fn, fail){
        // 如果Cell ID为空，直接短路输出
        if( cellids.length === 0){
            return fn( { coverState : '未覆盖' } );
        }
        $M.doquery('/cell/calcCoverState' 
            , { cellids: cellids, type: type } 
            , { successfn : fn , failfn : fail });
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
    // 
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
    }
  });
})(window.jQuery);