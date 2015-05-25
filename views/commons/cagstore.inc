<%
/**
 * 显示图片列表
 * 参数：
 *   cagstore : 图片数据
 *
 *   cagstore.viewopt : 一些显示参数，用于控制显示效果
 *      cagstore.viewopt.maxlength : 显示的最大长度
 *
 */
%>
<!--
<h3 id="essenceHref" class="href"><span class="label label-info">< % = painting.age + '-' + painting.author %></span></h3>
-->
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
      <div id="<%=uuid %>" class="painting col-sm-12 col-md-6" data-uuid="<%=uuid %>" 
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
            <h4><a href="<%=link %>"><%=painting.paintingName %>
              <% if(painting.offlineUrl || painting.originalUrl){ %>
                <span class="glyphicon glyphicon-cloud-download"></span>
              <% } %>
            </a><span class="label label-info pull-right"><%=paintinglevel %></span></h4>
            <% if(painting.essence && painting.essenceComment ) { %>
              <p><%=painting.essenceComment %></p>
            <%} %>
            <p><%=painting.age + " " + painting.author %><span class="pull-right"><%=(painting.areaSize ? painting.areaSize.toLowerCase() +' 厘米' : '' ) %></span></p>
            <p><%=pixels %></p>
            <p>
            <span class="label label-default"><%=painting.viewCnt ? '观摩' + painting.viewCnt + '次' : '新发布' %></span>
            <%= painting.descUrl ? '<a target="infowindow" class="pull-right" href="' + painting.descUrl + '"><span class="glyphicon glyphicon-info-sign"></span>介绍</a>' : '' %>
            <% if( painting.desc) { %>
              <p><%=painting.desc %></p>
            <% } %>
          </div>
        </div>
      </div>
  <% } %>
  </div>
<%}%>