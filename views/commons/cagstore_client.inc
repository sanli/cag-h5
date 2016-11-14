<!-- 图片列表模版 -->
          <script type="text/html" id="paintinglistTmpl">
              <h3 id="essenceHref" class="href"><span class="label label-info"><@=label @></span></h3>
              <div class="row">
              <@
              var rowcnt = 0; 
              for(i = 0; i<= cagstore.length - 1; i++ ){ 
                  var painting = cagstore[i],
                      uuid = painting._id,
                      col = Math.floor(painting.snapSize.width / 128) * 2 ,
                      page = isMobile ? 'imglite' : 'img' ,
                      link = page + '/' + uuid ,
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
              @>
                
                <div id="<@=uuid @>" class="painting col-sm-12 col-md-6" data-uuid="<@=uuid @>" 
                    style="padding-right: 15px; padding-left: 15px;">
                  <div class="thumbnail col-sm-12 col-md-12" <@= opacity ? "style=\"opacity: 0;\"":"" @> >
                    <a target="img-window" class="col-sm-12 <@=isVeritcal? 'col-md-6 img-div' : 'col-md-12 img-div-h' @>" href="<@=link @>">
                      <img style="
                          width: <@=painting.snapSize.width @>px; height: <@=painting.snapSize.height @>px; 
                          "
                        class="lazy" data-original="<@=conf.media_url @>/cagstore/<@=uuid @>/tb.jpg"
                        alt="<@=painting.paintingName @>"
                        ></a>
                    <div class="caption <@=isVeritcal? 'col-md-6' : 'col-md-12' @>">
                      <h4><a href="<@=link @>"><@=painting.paintingName @></a><span class="label label-info pull-right"><@=paintinglevel @></span></h4>
                      <@ if(painting.essence && painting.essenceComment ) { @>
                        <p><@=painting.essenceComment @></p>
                      <@} @>
                      <p><@=painting.age + " " + painting.author @><span class="pull-right"><@=(painting.areaSize ? painting.areaSize.toLowerCase() +' 厘米' : '' ) @></span></p>
                      <p><@=pixels @></p>
                      <p>
                      <span class="label label-default"><@=painting.viewCnt ? '观摩' + painting.viewCnt + '次' : '新发布' @></span>
                      <@= painting.descUrl ? '<a target="infowindow" class="pull-right" href="' + painting.descUrl + '"><span class="glyphicon glyphicon-info-sign"></span>介绍</a>' : '' @>
                      <@ if(painting.offlineUrl){ @>
                        <a target="downloadwindow" data-trigger="hover" data-placement="bottom" data-toggle="popover" title="什么是网页离线包" data-content="为了方便您随时随地观赏藏品，或者是分享图片给朋友，我们把网页和图片压缩成了“网页离线包”，下载离线包后解压成目录，双击打开其中的“jpg.html”文件即可。" class="pull-right download" href="<@= painting.offlineUrl @>"><span class="glyphicon glyphicon-cloud-download"></span>下载</a>
                      <@ } @>
                      <@ if( painting.desc) { @>
                        <p><@=painting.desc @></p>
                      <@ } @>
                    </div>
                  </div>
                </div>
            <@ } @>
            </div>
            </script> <!-- 图片列表模版 -->