//#!本文件由share.js自动产生于<M%=new Date() %M>, 产生命令行为: node share.js gen <M%=module_name %M> IMPORT ..
<M%
/**
 * IMPORT功能前端JS模板
 * 1. 列表展示
 * 2. 查询
 * 3. 导入数据
 */
%M>
// Page状态对象
var PG = new $P({
    default :{
        // 查询条件
        cond : {},
        type : 'aabis',
        // 翻页条件
        page : { skip: 0, limit: 20 },
        // 排序字段
        sort : { cellid : 1 },
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
        $('#search-form').clearall().autofill(state.cond);
        $('#detail-search-form').clearall().autofill(state.cond);

        var type = PG.state.type;
        $('#navtab li').removeClass('active');
        $('#navtab a[href="#type='+ type +'"]').closest('li').addClass('active');
        //以下设置其它控件状态
    },

    //根据页面状态，载入数据
    loadPageData: function(stateCond, page){
        $('#cellTable').spin();
        var type = PG.state.type,
            title = type + '数据',
            editing = PG.state.editing,
            sort = PG.state.sort 
            sortarg = {},
            cond = $.extend({},stateCond);
        sortarg[sort.by] = sort.order;

        // 处理需要做正则表达式查询的条件
        if(cond.buildingId)
            cond.buildingId = 'Reg(' + cond.buildingId + ')';

        Module.listPage(type, cond, sortarg, page
            , function(module){
                var $resultTarget = $('#cellTable');
                $M.fillResult($resultTarget, {
                    columns : Module.columns ,
                    cells : module.docs,
                    title : type.toUpperCase() + "数据",
                    bodyId: type + 'cellTbody',
                    tempId : type + 'CellTable',
                    sort: sort,
                });
                $('#cellTable').spin(false);
                
                if(editing === 'true'){
                    $('.action-ctl').addClass('show');
                    $('#enableEditBtn').closest('li').addClass('active');
                }else{
                    $('.action-ctl').removeClass('show');
                    $('#enableEditBtn').closest('li').removeClass('active');
                }
            });

        Module.showPagebar(type, cond, page
            , function(html){
                var $pagebar = $('#pagebar');
                $pagebar.empty().append(html);
            });
    },


    // 页面载入的时候绑定各个事件
    bind : function(){
        $('a.importbtn').on('click', function(e){
            var type = PG.state.type;
            Module.onImportFile(type);
        });

        $('#search-form').keypress(function(e){
            if ( event.which == 13 ) {
                e.preventDefault();
                var search = $('#search-form').getdata({skipEmpty : true});
                var state = $.extend({}, PG.state);
                state.cond = search;
                state.page.skip = 0;
                PG.pushState(state);
            };
        });
        // 详细条件查询
        $('#detailSearchBtn').click(function(e){
            var search = $('#detail-search-form').getdata({skipEmpty : true});
            var state = $.extend({}, PG.state);
            state.cond = search;
            state.page.skip = 0;
            PG.pushState(state);
        });
                
        $('#typeQueryBtn').click(function(){
            var cond = $("#highlight-form").getdata();
            Module._querycell(cond, Module.showPageHander(cond.type));
        });
        $('#pagebar').on('click','div.pagination a', function(e){
            e.preventDefault();
            var $a = $(e.target);
            var tgt = $a.attr('href'),
                params = $.deparam(tgt.replace(/^#/,''));
            var state = $.extend({}, PG.state),
                limit = state.page.limit
                state.page.skip = params.skipto * limit;
            
            PG.pushState(state);
        });
        $('#exportBtn').click(Module.onExport);
        $('div.aggregate').on('click', 'a.sortlink', $M.createSortHander(PG));
        $('#extendBtn').click($.expandContent);
    },
        
    //====================================================================================================================
    // 事件处理函数,处理各个按钮事件
    //====================================================================================================================


    // ========================================================================
    //      功能函数 
    // ========================================================================
    // 根据查询条件和分页条件载入数据页面
    listPage : function(type, cond, sort, page, fn, fail){
        $M.doquery('/<M%=module_name %M>/list'
            , { type: type, cond : cond, page: page} 
            , { successfn : fn , failfn : fail , alertPosition : '#cellDiv' });
    },

    showPagebar : function(type, cond, page, fn){
        $M.doquery('/<M%=module_name %M>/count'
            , { type: type, cond: cond }
            , { successfn : function(module){
                var pagebarHtml = renderPagebar("pagebarTpl", module.count, page);
                fn(pagebarHtml);
            }});
    }
    // ========== 请尽量在这一行后面加入扩展代码 ==========

});

function init(){
    Module.bind();
    PG.bind();
    $(window).trigger('hashchange');
    PG.loadCity();
};

$(document).ready(init);