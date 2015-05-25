<%
// 生成在客户端上执行的js模版
%>
<script type="text/html" id="outlineDlgTmpl">
  <@
  for(i = 0; i<= outline.length - 1; i++ ){ 
      var ageAuthor = outline[i],
          ageName = ageAuthor._id,
          authors = ageAuthor.authors;
  @>
  <h3>
    <a href="#type=age&age=<@=ageName @>" data-age="<@=ageName @>">
      <span class="label label-info"><@=ageName @></span></a>
    <a href="#" data-target="top" class="pull-right scroll-view h4">
      <span class="label label-default">返回顶部</span></a>
  </h3>
    <@
    for(j = 0 ; j <= authors.length - 1; j++){
          var author = authors[j],
              authorName = author.name,
              paintingCnt = author.paintings.length;
      @>
        <p>
        <a href="#type=age&age=<@=ageName @>&author=<@=authorName @>" data-target="#author-<@=authorName @>" class="change-view"><span class="label label-default"><@=authorName + " " + paintingCnt + "幅" @></span>
        <@
        for(k = 0 ; k <= author.paintings.length - 1; k++){
          pname = author.paintings[k];
        @>
        《<@=pname @>》
        <@}@>
        </a>
        </p>
    <@ } @> 
    </div>
  <@ } @>
</script>

<script type="text/html" id="outlineNavTmpl">
  <@
  for(i = 0; i<= outline.length - 1; i++ ){ 
      var ageAuthor = outline[i],
          ageName = ageAuthor._id,
          authors = ageAuthor.authors;
  @>
    <a href="#" class="scroll-view" data-target="<@=ageName @>"><span class="label label-info"><@=ageName @></span></a>
  <@ } @>
</script>