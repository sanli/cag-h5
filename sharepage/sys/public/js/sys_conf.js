//#!本文件由share.js自动产生于Thu Mar 13 2014 10:46:30 GMT+0800 (CST), 产生命令行为: node share.js gen sysconf CRUD ..

// Page状态对象
var PG = new $P({
    default :{
        // 查询条件
        cond : {},
        type : 'global',
        // 翻页条件
        page : { skip: 0, limit: 20 },
        // 排序字段
        sort : { cellid : 1 },
        category : "global"
    },

    bind: function(){
        this.bindhash();
        $(PG).on('statechange', Module.onPageStateChange);
    },

    categorys : ['global', 'suggestion_needbuilding', 'suggestion_needoptimization'
        , 'suggestion_needmarket', 'suggestion_needspread' 
        , 'laterevaluate_gsm', 'laterevaluate_td', 'laterevaluate_wlan', 'admin_message'
        ,'dashboard_auditeanalysis']
});

var Module = $.extend(new $M(), {

    // =========================================================================
    //  PageStateChage是功能的入口,一般由某个界面事件触发出状态改变，再由状态的改变，
    //  触发某个页面载入动作或者是重新渲染
    // =========================================================================
    onPageStateChange : function (){
        var state = PG.state;
        
        if(!PG.loadOnce){
            // 载入数据
            Module.loadPageData(state.cond, state.page);
            PG.loadOnce = true
        }

        // 初始化页面各个控件的状态
        Module.applyPageState(state);
    },

    applyPageState : function(state){
        var type = PG.state.type;
        // TODO: 根据Type决定显示类型
        var coll = $('#coll_' + type);
        if(coll && !coll.hasClass('in'))
            coll.collapse('show');
    },

    //根据页面状态，载入数据
    loadPageData: function(stateCond, page){
        $('#content-body').spin();
        var type = PG.state.type,
            title = type + '数据',
            editing = PG.state.editing,
            sort = PG.state.sort 
            sortarg = {},
            cond = $.extend({},stateCond);
        sortarg[sort.by] = sort.order;

        Module.loadSysconfMeta(function(module){
            var sysconfMeta = module.doc;
            Module.loadDataDetail(function(module){
                var sysconf = module.doc;
                var $resultTarget = $('#sysconfTable');

                $M.fillResult($resultTarget, {
                    columns : Module.columns ,
                    sysconfMeta : sysconfMeta ,
                    sysconf : sysconf ,
                    categorys : PG.categorys ,
                    type: type,
                    tempId : 'sysconfCellTable',
                });
                $('#content-body').spin(false);
            });
        });
    },


    // 页面载入的时候绑定各个事件
    bind : function(){
        $('a.importbtn').on('click', function(e){
            var type = PG.state.type;
            Module.onImportFile(type);
        });

        $('#sysconfTable').on('click','button.savebtn', function(e){
            e.preventDefault();

            var $button = $(e.target),
                $form = $button.closest('form');
            if($form.validate().form()){
                var data = $form.getdata(),
                    category = $form.data('category'),
                    updater = {};
                updater[category] = data;
                $button.spin();
                Module.updateModule({_id: 'all_sys_conf', data: updater }, function(){
                    $button.spin(false);
                },
                function(err){
                    $.alert('#sysconfTable', err, 10000);
                })
            };
        });

        $('#sysconfTable').on('show','div.accordion-body', function(e){
            $div = $(e.target);
            type = $div.data('category');
            PG.pushState({type : type});
        });
    },
        
    //====================================================================================================================
    // 事件处理函数
    //====================================================================================================================
    onUpdateSysconf : function(){
        if ($('#module-form').validate().form()){
            // save change
            var data = $('#module-form').getdata();
                
            updateModule($.param({ 
                _id: _id,
                data: data 
            }), function(result){
                Module.loadDataDetail(PG.state.cond, PG.state.page);
            },
            function(err){
                $.alert('#content-body .modal-body', err, 10000);
            });
        }
    },

    // ========================================================================
    //      功能函数 
    // ========================================================================
    // 查询详细信息
    loadDataDetail : function(fn){
        $M.doquery('/sysconf/retrive', {}
            , { successfn : fn ,
                alertPosition : '#content-body'});
    },

    loadSysconfMeta : function(fn){
        $M.doquery('/sysconf/retriveMeta', {}
            , { successfn : fn ,
                alertPosition : '#content-body'});
    },

    // 更新楼宇信息
    updateModule : function(condition, fn, fail){
        $M.doupdate('/sysconf/update', condition, { successfn : fn , failfn: fail});
    },

    // 根据查询条件和分页条件载入数据页面
    // ========== 请尽量在这一行后面加入扩展代码 ==========

});

function init(){
    Module.bind();
    PG.bind();
    $(window).trigger('hashchange');
    PG.loadCity();
};

$(document).ready(init);