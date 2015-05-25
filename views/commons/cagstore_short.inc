<%
/**
 * 显示图片列表
 * 参数：
 *   cagstore : 图片数据
 *
 *   opt : 一些显示参数，用于控制显示效果
 *   opt.maxlength : 显示的最大长度
 *   opt.exhibit : 展馆相关信息
 */
%>
<h3>
  <span class="label label-info"><%=opt.exhibit.title %></span>
  <a class="btn btn-primary pull-right" href="/exhibit/essence" role="button"><span class="glyphicon glyphicon-th"></span> 观赏更多...</a>
</h3>
<hr>
<h5 class="well well-sm"><%=opt.exhibit.desc %></h5>
<%if(cagstore.length > 0){%>
  <div class="row">
    <%
    var rowcnt = 0; 
    for(i = 0; i<= cagstore.length - 1; i++ ){ 
        var painting = cagstore[i],
            uuid = painting._id,
            col = Math.floor(painting.snapSize.width / 128) * 2 ,
            //page = isMobile ? 'imglite' : 'img' ,
            page = 'img' ,
            link = '/' + page + '/' + uuid ,
            pixels = (painting.pixels ? painting.pixels.replace(/\..*$/,'') + "万像素" : painting.fileSize);
          
          var levelmap = ['五级-普清','四级-半高清','三级-高清','二级-超高清','一级-如实物','特级-超实物','特级-超实物','特级-超实物','特级-超实物'],
             scalelevel = painting.maxlevel - painting.minlevel,
             paintinglevel = levelmap[scalelevel];

          var newrow = (rowcnt + col) > 12 ;
          if(newrow){
            rowcnt = col ;
          } else {
            rowcnt += col ;
          }

          var isVeritcal = (painting.snapSize.height / painting.snapSize.width) > 1;
    %>
      <div id="<%=uuid %>" class="painting small col-sm-12 col-md-6" data-uuid="<%=uuid %>" 
                    style="padding-right: 15px; padding-left: 15px;">
        <div class="thumbnail col-sm-12 col-md-12">
          <a target="img-window" class="col-sm-12 <%=isVeritcal? 'col-md-6 img-div' : 'col-md-12 img-div-h' %>" href="<%=link %>">
            <img style="
                width: <%=painting.snapSize.width %>px; height: <%=painting.snapSize.height %>px; 
                "
              class="lazy" data-original="<%=conf.cdn_url %>/cagstore/<%=uuid %>/tb.jpg"
              alt="<%=painting.paintingName %>"
              ></a>
          <div class="caption <%=isVeritcal? 'col-md-6' : 'col-md-12' %>">
            <h4><a href="<%=link %>">
              <%=painting.paintingName %>
              <% if(painting.offlineUrl || painting.originalUrl){ %>
                <span class="glyphicon glyphicon-cloud-download"></span>
              <% } %>
              </a>
              <span class="label label-info pull-right"><%=paintinglevel %></span></h4>

            <h5>
              <%=painting.age + " " + painting.author %>
              <span class="label label-default pull-right"><%=(painting.areaSize ? painting.areaSize.toLowerCase() +' 厘米' : '' ) %></span>
            </h5>
            <p>
              <span class="label label-default pull-right"><%=painting.viewCnt ? '观摩' + painting.viewCnt + '次' : '新发布' %></span>
            </p>
          </div>
        </div>
      </div>
    <% } %>
  </div>
<%}%>