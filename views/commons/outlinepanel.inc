<%
/**
 * 显示图片列表
 * 参数：
 *   @outline : 图片数据
 *   @viewopt : 一些显示参数，用于控制显示效果
 *      viewopt.maxlenght : 显示的最大长度
 *      viewopt.collapse : 是否展开显示目录
 *
 */
%>
<div class="panel panel-default">
  <div class="panel-heading" role="tab" id="headingOne">
    <h4 class="panel-title">
      <a class="<%= viewopt.collapse ? 'collapsed' : '' %>" data-toggle="collapse" data-parent="#accordion" href="#outline-panel" aria-expanded="true" aria-controls="outline-panel">
        <span class="glyphicon glyphicon-book"></span> 展开所有藏品目录
      </a>
      <a class="pull-right" href="http://blog.ltfc.net/message/2016/07/06/cag-paintings-index.html">藏品大转盘 <span class="glyphicon glyphicon-share-alt" aria-hidden="true"></span></a>
    </h4>
  </div>
  <div id="outline-panel" class="panel-collapse <%= viewopt.collapse ? 'collapse' : '' %>" role="tabpanel" aria-labelledby="headingOne">
    <div class="panel-body"  style="height: 400px; overflow-y: scroll;">
      <div class="col-sm-12 col-md-12">
        <h4 id="top">藏品目录</h4>
        <h3 id="outline-navi" class="age-navi">
          <%
          for(i = 0; i<= outline.length - 1; i++ ){ 
              var ageAuthor = outline[i],
                  ageName = ageAuthor._id,
                  authors = ageAuthor.authors;
          %>
            <a href="#" class="scroll-view" data-target="<%=ageName %>"><span class="label label-info"><%=ageName %></span></a>
          <% } %>
        </h3>
        <hr>
        <div id="outline-dlg">
          <%
          for(i = 0; i<= outline.length - 1; i++ ){ 
              var ageAuthor = outline[i],
                  ageName = ageAuthor._id,
                  authors = ageAuthor.authors;
          %>
          <h3>
            <a href="#type=age&age=<%=ageName %>" data-age="<%=ageName %>">
              <span class="label label-info"><%=ageName %></span></a>
            <a href="#" data-target="top" class="pull-right scroll-view h4">
              <span class="label label-default">返回顶部</span></a>
          </h3>
            <%
            for(j = 0 ; j <= authors.length - 1; j++){
                  var author = authors[j],
                      authorName = author.name,
                      paintingCnt = author.paintings.length;
              %>
                <p>
                <a href="/exhibit/age/<%=ageName %>/<%=authorName %>" data-target="#author-<%=authorName %>" class="change-view h4"><span class="label label-default"><%=authorName + " " + paintingCnt + "幅" %></span></a>
                <%
                for(k = 0 ; k <= author.paintings.length - 1; k++){
                  pname = author.paintings[k];
                %>
                《<a href="/img/<%=pname.uid %>" target="_blank"><%=pname.name %></a>》
                <%}%>
                
                </p>
            <% } %> 
          <% } %>
        </div>
      </div>
    </div>
  </div>
</div>