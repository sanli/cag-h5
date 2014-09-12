//#!本文件由share.js自动产生于Sun Apr 20 2014 22:13:27 GMT+0800 (CST), 产生命令行为: node share.js gen paintings CRUD ..

// Page状态对象
var PG = new $P({
    default :{
        // 查询条件
        cond : {},
        type : 'tag1',
        // 翻页条件
        page : { skip: 0, limit: 10 },
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
        // TODO: 根据Type决定显示类型
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
        if(cond.queryword){
            var reg = 'Reg(' + cond.queryword + ')';
            cond.$or = [ { paintingName : reg } , { author : reg }, { age : reg } ];
            delete cond.queryword;
        }
        // 处理未激活状态的查询
        if(cond.active && cond.active === 'false'){
            cond.active = { $ne : true };
        }

        Module.listPage(type, cond, sortarg, page
            , function(module){
                var $resultTarget = $('#cellTable');
                $M.fillResult($resultTarget, {
                    columns : Module.columns ,
                    cells : module.docs,
                    title : type.toUpperCase() + "数据",
                    bodyId: 'paintingsCellTbody',
                    tempId: 'paintingsCellTable',
                    sort: sort,
                });
                $('#cellTable').spin(false);
                
                if(editing === 'true'){
                    $('.action-ctl').addClass('show-action-ctl').removeClass('action-ctl');
                    $('#enableEditBtn').closest('li').addClass('active');
                }else{
                    $('.action-ctl').addClass('action-ctl').removeClass('show-action-ctl');;
                    $('#enableEditBtn').closest('li').removeClass('active');
                }
            });

        Module.showPagebar(type, cond, page
            , function(html){
                var $pagebar = $('.pagebar');
                $pagebar.empty().append(html);
            });
    },


    // 页面载入的时候绑定各个事件
    bind : function(){
        $('a.importbtn').on('click', function(e){
            Module.onImportFile();
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

        $('.pagebar').on('click','ul.pagination a', function(e){
            e.preventDefault();
            var $a = $(e.target);
            var tgt = $a.attr('href'),
                params = $.deparam(tgt.replace(/^#/,''));
            var state = $.extend({}, PG.state),
                limit = state.page.limit
                state.page.skip = params.skipto * limit;
            
            PG.pushState(state);
        });

        $('#enableEditBtn').click(function(e){
            e.preventDefault();
            var state = $.extend({}, PG.state);
            state.editing = state.editing === 'true' ? 'false' : 'true' ;
            PG.pushState(state);
        });

        $('#cellTable').on('click', 'a.action-edit', function(e){
            var _id = $(e.target).closest('tr').data('_id');
            Module.updateModule(_id);
        });
        $('#cellTable').on('click', 'a.action-remove', function(e){
            var _id = $(e.target).closest('tr').data('_id');
            console.log('delete, _id:' + _id);
            Module.deleteModule(_id);
        });
        $('div.aggregate').on('click', 'a.sortlink', $M.createSortHander(PG));
    },
        
    //====================================================================================================================
    // 事件处理函数
    //====================================================================================================================
    // 删除paintings
    deleteModule: function(_id, options){
        $.ask("删除对象","是否确认删除,删除后不能恢复？", function(){
            $M.dodelete('/paintings/delete'
                , { _id : _id }
                , { successfn : function(){
                        Module.loadPageData(PG.state.cond, PG.state.page);
                    }});
        });
    },

    // 编辑作品信息
    updateModule: function(_id, options){
        // 更新楼宇信息
        updateModule = function(condition, fn, fail){
            $M.doupdate('/paintings/update', condition, { successfn : fn , failfn: fail});
        },
        // 查询楼宇详细信息
        loadDataDetail = function(_id, fn){
            $M.doquery('/paintings/retrive', {_id : _id}
                , { successfn : fn ,
                    alertPosition : '#buildingNavtab'});
        };

        $('#module-form').clearall();
        loadDataDetail(_id, function(module){
            var data = module.doc;
            $('#module-form').clearall().autofill(data, {checkboxAsBoolean : true});
        });

        $.showmodal('#moduleDlg', function(){
            if ($('#module-form').validate().form()){
                // save change
                var data = $('#module-form').getdata({checkboxAsBoolean : true});
                    
                updateModule($.param({ 
                    _id: _id,
                    data: data 
                }), function(result){
                    $('#moduleDlg').modal('hide');
                    Module.loadPageData(PG.state.cond, PG.state.page);
                },
                function(err){
                    $.alert('#moduleDlg .modal-body', err, 10000);
                });
            }
        });
    },

    
    //处理导入数据
    onImportFile : function(){
        $.showmodal('#importDlg', function(dlg){
            var idlist = $('#idListArea').val().split(',');
            $('#importDlg').spin();
            Module.importPaintings(idlist, function(data){

                $.alert('#content-body', '成功导入资源 [' + data.count + "] 条");   
                dlg.modal('hide');
            }, function(errmsg){
                $.alert('#importDlg div.modal-body', '导入资源数据出错:' + errmsg);
                dlg.modal('hide');
            });
            return false;
        });
    },

    //导出当前的查询结果
    importPaintings : function(idlist, fn){
        $M.doupdate('/paintings/import'
            , { idlist: idlist } 
            , { successfn : function(data){
                fn(data);
            } , alertPosition : '#cellDiv' });
    },

    //-----------------------------------------------------
    

    // ========================================================================
    //      功能函数 
    // ========================================================================
    // 根据查询条件和分页条件载入数据页面
    listPage : function(type, cond, sort, page, fn, fail){
        $M.doquery('/paintings/list'
            , { type: type, cond : cond, page: page} 
            , { successfn : fn , failfn : fail , alertPosition : '#cellDiv' });
    },

    showPagebar : function(type, cond, page, fn){
        $M.doquery('/paintings/count'
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
};

$(document).ready(init);