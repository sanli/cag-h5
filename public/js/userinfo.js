//#!本文件由share.js自动产生于Wed Apr 15 2015 15:56:21 GMT+0800 (CST), 产生命令行为: node share.js gen tourist CRUD ..

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
        $('#search-form').clearall().autofill(state.cond);
        $('#detail-search-form').clearall().autofill(state.cond);
    },

    // 处理查询条件
    _processSearchCond : function(cond){
        // TODO: 处理需要做正则表达式查询的条件
        if(cond.moduleName)
            cond.moduleName = 'Reg(' + cond.moduleName + ')';
    },

    // 根据页面状态，载入数据
    loadPageData: function(stateCond, page){
        var editing = PG.state.editing,
            searching = PG.state.searching,
            sort = PG.state.sort 
            sortarg = {},
            cond = $.extend({},stateCond);
        sortarg[sort.by] = sort.order;
        Module._processSearchCond(cond);
        $.showSearchBlock($('#searchPanel'), searching, $('#searchBtnGroup'));

        PG.getuser(function(err, user){
            Module.updateModule(user.tourist._id);
        });
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
            $.art_is_fun();
        }).on('affix-top.bs.affix', function(e){
            $('#mainContent').removeClass('affixed');
            $('div.main-navbar').removeClass('moveout');
            $.art_is_fun('hide');
        });
        $('#search-form').keypress(function(e){
            if (event.which == 13 ) {
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
        // 翻页
        $('#pagebar').on('click','ul.pagination a', function(e){
            e.preventDefault();
            var $a = $(e.target);
            var tgt = $a.attr('href'),
                params = $.deparam(tgt.replace(/^#/,''));
            var state = $.extend({}, PG.state),
                limit = state.page.limit
                state.page.skip = params.skipto * limit;
            PG.pushState(state);
        });
        // 开启查询模式
        $('#searchBtnGroup').on('change', 'input[name=searchBtn]', function(e){
            var state = PG.state;
            state.searching = $('#searchBtnGroup :checked').val();
            $.showSearchBlock($('#searchPanel'), state.searching);
            PG.pushState(state, { triggerEvent : false });
        });
        // 开启编辑模式
        $('#editingBtnGroup').on('change', 'input[name=editingBtn]', function(e){
            e.preventDefault();
            var state = PG.state;
            state.editing = $('#editingBtnGroup :checked').val();
            $.showControlBlock($('#cellDiv'), state.editing);
            PG.pushState(state, { triggerEvent : false });
        });
        // 修改数据
        $('#cellDiv').on('click', 'a.action-edit', function(e){
            var _id = $(e.target).closest('tr').data('_id');
            Module.updateModule(_id);
        });
        // 删除数据
        $('#cellDiv').on('click', 'a.action-remove', function(e){
            var _id = $(e.target).closest('tr').data('_id');
            console.log('delete, _id:' + _id);
            Module.deleteModule(_id);
        });
        // 导出数据
        $('#exportbtn').click(Module.onExport);
        // 字段排序
        $('#cellDiv').on('click', 'a.sortlink', $M.createSortHander(PG));
    },
 
    //====================================================================================================================
    // 事件处理函数
    //====================================================================================================================
    // 编辑tourist信息
    updateModule: function(_id, options){
        _updateModule = function(condition, fn, fail){
            $M.doupdate('/tourist/tupdate', condition, { successfn : fn , failfn: fail});
        },
        // 查询详细信息
        _loadDataDetail = function(_id, fn){
            $M.doquery('/tourist/tretrive', {_id : _id}
                , { successfn : fn ,
                    alertPosition : '#cellDiv'});
        };

        //载入选中对象的具体数据
        $('#module-form').clearall();
        _loadDataDetail(_id, function(module){
            var data = module.doc;
            $('#module-form').autofill(data);

            // TODO:autofill不能填充的数据在这里手工填充
            // ...
        });
        
        //弹出对话框
        $('#module-form').on('submit',function(event){
            event.preventDefault();
            if ($('#module-form').validate().form()){
                // save change
                var data = $('#module-form').getdata({checkboxAsBoolean : true});
                // TODO: getdata不能自动获取的数据在这里手工获取
                // ...

                _updateModule({ 
                    _id: _id,
                    data: data 
                }, function(result){
                    $('#moduleDlg').modal('hide');
                    $.alert('#module-form', "保存成功", 10000);
                },
                function(err){
                    $.alert('#module-form', err, 10000);
                });
            }
        });
    },

    //文件上传完成,预览并准备导入
    onFileUploadSuccess: function(id, filename){
        var dlg = $('#importDlg');
        dlg.data('filename', filename).data('fileid', id);
        //TODO:需要处理同时上传同名文件的情况
        Module.previewImportFile(filename, function(content){
            $("#previewDiv").empty().html(content.data);
        }, function(errmsg){
            $.alert('#previewDiv', '预览文件错误：' + errmsg);
        });
    },
    // ========== 请尽量在这一行后面加入扩展代码 ==========

});

function init(){
    Module.bind();
    PG.bind();
    $(window).trigger('hashchange');
};

$(document).ready(init);