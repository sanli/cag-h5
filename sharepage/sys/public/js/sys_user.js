//#!本文件由share.js自动产生于Fri Sep 19 2014 17:09:24 GMT+0800 (CST), 产生命令行为: node share.js gen sysuser CRUD ..

// Page状态对象
var PG = new $P({
    default :{
        // 查询条件
        cond : {},
        // 翻页条件
        page : { skip: 0, limit: 20 },
        // 排序字段
        sort : { by : "city" , order: -1 },
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

    // 根据页面状态，载入数据
    loadPageData: function(stateCond, page){
        $('#cellDiv').spin();
        var editing = PG.state.editing,
            searching = PG.state.searching,
            sort = PG.state.sort 
            sortarg = {},
            cond = $.extend({},stateCond);
        sortarg[sort.by] = sort.order;

        // 处理需要做正则表达式查询的条件
        if(cond.moduleName)
            cond.moduleName = 'Reg(' + cond.moduleName + ')';
        $.showSearchBlock($('#searchPanel'), searching, $('#searchBtnGroup'));

        // 加载数据表
        Module.listPage(cond, sortarg, page
            , function(module){
                var $resultTarget = $('#cellTable');
                $M.fillResult($resultTarget, {
                    columns : Module.columns ,
                    cells : module.docs,
                    tempId : 'cellTableTmpl',
                    sort: sort,
                });
                $('#cellDiv').spin(false);
                $.showControlBlock($('#cellDiv'), editing, $('#editingBtnGroup'));                
            });

        // 加载分页条
        Module.showPagebar(cond, page
            , function(html){
                var $pagebar = $('#pagebar');
                $pagebar.empty().append(html);
            });
    },


    // 页面载入的时候绑定各个事件
    bind : function(){
        $('#createbtn').on('click', function(e){
            Module.createModule();
            e.preventDefault();
        });

        $('a.importbtn').on('click', function(e){
            Module.onImportFile();
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
                
        // 创建文件上传组件，TODO：将会移动到一个统一的函数中实现
        // Module.createUploader("#fileUploader", Module.onFileUploadSuccess);

        // 翻页
        $('#pagebar').on('click','.pagination a', function(e){
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
        $('#cellDiv').on('change', 'input[name=editingBtn]', function(e){
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
    //需要新建一个sysuser
    createModule: function(){
        function _createModule(condition, fn, fail){
            $M.doupdate('/sysuser/create', condition, { successfn : fn , failfn: fail});
        };

        $('#module-form').clearall();
        $.showmodal('#moduleDlg', function(){
            if ($('#module-form').validate().form()){
                // save change
                var data = $('#module-form').getdata({checkboxAsBoolean : true});
                    
                _createModule({ data: data }, function(result){
                    $('#moduleDlg').modal('hide');
                    Module.loadPageData(PG.state.cond, PG.state.page);
                }, function(err){
                    $.alert('#moduleDlg .modal-body', err, 10000);
                });
            }
        }, null , "创建新系统用户");
    },



    // 删除sysuser
    deleteModule: function(_id, options){
        $.ask("删除对象","是否确认删除,删除后不能恢复？", function(){
            $M.dodelete('/sysuser/delete'
                , { _id : _id }
                , { successfn : function(){
                        Module.loadPageData(PG.state.cond, PG.state.page);
                    }});
        });
    },

    // 编辑sysuser信息
    updateModule: function(_id, options){
        // 更新楼宇信息
        _updateModule = function(condition, fn, fail){
            $M.doupdate('/sysuser/update', condition, { successfn : fn , failfn: fail});
        },
        // 查询详细信息
        _loadDataDetail = function(_id, fn){
            $M.doquery('/sysuser/retrive', {_id : _id}
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
        $.showmodal('#moduleDlg', function(){
            if ($('#module-form').validate().form()){
                // save change
                var data = $('#module-form').getdata({checkboxAsBoolean : true});
                // TODO: getdata不能自动获取的数据在这里手工获取
                // ...

                _updateModule($.param({ 
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

    //处理导入数据
    onImportFile : function(type){
        $.showmodal('#importDlg', function(dlg){
            var filename = dlg.data('filename');
            $("previewDiv").spin();
            Module.confirmImport(filename, type, function(data){
                $("previewDiv").spin("false");
                $.alert('#content-body', '成功导入数据 [' + data.count + "] 条");   
                dlg.modal('hide');
            }, function(errmsg){
                $.alert('#importDlg div.modal-body', '导入基站数据出错:' + errmsg);
                dlg.modal('hide');
            });
            return false;
        });
    },

    //导出当前的查询结果
    onExport : function(e){
        e.preventDefault();
        var type = PG.state.type,
            sort = PG.state.sort,
            cond = PG.state.cond,
            sortarg = {}
            $e = $(e.target);
        sortarg[sort.by] = sort.order;
        $e.spin();
        $M.doquery('/sysuser/export'
            , { type: type, cond : cond , sort: sortarg } 
            , { successfn : function(data){
                window.location.href = '/download?'+ $.param(data);
                $e.spin(false);
            } , alertPosition : '#cellDiv' });
    },

    //-----------------------------------------------------
    // 创建文件上传
    createUploader : function( selector , onUploadSuccess ) {
        $(selector).fineUploader({
          request: {
            endpoint: '/upload'
          },
          multiple : true,
          text: {
            uploadButton: '<i class="icon-upload icon-white"></i>上传数据文件(csv格式)'
          },
          template: '<div class="span4">' +
                      '<pre class="qq-upload-drop-area span12"><span>{dragZoneText}</span></pre>' +
                      '<div class="qq-upload-button btn btn-success" style="width: auto;">{uploadButtonText}</div>' +
                      '<span class="qq-drop-processing"><span>{dropProcessingText}</span><span class="qq-drop-processing-spinner"></span></span>' +
                      '<ul class="qq-upload-list" style="margin-top: 10px; text-align: center;"></ul>' +
                    '</div>',
          classes: {
            success: 'alert alert-success',
            fail: 'alert alert-error'
          }
        }).on('complete',function(event, id, fileName, result){
            if(result.success && onUploadSuccess)
                onUploadSuccess(id, fileName);
        });
    },

    // ========================================================================
    //      功能函数 
    // ========================================================================
    // 根据查询条件和分页条件载入数据页面
    listPage : function(cond, sort, page, fn, fail){
        $M.doquery('/sysuser/list'
            , { cond : cond, page: page, sort : sort} 
            , { successfn : fn , failfn : fail , alertPosition : '#cellDiv' });
    },

    confirmImport : function(filename, type, fn, fail){
        $M.doupdate('/sysuser/import'
            , { file : filename, type : type }
            , { successfn : fn, failfn: fail , alertPosition : '#cellDiv' });
    },

    previewImportFile : function(filename, fn, fail){
        $M.doquery('/upload/preview'
            , { f : filename, encode: 'gbk' }
            , { successfn : fn, failfn: fail, alertPosition : '#cellDiv' });
    },

    showPagebar : function(cond, page, fn){
        $M.doquery('/sysuser/count'
            , { cond: cond }
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