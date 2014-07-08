﻿/** * PhotoShop Scirpt * 使用PhotoShop分解文件，性能和效果优于imagemagick */// 分层分解文件// This code exports the current document as a folder of Zoomify tiles.function ExportTileAsJPEG(tileName, exportFolder, tileRect, quality, optimized, width, height, sharpen, useCache, clearCache){	var exportDescriptor = new ActionDescriptor();        //log( exportFolder + "/" + tileName + ".jpg"  )	exportDescriptor.putPath( stringIDToTypeID( "file"), new File( exportFolder + "/" + tileName + ".jpg" ) );	    //log(tileRect.top + "," + tileRect.left + "," + tileRect.bottom + "," + tileRect.right);	exportDescriptor.putInteger( stringIDToTypeID( "top"), tileRect.top);	exportDescriptor.putInteger( stringIDToTypeID( "left"), tileRect.left);	exportDescriptor.putInteger( stringIDToTypeID( "bottom"), tileRect.bottom);	exportDescriptor.putInteger( stringIDToTypeID( "right"), tileRect.right);		exportDescriptor.putInteger( stringIDToTypeID( "width"), width);	exportDescriptor.putInteger( stringIDToTypeID( "height"), height);		exportDescriptor.putInteger( stringIDToTypeID( "extendedQuality"), quality);	exportDescriptor.putBoolean( stringIDToTypeID( "optimized"), optimized);	exportDescriptor.putBoolean( stringIDToTypeID( "cache"), useCache);	exportDescriptor.putBoolean( stringIDToTypeID( "clearEvent"), clearCache);		executeAction( stringIDToTypeID( "JPEGTileExport"), exportDescriptor, DialogModes.NO);}// 写字符串到文件中function WriteStringToFile(outText, outPath){	try 	{							var logFile = File(outPath);			logFile.open ("w");		logFile.write( outText );		logFile.close();	} catch (e) {		alert(e);	} finally {	}	return;}function log(msg){    $.writeln( '[' + new Date() + "] " + msg);}// 生成缩略图, 按照比例缩小，如果图片是横向的，就把高度缩放为128，如果图片是纵向的，就把宽度缩放为128// 如果缩小后的图片宽度超过460，就截取中间宽度为460的一段function thumb(width, height, opt){    var thumbsize = 128,        thumbfile = 'tb',         quality = 8,        optimized = true,        sharpen = false,        useCache = false,        outFolder = opt.outFolder,        clearCache = false;               var resizeWidth = Math.floor( width > height ? width * ( 128 / height) : thumbsize ),        scale = resizeWidth / width,        tbwidth = resizeWidth > 460 ? 460 : resizeWidth,         tbheight = Math.round(( resizeWidth / width ) * height)         tileRect = {             top: 0,            left:  Math.max( Math.floor(width / 2 - 230 / scale), 0),            right: Math.min( Math.floor(width / 2 + 230 / scale), width),            bottom: height        };        log("thumb file:" + thumbfile + ':' + outFolder + " { " + tileRect.top + ', ' + tileRect.left + ','                + tileRect.right + ',' + tileRect.bottom + '}');            ExportTileAsJPEG(thumbfile, outFolder, tileRect, quality, optimized, tbwidth, tbheight, sharpen, useCache, clearCache);}// 生成用于截图的分块文件，在圈选区域的时候使用，每个分块宽度为31000个像素，上一张图和下一张图之间有1000个像素的重合function snap(width, height, scale, level, opt ){    var quality = 7,        optimized = true,        sharpen = false,        useCache = true,        outFolder = opt.outFolder,        clearCache = false,        overlap = 1000 * scale,          // 每个图块之间重合1000个像素点        tilewidth = 30000 * scale;       // 每个图块最大宽度为30000个像素       var start = 0, snapCnt = 0;    while(start < width){        var tileRect = {             top: 0,            left:  start,            right:  start + tilewidth + overlap,            bottom: height        },        snapfile = 'temp_'+ level + '_' + snapCnt,        snapWidth =  31000 ,        snapHeight = Math.floor( height / scale ) ;                ExportTileAsJPEG(snapfile, outFolder, tileRect, quality, optimized, snapWidth, snapHeight, sharpen, useCache, clearCache);        snapCnt ++;        start += tilewidth;        useCache = true;    }    }// 打开文件function openfile(file){        //打开待处理文件    var startRulerUnits = app.preferences.rulerUnits;        app.preferences.rulerUnits = Units.PIXELS;      $.write('open file:' + file);    var docToOpen = File(file);    open(docToOpen);    log('open file success:' + file);    return startRulerUnits;}//关闭文件function closefile(){    activeDocument.close(SaveOptions.DONOTSAVECHANGES);}// 分层切割文件 function crop(opt){            var sourceFile = opt.fileName,  // 打开待切割文件        maxlevel = opt.maxlevel,        minlevel = opt.minlevel,        outFolder = opt.outFolder,        tileSize = 256,        tileW = 256,        tileH = 256,        //quality = 8,        quality = 7,        optimized = true,        sharpen = false,        useCache = false;        var numLevels=0,        imageWidths = [],        imageHeights = [],        xTiles = [],        yTiles = [],        baseWidth = Number(activeDocument.width),        baseHeight = Number(activeDocument.height);        currentWidth = baseWidth,         currentHeight = baseHeight,        maxXExpand = 0,        maxYExpand = 0;        	// 计算分块大小和缩放大小	while(currentHeight > tileSize && currentWidth > tileSize)	{		imageWidths[numLevels] = currentWidth;		imageHeights[numLevels] = currentHeight;				xTiles[numLevels] = Math.floor((currentWidth + tileSize - 1) / (tileSize));		yTiles[numLevels] = Math.floor((currentHeight + tileSize - 1) / (tileSize));                var xExpand = xTiles[numLevels] * tileSize * Math.pow(2, numLevels),            yExpand = yTiles[numLevels] * tileSize * Math.pow(2, numLevels);         maxXExpand = Math.max(maxXExpand , xExpand);         maxYExpand = Math.max(maxYExpand , yExpand);         		numLevels++;		currentHeight /= 2;		currentWidth /= 2;	}	//The zero tile	imageWidths[numLevels] = currentWidth;	imageHeights[numLevels] = currentHeight;			xTiles[numLevels] = Math.floor((currentWidth + tileSize - 1) / (tileSize));	yTiles[numLevels] = Math.floor((currentHeight + tileSize - 1) / (tileSize));	numLevels++;        //log("xTiles:" + xTiles[0] + ", yTiles:" + yTiles[0] );    //log("maxXExpand:" + maxXExpand + ", maxYExpand:" + maxYExpand + ' w:' + baseWidth + ',h:' + baseHeight );    activeDocument.resizeCanvas(maxXExpand, maxYExpand, AnchorPosition.TOPLEFT);    	//alert(numLevels);	currentWidth = baseWidth;	currentHeight = baseHeight;	var tileScale = 1;		var x,y,level;	var clearCache = false;	var tileRect = {};	var width = tileSize;	var height = tileSize;	var zoomifyLevel;	for(level = 0; level < numLevels; level++){  // 循环处理每一层        var zoomLevel = 18 - level,            tileGroupPath = outFolder + "/" + zoomLevel,            tileGroupFolder = new Folder( tileGroupPath );        if(!tileGroupFolder.exists)            tileGroupFolder.create();                  //calc rect and clamp		width = tileSize;		height = tileSize;                  // 分块切割		for(y = 0; y < yTiles[level]; y++){			for(x = 0; x < xTiles[level]; x++){                 				var tileName = x + '_' + y ;								tileRect.top=tileSize*y;				tileRect.left=tileSize*x;				tileRect.right=(x+1)*tileSize;				tileRect.bottom=(y+1)*tileSize;								tileRect.top *= tileScale;				tileRect.bottom *= tileScale;				tileRect.left *= tileScale;				tileRect.right *= tileScale;								if(x == 0 && y == 0)					useCache = false;				else					useCache = true;								ExportTileAsJPEG(tileName, tileGroupPath, tileRect, quality, optimized, width, height, sharpen, useCache, clearCache);                			}		}		        snap(baseWidth, baseHeight, tileScale, zoomLevel, opt);        		currentHeight = Math.floor(currentHeight/2);		currentWidth = Math.floor(currentWidth/2);		tileScale *= 2;	}	    // 创建缩略图    thumb(baseWidth, baseHeight, opt);    	//One last call to clear the cache	clearCache = true;	ExportTileAsJPEG(tileName, tileGroupPath, tileRect, quality, optimized, width, height, sharpen, useCache, clearCache);}