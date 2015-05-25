//#!本文件由share.js自动产生于Thu May 07 2015 12:12:08 GMT+0800 (CST), 产生命令行为: node share.js gen bookmark CRUD ..

// Page状态对象
var PG = new $P({
    default :{
        // 查询条件
        cond : {},
        // 翻页条件
        page : { skip: 0, limit: 20 },
        // 排序字段
        sort : { by : '_id', order : 1 },
        editing : false,
        searching : false
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
        // 初始化查询条件
    },

    // 根据页面状态，载入数据
    loadPageData: function(stateCond, page){
        $('#cellDiv').spin();
        var editing = PG.state.editing,
            searching = PG.state.searching,
            sort = PG.state.sort 
            sortarg = {},
            cond = $.extend({},stateCond);
        sortarg[sort.by] = sort.order;
    },


    // 页面载入的时候绑定各个事件
    bind : function(){
        $('#createbtn').on('click', function(e){
            Module.createModule();
            e.preventDefault();
        });
        $('nav.sub-navbar').affix({ 
            offset: { top: 50 } 
        }).on('affix.bs.affix', function(e){
            $('#mainContent').addClass('affixed');
            $('div.main-navbar').addClass('moveout');
        }).on('affix-top.bs.affix', function(e){
            $('#mainContent').removeClass('affixed');
            $('div.main-navbar').removeClass('moveout');
            $.art_is_fun();
        });$.art_is_fun();
        
        $('a.btn-download').click(function(e){
            $tgt = $(e.target);
            if($tgt.hasClass('btn-default')){
                e.preventDefault();
                $.message('暂时不能下载','这个资源还没有准备好，或者暂时不能开放下载，请等一段时间。', 3000)   
            }
        });
    },
 
    //====================================================================================================================
    // 事件处理函数
    //====================================================================================================================
    

    // ========================================================================
    //      功能函数 
    // ========================================================================


});

function init(){
    Module.bind();
    PG.bind();
    $(window).trigger('hashchange');
};

$(document).ready(init);