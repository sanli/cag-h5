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
        $('#search-form').autofill(state.cond);
        var type = PG.state.type;
        // TODO: 根据Type决定显示类型
    },

    //根据页面状态，载入数据
    loadPageData: function(cond, page){
        $('#cellTable').spin();
        var type = PG.state.type,
            title = type + '数据';

        Module.listPage(type, cond, page
            , function(module){
                var $resultTarget = $('#cellTable');
                $M.fillResult($resultTarget, {
                    columns : Module.columns ,
                    cells : module.docs,
                    title : type.toUpperCase() + "数据",
                    bodyId: type + 'cellTbody',
                    tempId : type + 'CellTable',
                });
                $('#cellTable').spin(false);
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
                var search = $('#search-form').getdata({skipEmpty : true});
                var state = $.extend({}, PG.state);
                $.extend(state.cond, search) ;
                PG.pushState(state);
            };
        });
        $('#typeQueryBtn').click(function(){
            var cond = $("#highlight-form").getdata();
            Module._querycell(cond, Module.showPageHander(cond.type));
        })
        Module.createUploader("#fileUploader", Module.onFileUploadSuccess);

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
    },

    //====================================================================================================================
    // 事件处理函数
    //====================================================================================================================
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
                $.alert('#content-body', '成功导入基站数据 [' + data.count + "] 条");   
                dlg.modal('hide');
            }, function(errmsg){
                $.alert('#importDlg div.modal-body', '导入基站数据出错:' + errmsg);
                dlg.modal('hide');
            });
            return false;
        });
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
    listPage : function(type, cond, page, fn, fail){
        $M.doquery('/<M%=module_name %M>/list'
            , { type: type, cond : cond, page: page} 
            , { successfn : fn , failfn : fail , alertPosition : '#cellDiv' });
    },

    confirmImport : function(filename, type, fn, fail){
        $M.doupdate('/<M%=module_name %M>/import'
            , { file : filename, type : type }
            , { successfn : fn, failfn: fail , alertPosition : '#cellDiv' });
    },

    previewImportFile : function(filename, fn, fail){
        $M.doquery('/upload/preview'
            , { f : filename, encode: 'gbk'}
            , { successfn : fn, failfn: fail, alertPosition : '#cellDiv' });
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
};

$(document).ready(init);