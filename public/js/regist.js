//#!本文件由share.js自动产生于Wed Apr 15 2015 15:56:21 GMT+0800 (CST), 产生命令行为: node share.js gen tourist CRUD ..

// Page状态对象
var PG = new $P({
    default :{
        
    },

    bind: function(){
        this.bindhash();
        $(PG).on('statechange', Module.onPageStateChange);
    }
});

var Module = $.extend(new $M(), {
    // =========================================================================
    //  PageStateChage是功能的入口,一般由某个界面事件触发出状态改变，再由状态的改变，
    //  触发某个页面载入动作或者是重新渲染
    // =========================================================================
    onPageStateChange : function (){
        var state = PG.state;
        
        // 初始化页面各个控件的状态
        Module.applyPageState(state);
        // 载入数据
        Module.loadPageData(state.cond, state.page);
    },

    applyPageState : function(state){
    
    },

    // 根据页面状态，载入数据
    loadPageData: function(stateCond, page){
        
    },


    // 页面载入的时候绑定各个事件
    bind : function(){
        $('nav.sub-navbar').affix({ 
            offset: { top: 50 } 
        }).on('affix.bs.affix', function(e){
            $('#mainContent').addClass('affixed');
            $('div.main-navbar').addClass('moveout');
        }).on('affix-top.bs.affix', function(e){
            $('#mainContent').removeClass('affixed');
            $('div.main-navbar').removeClass('moveout');
        });
        $('#regbtn').on('click', function(e){
            Module.createModule();
            e.preventDefault();
        });
    },
 
    //====================================================================================================================
    // 事件处理函数
    //====================================================================================================================
    //需要新建一个tourist
    createModule: function(){
        function _createModule(condition, fn, fail){
            $M.doupdate('/tourist/create', condition, { successfn : fn , failfn: fail});
        };

        if($('#module-form').validate().form()){
            // save change
            var data = $('#module-form').getdata({checkboxAsBoolean : true});
                
            _createModule({ data: data }, function(result){
                $.alert('#moduleDlg .modal-body', '注册成功，3秒后会自动跳转到<a href="/tourist/userinfo.html">您的信息</a>界面...', 10000);
                setTimeout(function(){
                    window.location.href="/main.html";
                }, 1000);
            }, function(err){
                $.alert('#moduleDlg .modal-body', err, 10000);
            });
        }
    },

    // ========================================================================
    //      功能函数 
    // ========================================================================
    // 根据查询条件和分页条件载入数据页面
    checkuser : function(cond, sort, page, fn, fail){
        $M.doquery('/tourist/list'
            , { cond : cond, page: page, sort: sort} 
            , { successfn : fn , failfn : fail , alertPosition : '#cellDiv' });
    },

    checkemail : function(cond, sort, page, fn, fail){

    }

    // ========== 请尽量在这一行后面加入扩展代码 ==========

});

function init(){
    Module.bind();
    PG.bind();
    $(window).trigger('hashchange');
};

$(document).ready(init);