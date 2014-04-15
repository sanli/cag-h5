/**
 * 地图类应用的一些工具类
 */


// =====================================================
// 快速凸包算法 QuickHull
//   http://westhoffswelt.de/blog/0040_quickhull_introduction_and_php_implementation.html/
// =====================================================
(function(){
    function getDistant(cpt, bl) {
        Vy = bl[1][0] - bl[0][0];
        Vx = bl[0][1] - bl[1][1];
        return (Vx * (cpt[0] - bl[0][0]) + Vy * (cpt[1] -bl[0][1]))
    };


    function findMostDistantPointFromBaseLine(baseLine, points) {
        var maxD = 0;
        var maxPt = new Array();
        var newPoints = new Array();
        for (var idx in points) {
            var pt = points[idx];
            var d = getDistant(pt, baseLine);

            if ( d > 0) {
                newPoints.push(pt);
            } else {
                continue;
            }

            if ( d > maxD ) {
                maxD = d;
                maxPt = pt;
            }

        }
        return {'maxPoint':maxPt, 'newPoints':newPoints}
    };

    var allBaseLines = new Array();
    function buildConvexHull(baseLine, points) {

        //plotBaseLine(baseLine,'rgb(180,180,180)');
        allBaseLines.push(baseLine)
        var convexHullBaseLines = new Array();
        var t = findMostDistantPointFromBaseLine(baseLine, points);
        if (t.maxPoint.length) {
            convexHullBaseLines = convexHullBaseLines.concat( buildConvexHull( [baseLine[0],t.maxPoint], t.newPoints) );
            convexHullBaseLines = convexHullBaseLines.concat( buildConvexHull( [t.maxPoint,baseLine[1]], t.newPoints) );
            return convexHullBaseLines;
        } else {
            return [baseLine];
        }
    };


    this.getConvexHull = function(points) {
        //find first baseline
        var maxX, minX;
        var maxPt, minPt;
        for (var idx in points) {
            var pt = points[idx];
            if (pt[0] > maxX || !maxX) {
                maxPt = pt;
                maxX = pt[0];
            }
            if (pt[0] < minX || !minX) {
                minPt = pt;
                minX = pt[0];
            }
        }
        var ch = [].concat(buildConvexHull([minPt, maxPt], points),
                           buildConvexHull([maxPt, minPt], points))
        return ch;
    };
})();


//==============================================================================
// 百度地图常用函数
//==============================================================================
var SMapLib = window.SMapLib = SMapLib || {};

//判断overlay元素是否是marker
SMapLib.isMarker = function(overlay){
    return /.*Marker.*/.test(overlay.toString());
}

//生成点对象
SMapLib.pointToGeoJSON = function(point){
    return {
        type: 'Point',
        coordinates: SMapLib.pointToLoc(point)
    };
}

//生成bounds的GeoJSON对象
SMapLib.boundsToGeoJSON = function(bounds){
    return {
        type: 'Polygon',
        coordinates: [SMapLib.boundsToPolygon(bounds)]
    }
}

//Loc转化为BaiduMap地址
SMapLib.locToPoint = function(loc){
    return new BMap.Point(loc[0], loc[1])
}

SMapLib.pointToLoc = function(point){
    return [parseFloat(point.lng), parseFloat(point.lat)];
}

SMapLib.pointToStr = function(point){
    return point.lng + ',' + point.lat ;
}

SMapLib.strToPoint = function(str){
    var point = str.split(",");
    return new BMap.Point(parseFloat(point[0]), parseFloat(point[1]));
}

//生成多边形对象
SMapLib.pointListToGeoJSON = function(points){
    // var coordinates = [];
    // $.each(points, function(i, point){
    //     coordinates.push(SMapLib.pointToLoc(point));
    // });

    // //连接首尾
    // if(coordinates.length > 0){
    //     var last = coordinates[coordinates.length-1], 
    //         first =  coordinates[0];
    //     if(last[0] != first[0] || last[1] != first[1] )
    //         coordinates.push(first);    
    // }
    var coordinates = SMapLib.pointListToPolygon(points);
    return {
        type: 'Polygon',
        coordinates: [coordinates]
    };
}

SMapLib.pointListToPolygon = function(points){
    var coordinates = $.map(points, function(point){
        return [SMapLib.pointToLoc(point)];
    });

    //连接首尾
    if(coordinates.length > 0){
        var last = coordinates[coordinates.length-1], 
            first =  coordinates[0];
        if(last[0] != first[0] || last[1] != first[1] )
            coordinates.push(first);    
    }
    return coordinates;
}

SMapLib.locsToPointList = function(arrays){
    return $.map(arrays, function(cord, idx){
        return SMapLib.locToPoint(cord);
    });
}

SMapLib.boundsToPolygon = function(bounds){
    if( typeof(bounds) === 'object'){
        var minx = bounds.getSouthWest().lng, miny = bounds.getSouthWest().lat,
            maxx = bounds.getNorthEast().lng, maxy = bounds.getNorthEast().lat;         
    }else{
        var boundArray = bounds.split(","),
            minx = parseFloat(boundArray[0]) , miny = parseFloat(boundArray[1]) ,
            maxx = parseFloat(boundArray[2]) , maxy = parseFloat(boundArray[3]) ;
    }

    return [ [minx, miny], [maxx, miny],[maxx, maxy],[minx, maxy],[minx, miny] ];
}


SMapLib.boundsToStr = function(bounds){
    var minx = bounds.getSouthWest().lng,miny = bounds.getSouthWest().lat,
        maxx = bounds.getNorthEast().lng,maxy = bounds.getNorthEast().lat;     
    return minx + ',' + miny + ',' + maxx + ',' + maxy;
}

//==============================================================================
// 百度 OpenSource Code of DrawingManager
//==============================================================================
/**
 * @fileoverview 百度地图的鼠标绘制工具，对外开放。
 * 允许用户在地图上点击完成鼠标绘制的功能。
 * 使用者可以自定义所绘制结果的相关样式，例如线宽、颜色、测线段距离、面积等等。
 * 主入口类是<a href="symbols/BMapLib.DrawingManager.html">DrawingManager</a>，
 * 基于Baidu Map API 1.4。
 *
 * @author Baidu Map Api Group 
 * @version 1.4
 */

/** 
 * @namespace BMap的所有library类均放在BMapLib命名空间下
 */
var BMapLib = window.BMapLib = BMapLib || {};

/**
 * 定义常量, 绘制的模式
 * @final {Number} DrawingType
 */
var BMAP_DRAWING_MARKER    = "marker",     // 鼠标画点模式
    BMAP_DRAWING_POLYLINE  = "polyline",   // 鼠标画线模式
    BMAP_DRAWING_CIRCLE    = "circle",     // 鼠标画圆模式
    BMAP_DRAWING_RECTANGLE = "rectangle",  // 鼠标画矩形模式
    BMAP_DRAWING_POLYGON   = "polygon";    // 鼠标画多边形模式

(function() {

    /**
     * 声明baidu包
     */
    var baidu = baidu || {guid : "$BAIDU$"};
    (function() {
        // 一些页面级别唯一的属性，需要挂载在window[baidu.guid]上
        window[baidu.guid] = {};

        /**
         * 将源对象的所有属性拷贝到目标对象中
         * @name baidu.extend
         * @function
         * @grammar baidu.extend(target, source)
         * @param {Object} target 目标对象
         * @param {Object} source 源对象
         * @returns {Object} 目标对象
         */
        baidu.extend = function (target, source) {
            for (var p in source) {
                if (source.hasOwnProperty(p)) {
                    target[p] = source[p];
                }
            }    
            return target;
        };

        /**
         * @ignore
         * @namespace
         * @baidu.lang 对语言层面的封装，包括类型判断、模块扩展、继承基类以及对象自定义事件的支持。
         * @property guid 对象的唯一标识
         */
        baidu.lang = baidu.lang || {};

        /**
         * 返回一个当前页面的唯一标识字符串。
         * @function
         * @grammar baidu.lang.guid()
         * @returns {String} 当前页面的唯一标识字符串
         */
        baidu.lang.guid = function() {
            return "TANGRAM__" + (window[baidu.guid]._counter ++).toString(36);
        };

        window[baidu.guid]._counter = window[baidu.guid]._counter || 1;

        /**
         * 所有类的实例的容器
         * key为每个实例的guid
         */
        window[baidu.guid]._instances = window[baidu.guid]._instances || {};

        /**
         * Tangram继承机制提供的一个基类，用户可以通过继承baidu.lang.Class来获取它的属性及方法。
         * @function
         * @name baidu.lang.Class
         * @grammar baidu.lang.Class(guid)
         * @param {string} guid	对象的唯一标识
         * @meta standard
         * @remark baidu.lang.Class和它的子类的实例均包含一个全局唯一的标识guid。
         * guid是在构造函数中生成的，因此，继承自baidu.lang.Class的类应该直接或者间接调用它的构造函数。<br>
         * baidu.lang.Class的构造函数中产生guid的方式可以保证guid的唯一性，及每个实例都有一个全局唯一的guid。
         */
        baidu.lang.Class = function(guid) {
            this.guid = guid || baidu.lang.guid();
            window[baidu.guid]._instances[this.guid] = this;
        };

        window[baidu.guid]._instances = window[baidu.guid]._instances || {};

        /**
         * 判断目标参数是否string类型或String对象
         * @name baidu.lang.isString
         * @function
         * @grammar baidu.lang.isString(source)
         * @param {Any} source 目标参数
         * @shortcut isString
         * @meta standard
         *             
         * @returns {boolean} 类型判断结果
         */
        baidu.lang.isString = function (source) {
            return '[object String]' == Object.prototype.toString.call(source);
        };

        /**
         * 判断目标参数是否为function或Function实例
         * @name baidu.lang.isFunction
         * @function
         * @grammar baidu.lang.isFunction(source)
         * @param {Any} source 目标参数
         * @returns {boolean} 类型判断结果
         */
        baidu.lang.isFunction = function (source) {
            return '[object Function]' == Object.prototype.toString.call(source);
        };

        /**
         * 重载了默认的toString方法，使得返回信息更加准确一些。
         * @return {string} 对象的String表示形式
         */
        baidu.lang.Class.prototype.toString = function(){
            return "[object " + (this._className || "Object" ) + "]";
        };

        /**
         * 释放对象所持有的资源，主要是自定义事件。
         * @name dispose
         * @grammar obj.dispose()
         */
        baidu.lang.Class.prototype.dispose = function(){
            delete window[baidu.guid]._instances[this.guid];
            for(var property in this){
                if (!baidu.lang.isFunction(this[property])) {
                    delete this[property];
                }
            }
            this.disposed = true;
        };

        /**
         * 自定义的事件对象。
         * @function
         * @name baidu.lang.Event
         * @grammar baidu.lang.Event(type[, target])
         * @param {string} type	 事件类型名称。为了方便区分事件和一个普通的方法，事件类型名称必须以"on"(小写)开头。
         * @param {Object} [target]触发事件的对象
         * @meta standard
         * @remark 引入该模块，会自动为Class引入3个事件扩展方法：addEventListener、removeEventListener和dispatchEvent。
         * @see baidu.lang.Class
         */
        baidu.lang.Event = function (type, target) {
            this.type = type;
            this.returnValue = true;
            this.target = target || null;
            this.currentTarget = null;
        };

        /**
         * 注册对象的事件监听器。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
         * @grammar obj.addEventListener(type, handler[, key])
         * @param 	{string}   type         自定义事件的名称
         * @param 	{Function} handler      自定义事件被触发时应该调用的回调函数
         * @param 	{string}   [key]		为事件监听函数指定的名称，可在移除时使用。如果不提供，方法会默认为它生成一个全局唯一的key。
         * @remark 	事件类型区分大小写。如果自定义事件名称不是以小写"on"开头，该方法会给它加上"on"再进行判断，即"click"和"onclick"会被认为是同一种事件。 
         */
        baidu.lang.Class.prototype.addEventListener = function (type, handler, key) {
            if (!baidu.lang.isFunction(handler)) {
                return;
            }
            !this.__listeners && (this.__listeners = {});
            var t = this.__listeners, id;
            if (typeof key == "string" && key) {
                if (/[^\w\-]/.test(key)) {
                    throw("nonstandard key:" + key);
                } else {
                    handler.hashCode = key; 
                    id = key;
                }
            }
            type.indexOf("on") != 0 && (type = "on" + type);
            typeof t[type] != "object" && (t[type] = {});
            id = id || baidu.lang.guid();
            handler.hashCode = id;
            t[type][id] = handler;
        };
         
        /**
         * 移除对象的事件监听器。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
         * @grammar obj.removeEventListener(type, handler)
         * @param {string}   type     事件类型
         * @param {Function|string} handler  要移除的事件监听函数或者监听函数的key
         * @remark 	如果第二个参数handler没有被绑定到对应的自定义事件中，什么也不做。
         */
        baidu.lang.Class.prototype.removeEventListener = function (type, handler) {
            if (baidu.lang.isFunction(handler)) {
                handler = handler.hashCode;
            } else if (!baidu.lang.isString(handler)) {
                return;
            }
            !this.__listeners && (this.__listeners = {});
            type.indexOf("on") != 0 && (type = "on" + type);
            var t = this.__listeners;
            if (!t[type]) {
                return;
            }
            t[type][handler] && delete t[type][handler];
        };

        /**
         * 派发自定义事件，使得绑定到自定义事件上面的函数都会被执行。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
         * @grammar obj.dispatchEvent(event, options)
         * @param {baidu.lang.Event|String} event 	Event对象，或事件名称(1.1.1起支持)
         * @param {Object} options 扩展参数,所含属性键值会扩展到Event对象上(1.2起支持)
         * @remark 处理会调用通过addEventListenr绑定的自定义事件回调函数之外，还会调用直接绑定到对象上面的自定义事件。
         * 例如：<br>
         * myobj.onMyEvent = function(){}<br>
         * myobj.addEventListener("onMyEvent", function(){});
         */
        baidu.lang.Class.prototype.dispatchEvent = function (event, options) {
            if (baidu.lang.isString(event)) {
                event = new baidu.lang.Event(event);
            }
            !this.__listeners && (this.__listeners = {});
            options = options || {};
            for (var i in options) {
                event[i] = options[i];
            }
            var i, t = this.__listeners, p = event.type;
            event.target = event.target || this;
            event.currentTarget = this;
            p.indexOf("on") != 0 && (p = "on" + p);
            baidu.lang.isFunction(this[p]) && this[p].apply(this, arguments);
            if (typeof t[p] == "object") {
                for (i in t[p]) {
                    t[p][i].apply(this, arguments);
                }
            }
            return event.returnValue;
        };

        /**
         * 为类型构造器建立继承关系
         * @name baidu.lang.inherits
         * @function
         * @grammar baidu.lang.inherits(subClass, superClass[, className])
         * @param {Function} subClass 子类构造器
         * @param {Function} superClass 父类构造器
         * @param {string} className 类名标识
         * @remark 使subClass继承superClass的prototype，
         * 因此subClass的实例能够使用superClass的prototype中定义的所有属性和方法。<br>
         * 这个函数实际上是建立了subClass和superClass的原型链集成，并对subClass进行了constructor修正。<br>
         * <strong>注意：如果要继承构造函数，需要在subClass里面call一下，具体见下面的demo例子</strong>
         * @shortcut inherits
         * @meta standard
         * @see baidu.lang.Class
         */
        baidu.lang.inherits = function (subClass, superClass, className) {
            var key, proto, 
                selfProps = subClass.prototype, 
                clazz = new Function();        
            clazz.prototype = superClass.prototype;
            proto = subClass.prototype = new clazz();
            for (key in selfProps) {
                proto[key] = selfProps[key];
            }
            subClass.prototype.constructor = subClass;
            subClass.superClass = superClass.prototype;

            if ("string" == typeof className) {
                proto._className = className;
            }
        };

        /**
         * @ignore
         * @namespace baidu.dom 操作dom的方法。
         */
        baidu.dom = baidu.dom || {};

        /**
         * 从文档中获取指定的DOM元素
         * 
         * @param {string|HTMLElement} id 元素的id或DOM元素
         * @meta standard
         * @return {HTMLElement} DOM元素，如果不存在，返回null，如果参数不合法，直接返回参数
         */
        baidu._g = baidu.dom._g = function (id) {
            if (baidu.lang.isString(id)) {
                return document.getElementById(id);
            }
            return id;
        };

        /**
         * 从文档中获取指定的DOM元素
         * @name baidu.dom.g
         * @function
         * @grammar baidu.dom.g(id)
         * @param {string|HTMLElement} id 元素的id或DOM元素
         * @meta standard
         *             
         * @returns {HTMLElement|null} 获取的元素，查找不到时返回null,如果参数不合法，直接返回参数
         */
        baidu.g = baidu.dom.g = function (id) {
            if ('string' == typeof id || id instanceof String) {
                return document.getElementById(id);
            } else if (id && id.nodeName && (id.nodeType == 1 || id.nodeType == 9)) {
                return id;
            }
            return null;
        };

        /**
         * 在目标元素的指定位置插入HTML代码
         * @name baidu.dom.insertHTML
         * @function
         * @grammar baidu.dom.insertHTML(element, position, html)
         * @param {HTMLElement|string} element 目标元素或目标元素的id
         * @param {string} position 插入html的位置信息，取值为beforeBegin,afterBegin,beforeEnd,afterEnd
         * @param {string} html 要插入的html
         * @remark
         * 
         * 对于position参数，大小写不敏感<br>
         * 参数的意思：beforeBegin&lt;span&gt;afterBegin   this is span! beforeEnd&lt;/span&gt; afterEnd <br />
         * 此外，如果使用本函数插入带有script标签的HTML字符串，script标签对应的脚本将不会被执行。
         * 
         * @shortcut insertHTML
         * @meta standard
         *             
         * @returns {HTMLElement} 目标元素
         */
        baidu.insertHTML = baidu.dom.insertHTML = function (element, position, html) {
            element = baidu.dom.g(element);
            var range,begin;

            if (element.insertAdjacentHTML) {
                element.insertAdjacentHTML(position, html);
            } else {
                // 这里不做"undefined" != typeof(HTMLElement) && !window.opera判断，其它浏览器将出错？！
                // 但是其实做了判断，其它浏览器下等于这个函数就不能执行了
                range = element.ownerDocument.createRange();
                // FF下range的位置设置错误可能导致创建出来的fragment在插入dom树之后html结构乱掉
                // 改用range.insertNode来插入html, by wenyuxiang @ 2010-12-14.
                position = position.toUpperCase();
                if (position == 'AFTERBEGIN' || position == 'BEFOREEND') {
                    range.selectNodeContents(element);
                    range.collapse(position == 'AFTERBEGIN');
                } else {
                    begin = position == 'BEFOREBEGIN';
                    range[begin ? 'setStartBefore' : 'setEndAfter'](element);
                    range.collapse(begin);
                }
                range.insertNode(range.createContextualFragment(html));
            }
            return element;
        };

        /**
         * 为目标元素添加className
         * @name baidu.dom.addClass
         * @function
         * @grammar baidu.dom.addClass(element, className)
         * @param {HTMLElement|string} element 目标元素或目标元素的id
         * @param {string} className 要添加的className，允许同时添加多个class，中间使用空白符分隔
         * @remark
         * 使用者应保证提供的className合法性，不应包含不合法字符，className合法字符参考：http://www.w3.org/TR/CSS2/syndata.html。
         * @shortcut addClass
         * @meta standard
         * 	            
         * @returns {HTMLElement} 目标元素
         */
        baidu.ac = baidu.dom.addClass = function (element, className) {
            element = baidu.dom.g(element);
            var classArray = className.split(/\s+/),
                result = element.className,
                classMatch = " " + result + " ",
                i = 0,
                l = classArray.length;

            for (; i < l; i++){
                 if ( classMatch.indexOf( " " + classArray[i] + " " ) < 0 ) {
                     result += (result ? ' ' : '') + classArray[i];
                 }
            }

            element.className = result;
            return element;
        };

        /**
         * @ignore
         * @namespace baidu.event 屏蔽浏览器差异性的事件封装。
         * @property target 	事件的触发元素
         * @property pageX 		鼠标事件的鼠标x坐标
         * @property pageY 		鼠标事件的鼠标y坐标
         * @property keyCode 	键盘事件的键值
         */
        baidu.event = baidu.event || {};

        /**
         * 事件监听器的存储表
         * @private
         * @meta standard
         */
        baidu.event._listeners = baidu.event._listeners || [];

        /**
         * 为目标元素添加事件监听器
         * @name baidu.event.on
         * @function
         * @grammar baidu.event.on(element, type, listener)
         * @param {HTMLElement|string|window} element 目标元素或目标元素id
         * @param {string} type 事件类型
         * @param {Function} listener 需要添加的监听器
         * @remark
         *  1. 不支持跨浏览器的鼠标滚轮事件监听器添加<br>
         *  2. 改方法不为监听器灌入事件对象，以防止跨iframe事件挂载的事件对象获取失败            
         * @shortcut on
         * @meta standard
         * @see baidu.event.un
         *             
         * @returns {HTMLElement|window} 目标元素
         */
        baidu.on = baidu.event.on = function (element, type, listener) {
            type = type.replace(/^on/i, '');
            element = baidu._g(element);
            var realListener = function (ev) {
                // 1. 这里不支持EventArgument,  原因是跨frame的事件挂载
                // 2. element是为了修正this
                listener.call(element, ev);
            },
            lis = baidu.event._listeners,
            filter = baidu.event._eventFilter,
            afterFilter,
            realType = type;
            type = type.toLowerCase();
            // filter过滤
            if(filter && filter[type]){
                afterFilter = filter[type](element, type, realListener);
                realType = afterFilter.type;
                realListener = afterFilter.listener;
            }
            // 事件监听器挂载
            if (element.addEventListener) {
                element.addEventListener(realType, realListener, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + realType, realListener);
            }
          
            // 将监听器存储到数组中
            lis[lis.length] = [element, type, listener, realListener, realType];
            return element;
        };

        /**
         * 为目标元素移除事件监听器
         * @name baidu.event.un
         * @function
         * @grammar baidu.event.un(element, type, listener)
         * @param {HTMLElement|string|window} element 目标元素或目标元素id
         * @param {string} type 事件类型
         * @param {Function} listener 需要移除的监听器
         * @shortcut un
         * @meta standard
         *             
         * @returns {HTMLElement|window} 目标元素
         */
        baidu.un = baidu.event.un = function (element, type, listener) {
            element = baidu._g(element);
            type = type.replace(/^on/i, '').toLowerCase();
            
            var lis = baidu.event._listeners, 
                len = lis.length,
                isRemoveAll = !listener,
                item,
                realType, realListener;
            
            //如果将listener的结构改成json
            //可以节省掉这个循环，优化性能
            //但是由于un的使用频率并不高，同时在listener不多的时候
            //遍历数组的性能消耗不会对代码产生影响
            //暂不考虑此优化
            while (len--) {
                item = lis[len];
                
                // listener存在时，移除element的所有以listener监听的type类型事件
                // listener不存在时，移除element的所有type类型事件
                if (item[1] === type
                    && item[0] === element
                    && (isRemoveAll || item[2] === listener)) {
                    realType = item[4];
                    realListener = item[3];
                    if (element.removeEventListener) {
                        element.removeEventListener(realType, realListener, false);
                    } else if (element.detachEvent) {
                        element.detachEvent('on' + realType, realListener);
                    }
                    lis.splice(len, 1);
                }
            }            
            return element;
        };

        /**
         * 获取event事件,解决不同浏览器兼容问题
         * @param {Event}
         * @return {Event}
         */
        baidu.getEvent = baidu.event.getEvent = function (event) {
            return window.event || event;
        }

        /**
         * 获取event.target,解决不同浏览器兼容问题
         * @param {Event}
         * @return {Target}
         */
        baidu.getTarget = baidu.event.getTarget = function (event) {
            var event = baidu.getEvent(event);
            return event.target || event.srcElement;
        }

        /**
         * 阻止事件的默认行为
         * @name baidu.event.preventDefault
         * @function
         * @grammar baidu.event.preventDefault(event)
         * @param {Event} event 事件对象
         * @meta standard
         */
        baidu.preventDefault = baidu.event.preventDefault = function (event) {
           var event = baidu.getEvent(event);
           if (event.preventDefault) {
               event.preventDefault();
           } else {
               event.returnValue = false;
           }
        };

        /**
         * 停止事件冒泡传播
         * @param {Event}
         */
        baidu.stopBubble = baidu.event.stopBubble = function (event) {
            event = baidu.getEvent(event);
            event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
        }

    })();

    /** 
     * @exports DrawingManager as BMapLib.DrawingManager 
     */
    var DrawingManager =
        /**
         * DrawingManager类的构造函数
         * @class 鼠标绘制管理类，实现鼠标绘制管理的<b>入口</b>。
         * 实例化该类后，即可调用该类提供的open
         * 方法开启绘制模式状态。
         * 也可加入工具栏进行选择操作。
         * 
         * @constructor
         * @param {Map} map Baidu map的实例对象
         * @param {Json Object} opts 可选的输入参数，非必填项。可输入选项包括：<br />
         * {"<b>isOpen</b>" : {Boolean} 是否开启绘制模式
         * <br />"<b>enableDrawingTool</b>" : {Boolean} 是否添加绘制工具栏控件，默认不添加
         * <br />"<b>drawingToolOptions</b>" : {Json Object} 可选的输入参数，非必填项。可输入选项包括
         * <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"<b>anchor</b>" : {ControlAnchor} 停靠位置、默认左上角
         * <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"<b>offset</b>" : {Size} 偏移值。
         * <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"<b>scale</b>" : {Number} 工具栏的缩放比例,默认为1
         * <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"<b>drawingModes</b>" : {DrawingType<Array>} 工具栏上可以选择出现的绘制模式,将需要显示的DrawingType以数组型形式传入，如[BMAP_DRAWING_MARKER, BMAP_DRAWING_CIRCLE] 将只显示画点和画圆的选项
         * <br />"<b>enableCalculate</b>" : {Boolean} 绘制是否进行测距(画线时候)、测面(画圆、多边形、矩形)
         * <br />"<b>markerOptions</b>" : {CircleOptions} 所画的点的可选参数，参考api中的<a href="http://developer.baidu.com/map/reference/index.php?title=Class:%E6%80%BB%E7%B1%BB/%E8%A6%86%E7%9B%96%E7%89%A9%E7%B1%BB">对应类</a>
         * <br />"<b>circleOptions</b>" : {CircleOptions} 所画的圆的可选参数，参考api中的<a href="http://developer.baidu.com/map/reference/index.php?title=Class:%E6%80%BB%E7%B1%BB/%E8%A6%86%E7%9B%96%E7%89%A9%E7%B1%BB">对应类</a>
         * <br />"<b>polylineOptions</b>" : {CircleOptions} 所画的线的可选参数，参考api中的<a href="http://developer.baidu.com/map/reference/index.php?title=Class:%E6%80%BB%E7%B1%BB/%E8%A6%86%E7%9B%96%E7%89%A9%E7%B1%BB">对应类</a>
         * <br />"<b>polygonOptions</b>" : {PolygonOptions} 所画的多边形的可选参数，参考api中的<a href="http://developer.baidu.com/map/reference/index.php?title=Class:%E6%80%BB%E7%B1%BB/%E8%A6%86%E7%9B%96%E7%89%A9%E7%B1%BB">对应类</a>
         * <br />"<b>rectangleOptions</b>" : {PolygonOptions} 所画的矩形的可选参数，参考api中的<a href="http://developer.baidu.com/map/reference/index.php?title=Class:%E6%80%BB%E7%B1%BB/%E8%A6%86%E7%9B%96%E7%89%A9%E7%B1%BB">对应类</a>
         *
         * @example <b>参考示例：</b><br />
         * var map = new BMap.Map("container");<br />map.centerAndZoom(new BMap.Point(116.404, 39.915), 15);<br />
         * var myDrawingManagerObject = new BMapLib.DrawingManager(map, {isOpen: true, 
         *     drawingType: BMAP_DRAWING_MARKER, enableDrawingTool: true,
         *     enableCalculate: false,
         *     drawingToolOptions: {
         *         anchor: BMAP_ANCHOR_TOP_LEFT,
         *         offset: new BMap.Size(5, 5),
         *         drawingTypes : [
         *             BMAP_DRAWING_MARKER,
         *             BMAP_DRAWING_CIRCLE,
         *             BMAP_DRAWING_POLYLINE,
         *             BMAP_DRAWING_POLYGON,
         *             BMAP_DRAWING_RECTANGLE 
         *          ]
         *     },
         *     polylineOptions: {
         *         strokeColor: "#333"
         *     });
         */
        BMapLib.DrawingManager = function(map, opts){
            if (!map) {
                return;
            }
            instances.push(this);
            
            opts = opts || {};

            this._initialize(map, opts);
        }

    // 通过baidu.lang下的inherits方法，让DrawingManager继承baidu.lang.Class
    baidu.lang.inherits(DrawingManager, baidu.lang.Class, "DrawingManager");

    /**
     * 开启地图的绘制模式
     *
     * @example <b>参考示例：</b><br />
     * myDrawingManagerObject.open();
     */
    DrawingManager.prototype.open = function() {
        // 判断绘制状态是否已经开启
        if (this._isOpen == true){
            return true;
        }
        closeInstanceExcept(this);

        this._open();
    }

    /**
     * 关闭地图的绘制状态
     *
     * @example <b>参考示例：</b><br />
     * myDrawingManagerObject.close();
     */
    DrawingManager.prototype.close = function() {

        // 判断绘制状态是否已经开启
        if (this._isOpen == false){
            return true;
        }

        this._close();
    }

    /**
     * 设置当前的绘制模式，参数DrawingType，为5个可选常量:
     * <br/>BMAP_DRAWING_MARKER    画点
     * <br/>BMAP_DRAWING_CIRCLE    画圆
     * <br/>BMAP_DRAWING_POLYLINE  画线
     * <br/>BMAP_DRAWING_POLYGON   画多边形
     * <br/>BMAP_DRAWING_RECTANGLE 画矩形
     * @param {DrawingType} DrawingType
     * @return {Boolean} 
     *
     * @example <b>参考示例：</b><br />
     * myDrawingManagerObject.setDrawingMode(BMAP_DRAWING_POLYLINE);
     */
    DrawingManager.prototype.setDrawingMode = function(drawingType) {
        //与当前模式不一样时候才进行重新绑定事件
        if (this._drawingType != drawingType) {
            closeInstanceExcept(this);
            this._setDrawingMode(drawingType);
        }
    }

    /**
     * 获取当前的绘制模式
     * @return {DrawingType} 绘制的模式
     *
     * @example <b>参考示例：</b><br />
     * alert(myDrawingManagerObject.getDrawingMode());
     */
    DrawingManager.prototype.getDrawingMode = function() {
        return this._drawingType;
    }

    /**
     * 打开距离或面积计算
     *
     * @example <b>参考示例：</b><br />
     * myDrawingManagerObject.enableCalculate();
     */
    DrawingManager.prototype.enableCalculate = function() {
        this._enableCalculate = true;
        this._addGeoUtilsLibrary();
    }

    /**
     * 关闭距离或面积计算
     *
     * @example <b>参考示例：</b><br />
     * myDrawingManagerObject.disableCalculate();
     */
    DrawingManager.prototype.disableCalculate = function() {
        this._enableCalculate = false;
    }

	/**
   	 * 鼠标绘制完成后，派发总事件的接口
     * @name DrawingManager#overlaycomplete
     * @event
     * @param {Event Object} e 回调函数会返回event参数，包括以下返回值：
     * <br />{"<b>drawingMode</b> : {DrawingType} 当前的绘制模式
     * <br />"<b>overlay</b>：{Marker||Polyline||Polygon||Circle} 对应的绘制模式返回对应的覆盖物
     * <br />"<b>calculate</b>：{Number} 需要开启计算模式才会返回这个值，当绘制线的时候返回距离、绘制多边形、圆、矩形时候返回面积，单位为米，
     * <br />"<b>label</b>：{Label} 计算面积时候出现在Map上的Label对象
     *
     * @example <b>参考示例：</b>
     * myDrawingManagerObject.addEventListener("overlaycomplete", function(e) {
     *     alert(e.drawingMode);
     *     alert(e.overlay);
     *     alert(e.calculate);
     *     alert(e.label);
     * });
     */

    /**
   	 * 绘制点完成后，派发的事件接口
     * @name DrawingManager#markercomplete
     * @event
     * @param {Marker} overlay 回调函数会返回相应的覆盖物，
     * <br />{"<b>overlay</b> : {Marker} 
     *
     * @example <b>参考示例：</b>
     * myDrawingManagerObject.addEventListener("circlecomplete", function(e, overlay) {
     *     alert(overlay);
     * });
     */

    /**
   	 * 绘制圆完成后，派发的事件接口
     * @name DrawingManager#circlecomplete
     * @event
     * @param {Circle} overlay 回调函数会返回相应的覆盖物，
     * <br />{"<b>overlay</b> : {Circle} 
     */

    /**
   	 * 绘制线完成后，派发的事件接口
     * @name DrawingManager#polylinecomplete
     * @event
     * @param {Polyline} overlay 回调函数会返回相应的覆盖物，
     * <br />{"<b>overlay</b> : {Polyline} 
     */

    /**
   	 * 绘制多边形完成后，派发的事件接口
     * @name DrawingManager#polygoncomplete
     * @event
     * @param {Polygon} overlay 回调函数会返回相应的覆盖物，
     * <br />{"<b>overlay</b> : {Polygon} 
     */

    /**
   	 * 绘制矩形完成后，派发的事件接口
     * @name DrawingManager#rectanglecomplete
     * @event
     * @param {Polygon} overlay 回调函数会返回相应的覆盖物，
     * <br />{"<b>overlay</b> : {Polygon} 
     */

    /**
     * 初始化状态
     * @param {Map} 地图实例
     * @param {Object} 参数
     */
    DrawingManager.prototype._initialize = function(map, opts) {

        /**
         * map对象
         * @private
         * @type {Map}
         */
        this._map = map;

        /**
         * 配置对象
         * @private
         * @type {Object}
         */
        this._opts = opts;

        /**
         * 当前的绘制模式, 默认是绘制点
         * @private
         * @type {DrawingType}
         */
        this._drawingType = opts.drawingMode || BMAP_DRAWING_MARKER;

        /**
         * 是否添加添加鼠标绘制工具栏面板
         */
        if (opts.enableDrawingTool) {
            var drawingTool  = new DrawingTool(this, opts.drawingToolOptions);
            this._drawingTool = drawingTool;
            map.addControl(drawingTool);
        }

        //是否计算绘制出的面积 
        if (opts.enableCalculate === true) {
            this.enableCalculate();
        } else {
            this.disableCalculate();
        }

        /**
         * 是否已经开启了绘制状态
         * @private
         * @type {Boolean}
         */
        this._isOpen = !!(opts.isOpen === true);
        if (this._isOpen) {
            this._open();
        }

        this.markerOptions    = opts.markerOptions    || {};
        this.circleOptions    = opts.circleOptions    || {};
        this.polylineOptions  = opts.polylineOptions  || {};
        this.polygonOptions   = opts.polygonOptions   || {};
        this.rectangleOptions = opts.rectangleOptions || {};

    },

    /**
     * 开启地图的绘制状态
     * @return {Boolean}，开启绘制状态成功，返回true；否则返回false。
     */
    DrawingManager.prototype._open = function() {

        this._isOpen = true;

        //添加遮罩，所有鼠标操作都在这个遮罩上完成
        if (!this._mask) {
            this._mask = new Mask();
        }
        this._map.addOverlay(this._mask);
        this._setDrawingMode(this._drawingType);

    }

    /**
     * 设置当前的绘制模式
     * @param {DrawingType}
     */
    DrawingManager.prototype._setDrawingMode = function(drawingType) {

        this._drawingType = drawingType;

        /**
         * 开启编辑状态时候才重新进行事件绑定
         */
        if (this._isOpen) {
            //清空之前的自定义事件
            this._mask.__listeners = {};

            switch (drawingType) {
                case BMAP_DRAWING_MARKER:
                    this._bindMarker();
                    break;
                case BMAP_DRAWING_CIRCLE:
                    this._bindCircle();
                    break;
                case BMAP_DRAWING_POLYLINE:
                case BMAP_DRAWING_POLYGON:
                    this._bindPolylineOrPolygon();
                    break;
                case BMAP_DRAWING_RECTANGLE:
                    this._bindRectangle();
                    break;
            }
        }

        /** 
         * 如果添加了工具栏，则也需要改变工具栏的样式
         */
        if (this._drawingTool && this._isOpen) {
            this._drawingTool.setStyleByDrawingMode(drawingType);
        }
    }

    /**
     * 关闭地图的绘制状态
     * @return {Boolean}，关闭绘制状态成功，返回true；否则返回false。
     */
    DrawingManager.prototype._close = function() {

        this._isOpen = false;

        if (this._mask) {
            this._map.removeOverlay(this._mask);
        }

        /** 
         * 如果添加了工具栏，则关闭时候将工具栏样式设置为拖拽地图
         */
        if (this._drawingTool) {
            this._drawingTool.setStyleByDrawingMode("hander");
        }
    }

    /**
     * 绑定鼠标画点的事件
     */
    DrawingManager.prototype._bindMarker = function() {

        var me   = this,
            map  = this._map,
            mask = this._mask;

        /**
         * 鼠标点击的事件
         */
        var clickAction = function (e) {
            // 往地图上添加marker
            var marker = new BMap.Marker(e.point, me.markerOptions);
            map.addOverlay(marker);
            me._dispatchOverlayComplete(marker);
        }

        mask.addEventListener('click', clickAction);
    }

    /**
     * 绑定鼠标画圆的事件
     */
    DrawingManager.prototype._bindCircle = function() {

        var me           = this,
            map          = this._map,
            mask         = this._mask,
            circle       = null,
            centerPoint  = null; //圆的中心点

        /**
         * 开始绘制圆形
         */
        var startAction = function (e) {
            centerPoint = e.point;
            circle = new BMap.Circle(centerPoint, 0, me.circleOptions);
            map.addOverlay(circle);
            mask.enableEdgeMove();
            mask.addEventListener('mousemove', moveAction);
            baidu.on(document, 'mouseup', endAction);
            // sharepage extend: 开始绘制事件
            me._dispatchOverlayStart();
        }

        /**
         * 绘制圆形过程中，鼠标移动过程的事件
         */
        var moveAction = function(e) {
            circle.setRadius(me._map.getDistance(centerPoint, e.point));
        }

        /**
         * 绘制圆形结束
         */
        var endAction = function (e) {
            var calculate = me._calculate(circle, e.point);
            me._dispatchOverlayComplete(circle, calculate);
            centerPoint = null;
            mask.disableEdgeMove();
            mask.removeEventListener('mousemove', moveAction);
            baidu.un(document, 'mouseup', endAction);
        }

        /**
         * 鼠标点击起始点
         */
        var mousedownAction = function (e) {
            baidu.preventDefault(e);
            baidu.stopBubble(e);
            if (centerPoint == null) {
                startAction(e);
            } 
        }

        mask.addEventListener('mousedown', mousedownAction);
    }

    /**
     * 画线和画多边形相似性比较大，公用一个方法
     */
    DrawingManager.prototype._bindPolylineOrPolygon = function() {

        var me           = this,
            map          = this._map,
            mask         = this._mask,
            points       = [],   //用户绘制的点
            drawPoint    = null; //实际需要画在地图上的点
            overlay      = null,
            isBinded     = false;

        /**
         * 鼠标点击的事件
         */
        var startAction = function (e) {
            points.push(e.point);
            drawPoint = points.concat(points[points.length - 1]);
            if (points.length == 1) {
                if (me._drawingType == BMAP_DRAWING_POLYLINE) {
                    overlay = new BMap.Polyline(drawPoint, me.polylineOptions);
                } else if (me._drawingType == BMAP_DRAWING_POLYGON) {
                    overlay = new BMap.Polygon(drawPoint, me.polygonOptions);
                }
                map.addOverlay(overlay);
            } else {
                overlay.setPath(drawPoint);
            }
            if (!isBinded) {
                isBinded = true;
                mask.enableEdgeMove();
                mask.addEventListener('mousemove', mousemoveAction);
                mask.addEventListener('dblclick', dblclickAction);
            }

            // sharepage extend: 开始绘制事件
            me._dispatchOverlayStart();
        }

        /**
         * 鼠标移动过程的事件
         */
        var mousemoveAction = function(e) {
            overlay.setPositionAt(drawPoint.length - 1, e.point);
        }

        /**
         * 鼠标双击的事件
         */
        var dblclickAction = function (e) {
            baidu.stopBubble(e);
            isBinded = false;
            mask.disableEdgeMove();
            mask.removeEventListener('mousemove', mousemoveAction);
            mask.removeEventListener('dblclick', dblclickAction);
            overlay.setPath(points);
            var calculate = me._calculate(overlay, points.pop());
            me._dispatchOverlayComplete(overlay, calculate);
            points.length = 0;
            drawPoint.length = 0;
        }

        mask.addEventListener('click', startAction);

        //双击时候不放大地图级别
        mask.addEventListener('dblclick', function(e){
            baidu.stopBubble(e);
        });
    }

    /**
     * 绑定鼠标画矩形的事件
     */
    DrawingManager.prototype._bindRectangle = function() {

        var me           = this,
            map          = this._map,
            mask         = this._mask,
            polygon      = null,
            startPoint   = null;

        /**
         * 开始绘制矩形
         */
        var startAction = function (e) {
            baidu.stopBubble(e);
            baidu.preventDefault(e);
            startPoint = e.point;
            var endPoint = startPoint;
            polygon = new BMap.Polygon(me._getRectanglePoint(startPoint, endPoint), me.rectangleOptions);
            map.addOverlay(polygon);
            mask.enableEdgeMove();
            mask.addEventListener('mousemove', moveAction);
            baidu.on(document, 'mouseup', endAction);
            // sharepage extend: 开始绘制事件
            me._dispatchOverlayStart();
        }

        /**
         * 绘制矩形过程中，鼠标移动过程的事件
         */
        var moveAction = function(e) {
            polygon.setPath(me._getRectanglePoint(startPoint, e.point));
        }

        /**
         * 绘制矩形结束
         */
        var endAction = function (e) {
            var calculate = me._calculate(polygon, polygon.getPath()[2]);
            me._dispatchOverlayComplete(polygon, calculate);
            startPoint = null;
            mask.disableEdgeMove();
            mask.removeEventListener('mousemove', moveAction);
            baidu.un(document, 'mouseup', endAction);
        }

        mask.addEventListener('mousedown', startAction);
    }

    /**
     * 添加显示所绘制图形的面积或者长度
     * @param {overlay} 覆盖物
     * @param {point} 显示的位置
     */
    DrawingManager.prototype._calculate = function (overlay, point) {
        var result = {
            data  : 0,    //计算出来的长度或面积
            label : null  //显示长度或面积的label对象
        };
        if (this._enableCalculate && BMapLib.GeoUtils) {
            var type = overlay.toString();
            //不同覆盖物调用不同的计算方法
            switch (type) {
                case "[object Polyline]":
                    result.data = BMapLib.GeoUtils.getPolylineDistance(overlay);
                    break;
                case "[object Polygon]":
                    result.data = BMapLib.GeoUtils.getPolygonArea(overlay);
                    break;
                case "[object Circle]":
                    var radius = overlay.getRadius();
                    result.data = Math.PI * radius * radius;
                    break;
            }
            //一场情况处理
            if (!result.data || result.data < 0) {
                result.data = 0;
            } else {
                //保留2位小数位
                result.data = result.data.toFixed(2);
            }
            result.label = this._addLabel(point, result.data);
        }
        return result;
    }

    /**
     * 开启测距和测面功能需要依赖于GeoUtils库
     * 所以这里判断用户是否已经加载,若未加载则用js动态加载
     */
    DrawingManager.prototype._addGeoUtilsLibrary = function () {
        if (!BMapLib.GeoUtils) {
            var script = document.createElement('script');
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", 'http://api.map.baidu.com/library/GeoUtils/1.2/src/GeoUtils_min.js');
            document.body.appendChild(script);
        }
    }

    /**
     * 向地图中添加文本标注
     * @param {Point}
     * @param {String} 所以显示的内容
     */
    DrawingManager.prototype._addLabel = function (point, content) {
        var label = new BMap.Label(content, {
            position: point
        });
        this._map.addOverlay(label);
        return label;
    }

    /**
     * 根据起终点获取矩形的四个顶点
     * @param {Point} 起点
     * @param {Point} 终点
     */
    DrawingManager.prototype._getRectanglePoint = function (startPoint, endPoint) {
        return [
            new BMap.Point(startPoint.lng,startPoint.lat),
            new BMap.Point(endPoint.lng,startPoint.lat),
            new BMap.Point(endPoint.lng,endPoint.lat),
            new BMap.Point(startPoint.lng,endPoint.lat)
        ];
    }

    /**
     * 派发事件
     */
    DrawingManager.prototype._dispatchOverlayComplete = function (overlay, calculate) {
        var options = {
            'overlay'     : overlay,
            'drawingMode' : this._drawingType
        };
        if (calculate) {
            options.calculate = calculate.data || null;
            options.label = calculate.label || null;
        }
        this.dispatchEvent(this._drawingType + 'complete', overlay);
        this.dispatchEvent('overlaycomplete', options);
    }

    /**
     * sharepage.ext 派发事件
     */
    DrawingManager.prototype._dispatchOverlayStart = function () {
        var options = {
            'drawingMode' : this._drawingType
        };
        this.dispatchEvent('overlaystart', options);
    }

    /**
     * 创建遮罩对象
     */
    function Mask(){
        /**
         * 鼠标到地图边缘的时候是否自动平移地图
         */
        this._enableEdgeMove = false;
    }

    Mask.prototype = new BMap.Overlay();

    /**
     * 这里不使用api中的自定义事件，是为了更灵活使用
     */
    Mask.prototype.dispatchEvent = baidu.lang.Class.prototype.dispatchEvent;
    Mask.prototype.addEventListener = baidu.lang.Class.prototype.addEventListener;
    Mask.prototype.removeEventListener = baidu.lang.Class.prototype.removeEventListener;

    Mask.prototype.initialize = function(map){
        var me = this;
        this._map = map;
        var div = this.container = document.createElement("div");
        var size = this._map.getSize();
        div.style.cssText = "position:absolute;background:url(about:blank);cursor:crosshair;width:" + size.width + "px;height:" + size.height + "px";
        this._map.addEventListener('resize', function(e) {
            me._adjustSize(e.size);
        });
        this._map.getPanes().floatPane.appendChild(div);
        this._bind();
        return div; 
    };

    Mask.prototype.draw = function() {
        var map   = this._map,
            point = map.pixelToPoint(new BMap.Pixel(0, 0)),
            pixel = map.pointToOverlayPixel(point);
        this.container.style.left = pixel.x + "px";
        this.container.style.top  = pixel.y + "px"; 
    };

    /**
     * 开启鼠标到地图边缘，自动平移地图
     */
    Mask.prototype.enableEdgeMove = function() {
        this._enableEdgeMove = true;
    }

    /**
     * 关闭鼠标到地图边缘，自动平移地图
     */
    Mask.prototype.disableEdgeMove = function() {
        clearInterval(this._edgeMoveTimer);
        this._enableEdgeMove = false;
    }

    /**
     * 绑定事件,派发自定义事件
     */
    Mask.prototype._bind = function() {

        var me = this,
            map = this._map,
            container = this.container,
            lastMousedownXY = null,
            lastClickXY = null;

        /**
         * 根据event对象获取鼠标的xy坐标对象
         * @param {Event}
         * @return {Object} {x:e.x, y:e.y}
         */
        var getXYbyEvent = function(e){
            return {
                x : e.clientX,
                y : e.clientY
            }
        };

        var domEvent = function(e) {
            var type = e.type;
                e = baidu.getEvent(e);
                point = me.getDrawPoint(e); //当前鼠标所在点的地理坐标

            var dispatchEvent = function(type) {
                e.point = point;
                me.dispatchEvent(e);
            }

            if (type == "mousedown") {
                lastMousedownXY = getXYbyEvent(e);
            }

            var nowXY = getXYbyEvent(e);
            //click经过一些特殊处理派发，其他同事件按正常的dom事件派发
            if (type == "click") {
                //鼠标点击过程不进行移动才派发click和dblclick
                if (Math.abs(nowXY.x - lastMousedownXY.x) < 5 && Math.abs(nowXY.y - lastMousedownXY.y) < 5 ) {
                    if (!lastClickXY || !(Math.abs(nowXY.x - lastClickXY.x) < 5 && Math.abs(nowXY.y - lastClickXY.y) < 5)) {
                        dispatchEvent('click');
                        lastClickXY = getXYbyEvent(e);
                    } else {
                        lastClickXY = null;
                    }
                }
            } else {
                dispatchEvent(type);
            }
        }

        /**
         * 将事件都遮罩层的事件都绑定到domEvent来处理
         */
        var events = ['click', 'mousedown', 'mousemove', 'mouseup', 'dblclick'],
            index = events.length;
        while (index--) {
            baidu.on(container, events[index], domEvent);
        }

        //鼠标移动过程中，到地图边缘后自动平移地图
        baidu.on(container, 'mousemove', function(e) {
            if (me._enableEdgeMove) {
                me.mousemoveAction(e);
            }
        });
    };

    //鼠标移动过程中，到地图边缘后自动平移地图
    Mask.prototype.mousemoveAction = function(e) {
        function getClientPosition(e) {
            var clientX = e.clientX,
                clientY = e.clientY;
            if (e.changedTouches) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            }
            return new BMap.Pixel(clientX, clientY);
        }

        var map       = this._map,
            me        = this,
            pixel     = map.pointToPixel(this.getDrawPoint(e)),
            clientPos = getClientPosition(e),
            offsetX   = clientPos.x - pixel.x,
            offsetY   = clientPos.y - pixel.y;
        pixel = new BMap.Pixel((clientPos.x - offsetX), (clientPos.y - offsetY));
        this._draggingMovePixel = pixel;
        var point = map.pixelToPoint(pixel),
            eventObj = {
                pixel: pixel,
                point: point
            };
        // 拖拽到地图边缘移动地图
        this._panByX = this._panByY = 0;
        if (pixel.x <= 20 || pixel.x >= map.width - 20
            || pixel.y <= 50 || pixel.y >= map.height - 10) {
            if (pixel.x <= 20) {
                this._panByX = 8;
            } else if (pixel.x >= map.width - 20) {
                this._panByX = -8;
            }
            if (pixel.y <= 50) {
                this._panByY = 8;
            } else if (pixel.y >= map.height - 10) {
                this._panByY = -8;
            }
            if (!this._edgeMoveTimer) {
                this._edgeMoveTimer = setInterval(function(){
                    map.panBy(me._panByX, me._panByY, {"noAnimation": true});
                }, 30);
            }
        } else {
            if (this._edgeMoveTimer) {
                clearInterval(this._edgeMoveTimer);
                this._edgeMoveTimer = null;
            }
        }
    }

    /*
     * 调整大小
     * @param {Size}
     */
    Mask.prototype._adjustSize = function(size) {
        this.container.style.width  = size.width + 'px';
        this.container.style.height = size.height + 'px';
    };

    /**
     * 获取当前绘制点的地理坐标
     *
     * @param {Event} e e对象
     * @return Point对象的位置信息
     */
    Mask.prototype.getDrawPoint = function(e) {
        
        var map = this._map,
        trigger = baidu.getTarget(e),
        x = e.offsetX || e.layerX || 0,
        y = e.offsetY || e.layerY || 0;
        if (trigger.nodeType != 1) trigger = trigger.parentNode;
        while (trigger && trigger != map.getContainer()) {
            if (!(trigger.clientWidth == 0 &&
                trigger.clientHeight == 0 &&
                trigger.offsetParent && trigger.offsetParent.nodeName == 'TD')) {
                x += trigger.offsetLeft || 0;
                y += trigger.offsetTop || 0;
            }
            trigger = trigger.offsetParent;
        }
        var pixel = new BMap.Pixel(x, y);
        var point = map.pixelToPoint(pixel);
        return point;

    }

    /**
     * 绘制工具面板，自定义控件
     */
    function DrawingTool(drawingManager, drawingToolOptions) {
        this.drawingManager = drawingManager;

        drawingToolOptions = this.drawingToolOptions = drawingToolOptions || {};
        // 默认停靠位置和偏移量
        this.defaultAnchor = BMAP_ANCHOR_TOP_LEFT;
        this.defaultOffset = new BMap.Size(10, 10);

        //默认所有工具栏都显示
        this.defaultDrawingModes = [
            BMAP_DRAWING_MARKER,
            BMAP_DRAWING_CIRCLE,
            BMAP_DRAWING_POLYLINE,
            BMAP_DRAWING_POLYGON,
            BMAP_DRAWING_RECTANGLE
        ];
        //工具栏可显示的绘制模式
        if (drawingToolOptions.drawingModes) {
            this.drawingModes = drawingToolOptions.drawingModes;
        } else {
            this.drawingModes = this.defaultDrawingModes
        }

        //用户设置停靠位置和偏移量
        if (drawingToolOptions.anchor) {
            this.setAnchor(drawingToolOptions.anchor);
        }
        if (drawingToolOptions.offset) {
            this.setOffset(drawingToolOptions.offset);
        }
    }

    // 通过JavaScript的prototype属性继承于BMap.Control
    DrawingTool.prototype = new BMap.Control();

    // 自定义控件必须实现自己的initialize方法,并且将控件的DOM元素返回
    // 在本方法中创建个div元素作为控件的容器,并将其添加到地图容器中
    DrawingTool.prototype.initialize = function(map){
        // 创建一个DOM元素
        var container = this.container = document.createElement("div");
        container.className = "BMapLib_Drawing";
        //用来设置外层边框阴影
        var panel = this.panel = document.createElement("div");
        panel.className = "BMapLib_Drawing_panel";
        if (this.drawingToolOptions && this.drawingToolOptions.scale) {
            this._setScale(this.drawingToolOptions.scale);
        }
        container.appendChild(panel);
        // 添加内容
        panel.innerHTML = this._generalHtml();
        //绑定事件
        this._bind(panel);
        // 添加DOM元素到地图中
        map.getContainer().appendChild(container);
        // 将DOM元素返回
        return container;
    }

    //生成工具栏的html元素
    DrawingTool.prototype._generalHtml = function(map){

        //鼠标经过工具栏上的提示信息
        var tips = {};
        tips["hander"]               = "拖动地图";
        tips[BMAP_DRAWING_MARKER]    = "画点";
        tips[BMAP_DRAWING_CIRCLE]    = "画圆";
        tips[BMAP_DRAWING_POLYLINE]  = "画折线";
        tips[BMAP_DRAWING_POLYGON]   = "画多边形";
        tips[BMAP_DRAWING_RECTANGLE] = "画矩形";

        var getItem = function(className, drawingType) {
            return '<a class="' + className + '" drawingType="' + drawingType + '" href="javascript:void(0)" title="' + tips[drawingType] + '" onfocus="this.blur()"></a>';
        }

        var html = [];
        html.push(getItem("BMapLib_box BMapLib_hander", "hander"));
        for (var i = 0, len = this.drawingModes.length; i < len; i++) {
            var classStr = 'BMapLib_box BMapLib_' + this.drawingModes[i];
            if (i == len-1) {
                classStr += ' BMapLib_last';
            }
            html.push(getItem(classStr, this.drawingModes[i]));
        }
        return html.join('');
    }

    /**
     * 设置工具栏的缩放比例
     */
    DrawingTool.prototype._setScale = function(scale){
        var width  = 390,
            height = 50,
            ml = -parseInt((width - width * scale) / 2, 10),
            mt = -parseInt((height - height * scale) / 2, 10);
        this.container.style.cssText = [
            "-moz-transform: scale(" + scale + ");",
            "-o-transform: scale(" + scale + ");",
            "-webkit-transform: scale(" + scale + ");",
            "transform: scale(" + scale + ");",
            "margin-left:" + ml + "px;",
            "margin-top:" + mt + "px;",
            "*margin-left:0px;", //ie6、7
            "*margin-top:0px;",  //ie6、7
            "margin-left:0px\\0;", //ie8
            "margin-top:0px\\0;",  //ie8
            //ie下使用滤镜
            "filter: progid:DXImageTransform.Microsoft.Matrix(",
            "M11=" + scale + ",",
            "M12=0,",
            "M21=0,",
            "M22=" + scale + ",",
            "SizingMethod='auto expand');"
        ].join('');
    }

    //绑定工具栏的事件
    DrawingTool.prototype._bind = function(panel){
        var me = this;
        baidu.on(this.panel, 'click', function (e) {
            var target = baidu.getTarget(e);
            var drawingType = target.getAttribute('drawingType');
            me.setStyleByDrawingMode(drawingType);
            me._bindEventByDraingMode(drawingType);
        });
    }

    //设置工具栏当前选中的项样式
    DrawingTool.prototype.setStyleByDrawingMode = function(drawingType){
        if (!drawingType) {
            return;
        }
        var boxs = this.panel.getElementsByTagName("a");
        for (var i = 0, len = boxs.length; i < len; i++) {
            var box = boxs[i];
            if (box.getAttribute('drawingType') == drawingType) {
                var classStr = "BMapLib_box BMapLib_" + drawingType + "_hover";
                if (i == len - 1) {
                    classStr += " BMapLib_last";
                }
                box.className = classStr;
            } else {
                box.className = box.className.replace(/_hover/, "");
            }
        }
    }

    //设置工具栏当前选中的项样式
    DrawingTool.prototype._bindEventByDraingMode = function(drawingType){
        var drawingManager = this.drawingManager;
        //点在拖拽地图的按钮上
        if (drawingType == "hander") {
            drawingManager.close();
        } else {
            drawingManager.setDrawingMode(drawingType);
            drawingManager.open();
        }
    }

    //用来存储用户实例化出来的drawingmanager对象
    var instances = [];

    /*
     * 关闭其他实例的绘制模式
     * @param {DrawingManager} 当前的实例
     */
    function closeInstanceExcept(instance) {
        var index = instances.length;
        while (index--) {
            if (instances[index] != instance) {
                instances[index].close();
            }
        }
    }

})();



/** ================================================================================
 *
 * 百度地图的城市列表
 *
 ================================================================================ */
/**
 * @fileoverview 百度地图的城市列表类，对外开放。
 * 帮助用户直接生成城市列表，并自定义点击城市的操作。
 * 使用者可以通过接口直接获取城市数据。
 * 主入口类是<a href="symbols/BMapLib.CityList.html">CityList</a>，
 * 基于Baidu Map API 1.2。
 *
 * @author Baidu Map Api Group 
 * @version 1.2
 */

/** 
 * @namespace BMap的所有library类均放在BMapLib命名空间下
 */
var BMapLib = window.BMapLib = BMapLib || {};

(function() {
    /**
     * 声明baidu包
     */
    var baidu = baidu || {guid : "$BAIDU$"};
    (function() {
        // 一些页面级别唯一的属性，需要挂载在window[baidu.guid]上
        window[baidu.guid] = {};

        /**
         * 将源对象的所有属性拷贝到目标对象中
         * @name baidu.extend
         * @function
         * @grammar baidu.extend(target, source)
         * @param {Object} target 目标对象
         * @param {Object} source 源对象
         * @returns {Object} 目标对象
         */
        baidu.extend = function (target, source) {
            for (var p in source) {
                if (source.hasOwnProperty(p)) {
                    target[p] = source[p];
                }
            }    
            return target;
        };

        /**
         * @ignore
         * @namespace
         * @baidu.lang 对语言层面的封装，包括类型判断、模块扩展、继承基类以及对象自定义事件的支持。
         * @property guid 对象的唯一标识
        */
        baidu.lang = baidu.lang || {};

        /**
         * 返回一个当前页面的唯一标识字符串。
         * @function
         * @grammar baidu.lang.guid()
         * @returns {String} 当前页面的唯一标识字符串
         */
        baidu.lang.guid = function() {
            return "TANGRAM__" + (window[baidu.guid]._counter ++).toString(36);
        };

        window[baidu.guid]._counter = window[baidu.guid]._counter || 1;

        /**
         * 所有类的实例的容器
         * key为每个实例的guid
         */
        window[baidu.guid]._instances = window[baidu.guid]._instances || {};

        /**
         * Tangram继承机制提供的一个基类，用户可以通过继承baidu.lang.Class来获取它的属性及方法。
         * @function
         * @name baidu.lang.Class
         * @grammar baidu.lang.Class(guid)
         * @param {string} guid 对象的唯一标识
         * @meta standard
         * @remark baidu.lang.Class和它的子类的实例均包含一个全局唯一的标识guid。
         * guid是在构造函数中生成的，因此，继承自baidu.lang.Class的类应该直接或者间接调用它的构造函数。<br>
         * baidu.lang.Class的构造函数中产生guid的方式可以保证guid的唯一性，及每个实例都有一个全局唯一的guid。
         */
        baidu.lang.Class = function(guid) {
            this.guid = guid || baidu.lang.guid();
            window[baidu.guid]._instances[this.guid] = this;
        };

        window[baidu.guid]._instances = window[baidu.guid]._instances || {};

        /**
         * 判断目标参数是否string类型或String对象
         * @name baidu.lang.isString
         * @function
         * @grammar baidu.lang.isString(source)
         * @param {Any} source 目标参数
         * @shortcut isString
         * @meta standard
         *             
         * @returns {boolean} 类型判断结果
         */
        baidu.lang.isString = function (source) {
            return '[object String]' == Object.prototype.toString.call(source);
        };

        /**
         * 判断目标参数是否为function或Function实例
         * @name baidu.lang.isFunction
         * @function
         * @grammar baidu.lang.isFunction(source)
         * @param {Any} source 目标参数
         * @returns {boolean} 类型判断结果
         */
        baidu.lang.isFunction = function (source) {
            return '[object Function]' == Object.prototype.toString.call(source);
        };

        /**
         * 重载了默认的toString方法，使得返回信息更加准确一些。
         * @return {string} 对象的String表示形式
         */
        baidu.lang.Class.prototype.toString = function(){
            return "[object " + (this._className || "Object" ) + "]";
        };

        /**
         * 自定义的事件对象。
         * @function
         * @name baidu.lang.Event
         * @grammar baidu.lang.Event(type[, target])
         * @param {string} type  事件类型名称。为了方便区分事件和一个普通的方法，事件类型名称必须以"on"(小写)开头。
         * @param {Object} [target]触发事件的对象
         * @meta standard
         * @remark 引入该模块，会自动为Class引入3个事件扩展方法：addEventListener、removeEventListener和dispatchEvent。
         * @see baidu.lang.Class
         */
        baidu.lang.Event = function (type, target) {
            this.type = type;
            this.returnValue = true;
            this.target = target || null;
            this.currentTarget = null;
        };

        /**
         * 注册对象的事件监听器。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
         * @grammar obj.addEventListener(type, handler[, key])
         * @param   {string}   type         自定义事件的名称
         * @param   {Function} handler      自定义事件被触发时应该调用的回调函数
         * @param   {string}   [key]        为事件监听函数指定的名称，可在移除时使用。如果不提供，方法会默认为它生成一个全局唯一的key。
         * @remark  事件类型区分大小写。如果自定义事件名称不是以小写"on"开头，该方法会给它加上"on"再进行判断，即"click"和"onclick"会被认为是同一种事件。 
         */
        baidu.lang.Class.prototype.addEventListener = function (type, handler, key) {
            if (!baidu.lang.isFunction(handler)) {
                return;
            }
            !this.__listeners && (this.__listeners = {});
            var t = this.__listeners, id;
            if (typeof key == "string" && key) {
                if (/[^\w\-]/.test(key)) {
                    throw("nonstandard key:" + key);
                } else {
                    handler.hashCode = key; 
                    id = key;
                }
            }
            type.indexOf("on") != 0 && (type = "on" + type);
            typeof t[type] != "object" && (t[type] = {});
            id = id || baidu.lang.guid();
            handler.hashCode = id;
            t[type][id] = handler;
        };
         
        /**
         * 移除对象的事件监听器。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
         * @grammar obj.removeEventListener(type, handler)
         * @param {string}   type     事件类型
         * @param {Function|string} handler  要移除的事件监听函数或者监听函数的key
         * @remark  如果第二个参数handler没有被绑定到对应的自定义事件中，什么也不做。
         */
        baidu.lang.Class.prototype.removeEventListener = function (type, handler) {
            if (baidu.lang.isFunction(handler)) {
                handler = handler.hashCode;
            } else if (!baidu.lang.isString(handler)) {
                return;
            }
            !this.__listeners && (this.__listeners = {});
            type.indexOf("on") != 0 && (type = "on" + type);
            var t = this.__listeners;
            if (!t[type]) {
                return;
            }
            t[type][handler] && delete t[type][handler];
        };

        /**
         * 派发自定义事件，使得绑定到自定义事件上面的函数都会被执行。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
         * @grammar obj.dispatchEvent(event, options)
         * @param {baidu.lang.Event|String} event   Event对象，或事件名称(1.1.1起支持)
         * @param {Object} options 扩展参数,所含属性键值会扩展到Event对象上(1.2起支持)
         * @remark 处理会调用通过addEventListenr绑定的自定义事件回调函数之外，还会调用直接绑定到对象上面的自定义事件。
         * 例如：<br>
         * myobj.onMyEvent = function(){}<br>
         * myobj.addEventListener("onMyEvent", function(){});
         */
        baidu.lang.Class.prototype.dispatchEvent = function (event, options) {
            if (baidu.lang.isString(event)) {
                event = new baidu.lang.Event(event);
            }
            !this.__listeners && (this.__listeners = {});
            options = options || {};
            for (var i in options) {
                event[i] = options[i];
            }
            var i, t = this.__listeners, p = event.type;
            event.target = event.target || this;
            event.currentTarget = this;
            p.indexOf("on") != 0 && (p = "on" + p);
            baidu.lang.isFunction(this[p]) && this[p].apply(this, arguments);
            if (typeof t[p] == "object") {
                for (i in t[p]) {
                    t[p][i].apply(this, arguments);
                }
            }
            return event.returnValue;
        };

        /**
         * 为类型构造器建立继承关系
         * @name baidu.lang.inherits
         * @function
         * @grammar baidu.lang.inherits(subClass, superClass[, className])
         * @param {Function} subClass 子类构造器
         * @param {Function} superClass 父类构造器
         * @param {string} className 类名标识
         * @remark 使subClass继承superClass的prototype，
         * 因此subClass的实例能够使用superClass的prototype中定义的所有属性和方法。<br>
         * 这个函数实际上是建立了subClass和superClass的原型链集成，并对subClass进行了constructor修正。<br>
         * <strong>注意：如果要继承构造函数，需要在subClass里面call一下，具体见下面的demo例子</strong>
         * @shortcut inherits
         * @meta standard
         * @see baidu.lang.Class
         */
        baidu.lang.inherits = function (subClass, superClass, className) {
            var key, proto, 
                selfProps = subClass.prototype, 
                clazz = new Function();        
            clazz.prototype = superClass.prototype;
            proto = subClass.prototype = new clazz();
            for (key in selfProps) {
                proto[key] = selfProps[key];
            }
            subClass.prototype.constructor = subClass;
            subClass.superClass = superClass.prototype;

            if ("string" == typeof className) {
                proto._className = className;
            }
        };

        /**
         * @ignore
         * @namespace baidu.dom 操作dom的方法。
         */
        baidu.dom = baidu.dom || {};

        /**
         * 从文档中获取指定的DOM元素
         * @name baidu.dom.g
         * @function
         * @grammar baidu.dom.g(id)
         * @param {string|HTMLElement} id 元素的id或DOM元素
         * @meta standard
         *             
         * @returns {HTMLElement|null} 获取的元素，查找不到时返回null,如果参数不合法，直接返回参数
         */
        baidu.g = baidu.dom.g = function (id) {
            if ('string' == typeof id || id instanceof String) {
                return document.getElementById(id);
            } else if (id && id.nodeName && (id.nodeType == 1 || id.nodeType == 9)) {
                return id;
            }
            return null;
        };
        
        /**
         * @ignore
         * @namespace baidu.browser 判断浏览器类型和特性的属性。
         */
        baidu.browser = baidu.browser || {};

        if (/msie (\d+\.\d)/i.test(navigator.userAgent)) {
            //IE 8下，以documentMode为准
            /**
             * 判断是否为ie浏览器
             * @property ie ie版本号
             * @grammar baidu.browser.ie
             * @meta standard
             * @shortcut ie
             * @see baidu.browser.firefox,baidu.browser.safari,baidu.browser.opera,baidu.browser.chrome,baidu.browser.maxthon 
             */
            baidu.browser.ie = baidu.ie = document.documentMode || + RegExp['\x241'];
        }

        /**
         * 提供给setAttr与getAttr方法作名称转换使用
         * ie6,7下class要转换成className
         * @meta standard
         */

        baidu.dom._NAME_ATTRS = (function () {
            var result = {
                'cellpadding': 'cellPadding',
                'cellspacing': 'cellSpacing',
                'colspan': 'colSpan',
                'rowspan': 'rowSpan',
                'valign': 'vAlign',
                'usemap': 'useMap',
                'frameborder': 'frameBorder'
            };
            
            if (baidu.browser.ie < 8) {
                result['for'] = 'htmlFor';
                result['class'] = 'className';
            } else {
                result['htmlFor'] = 'for';
                result['className'] = 'class';
            }
            
            return result;
        })();

        /**
         * 获取目标元素的属性值
         * @name baidu.dom.getAttr
         * @function
         * @grammar baidu.dom.getAttr(element, key)
         * @param {HTMLElement|string} element 目标元素或目标元素的id
         * @param {string} key 要获取的attribute键名
         * @shortcut getAttr
         * @meta standard
         * @see baidu.dom.setAttr,baidu.dom.setAttrs
         *             
         * @returns {string|null} 目标元素的attribute值，获取不到时返回null
         */
        baidu.getAttr = baidu.dom.getAttr = function (element, key) {
            element = baidu.dom.g(element);

            if ('style' == key){
                return element.style.cssText;
            }

            key = baidu.dom._NAME_ATTRS[key] || key;
            return element.getAttribute(key);
        };

        /**
         * @ignore
         * @namespace baidu.event 屏蔽浏览器差异性的事件封装。
         * @property target     事件的触发元素
         * @property pageX      鼠标事件的鼠标x坐标
         * @property pageY      鼠标事件的鼠标y坐标
         * @property keyCode    键盘事件的键值
         */
        baidu.event = baidu.event || {};

        /**
         * 事件监听器的存储表
         * @private
         * @meta standard
         */
        baidu.event._listeners = baidu.event._listeners || [];

        /**
         * 为目标元素添加事件监听器
         * @name baidu.event.on
         * @function
         * @grammar baidu.event.on(element, type, listener)
         * @param {HTMLElement|string|window} element 目标元素或目标元素id
         * @param {string} type 事件类型
         * @param {Function} listener 需要添加的监听器
         * @remark
         *  1. 不支持跨浏览器的鼠标滚轮事件监听器添加<br>
         *  2. 改方法不为监听器灌入事件对象，以防止跨iframe事件挂载的事件对象获取失败            
         * @shortcut on
         * @meta standard
         * @see baidu.event.un
         *             
         * @returns {HTMLElement|window} 目标元素
         */
        baidu.on = baidu.event.on = function (element, type, listener) {
            type = type.replace(/^on/i, '');
            element = baidu.g(element);
            var realListener = function (ev) {
                // 1. 这里不支持EventArgument,  原因是跨frame的事件挂载
                // 2. element是为了修正this
                listener.call(element, ev);
            },
            lis = baidu.event._listeners,
            filter = baidu.event._eventFilter,
            afterFilter,
            realType = type;
            type = type.toLowerCase();
            // filter过滤
            if(filter && filter[type]){
                afterFilter = filter[type](element, type, realListener);
                realType = afterFilter.type;
                realListener = afterFilter.listener;
            }
            // 事件监听器挂载
            if (element.addEventListener) {
                element.addEventListener(realType, realListener, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + realType, realListener);
            }
          
            // 将监听器存储到数组中
            lis[lis.length] = [element, type, listener, realListener, realType];
            return element;
        };
    })();

    /**
     * 常量，国家级别区域的类型代号，
     * 用于cityclick派发的事件中，返回的citytype字段的识别
     * @static
     */
    BMapLib.COUNTRY_TYPE_CODE = 0;

    /**
     * 常量，省级别区域的类型代号，
     * 用于cityclick派发的事件中，返回的citytype字段的识别
     * @static
     */
    BMapLib.PROVINCE_TYPE_CODE = 1;

    /**
     * 常量，城市级别区域的类型代号，
     * 用于cityclick派发的事件中，返回的citytype字段的识别
     * @static
     */
    BMapLib.CITY_TYPE_CODE = 2;

    /** 
     * @exports CityList as BMapLib.CityList 
     */
    var CityList =
        /**
         * CityList类的构造函数
         * @class 城市列表类，
         * 实例化该类后，可以帮助用户直接生成城市列表，
         * 也可以通过接口获取城市数据。
         * 
         * @constructor
         * @param {Json Object} opts 可选的输入参数，非必填项。可输入选项包括：<br />
         * {"<b>container</b>" : {String|HTMLElement} 需要提供界面方式展现的容器。如果此参数为空，则不提供界面方式，也没有cityclick的事件派发
         * <br />"<b>map</b>" : {BMap} 实例化的map对象，如果传入此参数，则用户点击界面中的城市时，可以直接帮助用户定位到地图的相关城市位置}
         *
         * @example <b>参考示例：</b><br />
         * var myCityListObject = new BMapLib.CityList({container : "container"});
         */
        BMapLib.CityList = function(opts){

            opts = opts || {};
            /**
             * _opts是默认参数赋值。
             * 下面通过用户输入的opts，对默认参数赋值
             * @private
             * @type {Json}
             */
            this._opts = baidu.extend(
                baidu.extend(this._opts || {}, {

                    /**
                     * 提供界面方式展现的容器
                     * @private
                     * @type {String|HTMLElement}
                     */
                    container : null,

                    /**
                     * 实例化的BMap对象
                     * @private
                     * @type {BMap}
                     */
                     map : null
                })
            , opts);

            /**
             * 城市数据的存储
             * @private
             * @type {Json}
             */
             this._data = null;

             /**
              * 页面模式需要的CSS样式
              * @private
              * @type {Array}
              */
             this._css = [
                    ".bmaplib_cityList{color:#333;font:12px arial,sans-serif;padding-left:10px;}",
                    ".bmaplib_cityList h4{font-size:12px;font-weight:normal;margin:0;}",
                    ".bmaplib_cityList hr{height:1px;border-top:solid 1px #ccc; border-bottom:none;}",
                    ".bmaplib_cityList form,.bmaplib_cityList dl{margin:0;}",
                    ".bmaplib_cityList dd,.bmaplib_cityList h4,.bmaplib_cityList dt{padding: 2px 0; vertical-align: top;line-height: 150%;}",
                    ".bmaplib_cityList dt{float:left;width:52px;}",
                    ".bmaplib_cityList dd{margin-left:52px;}",
                    ".bmaplib_cityList a{color:#0000CC;text-decoration:underline;outline:none;margin-right: 8px;}",
                    ".bmaplib_cityList dt a{margin-right:0;}",
                    ".bmaplib_cityListDescript{color:#999;}",
                    ".bmaplib_cityList .black{color:#000;}",
                    ".bmaplib_cityList form span{color:red;}"];

             // 发出数据请求
             this._getDataFromMapServer();
        }
    
    // 通过baidu.lang下的inherits方法，让CityList继承baidu.lang.Class
    baidu.lang.inherits(CityList, baidu.lang.Class, "CityList");

     /**
      * 城市数据的索引计数器
      * @private
      * @type {Number}
      */
     var _citylistCount = 1;

     /**
      * 整理后，用户输出接口的数据
      * @private
      * @type {Json}
      */
     var _outputData = null;

    /**
     * 向BMapLibrary请求最新的城市数据
     * @return 无返回值
     */
    CityList.prototype._getDataFromMapServer = function(){
        var me = this;
        scriptRequest("http://api.map.baidu.com/library/CityList/1.2/src/data/CityData.js", function(){
            me._callback();
         });
    };

    /**
     * 城市数据请求的回调函数
     * @return 无返回值
     */
    CityList.prototype._callback = function(){
        if (BMapLib.CityList._cityData) {
            this._data = BMapLib.CityList._cityData;
            BMapLib.CityList._cityData = null;
            // 能够从服务器得到城市数据的时候，生成页面，并绑定相关事件
            _outputData = this._formatCityData(this._data);
            this._renderHtml();
            this._bind();
        }
    };

    /**
     * 生成页面模式的城市列表
     * @return 无返回值
     */
    CityList.prototype._renderHtml = function() {
        if (!this._opts.container ||
            !baidu.g(this._opts.container)) {
                return;
        }
        // 添加CSS样式
        this._execCss();
        
        // 生成页面模式的界面
        var htm = [],
              data = this._data,
              vds = "javascript:void(0)",
              newData = {};

        htm.push("<div class='bmaplib_cityList' id='bmaplib_cityList_" + this.guid + "'><dl>");

        // 直辖市部分
        if (data.municipalities && data.municipalities.length > 0) {
            htm.push("<dt>直辖市：</dt><dd>");
            for (var i = 0, n = data.municipalities.length; i < n; i++) {
                var mu = data.municipalities[i];
                htm.push("<a href='#vd#' code='" + _citylistCount+ "'>" + mu.n + "</a>");
                newData[_citylistCount] = {"g" : mu.g, "t" : BMapLib.CITY_TYPE_CODE, "n" : mu.n};
                _citylistCount ++;
            }
            htm.push("</dd>");
        }

        // 普通省
        for (var i = 0, n = data.provinces.length; i < n; i++) {
            var pv = data.provinces[i];
            htm.push("<dt><a href='#vd#' class='black' code='" + _citylistCount+ "'>" + pv.n + "</a>：</dt><dd>");
            newData[_citylistCount] = {"g" : pv.g, "t" : BMapLib.PROVINCE_TYPE_CODE, "n" : pv.n};
            _citylistCount ++;

            for (var j = 0, m = pv.cities.length; j < m; j++) {
                htm.push("<a href='#vd#' code='" + _citylistCount+ "'>" + pv.cities[j].n + "</a>");
                newData[_citylistCount] = {"g" : pv.cities[j].g, "t" : BMapLib.CITY_TYPE_CODE, "n" : pv.cities[j].n};
                _citylistCount ++;
            }
            htm.push("</dd>");
        }

        // 其他地区
        if (data.other && data.other.length > 0) {
            htm.push("<dt>其他：</dt><dd>");
            for (var i = 0, n = data.other.length; i < n; i++) {
                var oth = data.other[i];
                htm.push("<a href='#vd#' code='" + _citylistCount+ "'>" + oth.n + "</a>");
                newData[_citylistCount] = {"g" : oth.g, "t" : BMapLib.CITY_TYPE_CODE, "n" : oth.n};
                _citylistCount ++;
            }
            htm.push("</dd>");
        }
        
        htm.push("</dl></div>");
        baidu.g(this._opts.container).innerHTML = htm.join("").replace(/#vd#/ig, vds);
        this._data = newData;
    };

    /**
     * 给页面元素添加点击操作
     * @return 无返回值
     */
    CityList.prototype._bind = function() {
        if (!this._opts.container ||
            !baidu.g(this._opts.container) ||
            !baidu.g("bmaplib_cityList_" + this.guid)) {
                return;
        }
        var cl = baidu.g("bmaplib_cityList_" + this.guid);
        var tags = cl.getElementsByTagName("a"),
              me = this;
        for (var i = 0, n = tags.length; i < n; i++) {
            // 需要循环给DOM元素附加事件，所以需要闭包住该过程，防止tg对象始终指向最后一个元素
            (function(){
                var tg = tags[i];
                if (!tg) {
                    return;
                }
                baidu.on(tg, "click", function() {
                    if (!baidu.getAttr(tg, "code")) {
                        return;
                    }

                    /**
                     * 点击城市名时，派发事件的接口
                     * @name CityList#oncityclick
                     * @event
                     * @param {Event Object} e 回调函数会返回event参数，包括以下返回值：
                     * <br />{"<b>name</b> : {String} 点击的区域名称,
                     * <br />"<b>center</b>：{BMap.Point} 点击区域合适显示的中心点位置,
                     * <br />"<b>zoom</b>：{Number} 点击区域合适显示的地图层级,
                     * <br />"<b>citytype</b>：{Number} 该区域的类型(全国0、省1、城市2)，区域的类型代号可见BMaplib下的<a href="BMapLib.html#.COUNTRY_TYPE_CODE">COUNTRY_TYPE_CODE</a>、<a href="BMapLib.html#.PROVINCE_TYPE_CODE">PROVINCE_TYPE_CODE</a>、<a href="BMapLib.html#.CITY_TYPE_CODE">CITY_TYPE_CODE</a>三个常量。}
                     *
                     * @example <b>参考示例：</b><br />
                     * myCityListObject.addEventListener("cityclick", function(e) {  alert(e.name);  });
                     */

                    // 生成名为oncityclick的baidu.lang.Event对象
                    // 并给该event对象添加上name、center、zoom和citytype等属性字段
                    // 然后在此刻，将绑定在oncityclick上事件，全部赋予event参数，然后派发出去
                    var event = new baidu.lang.Event("oncityclick"),
                          code = baidu.getAttr(tg, "code"),
                          json = me._data[code];
                    if (!json) {
                        return;
                    }
                    json = formatJson(json);
                    event.name = json.name;
                    event.center = json.center;
                    event.citytype = json.t;

                    // 如果用户在OPTS参数中有传入map实例
                    // 则帮助用户直接切换地图视野
                    var _zoom = json.zoom;
                    if (me._opts.map) {
                        var _map = me._opts.map;
                        _zoom = getBestLevel(_zoom, _map);
                        _map.centerAndZoom(json.center, _zoom);
                    }
                    event.zoom = _zoom;

                    me.dispatchEvent(event);
                });
            })();
        }
    };

    /**
     * 激活CSS
     * @return 无返回值
     */
    CityList.prototype._execCss = function(){
        // _isStyleRender防止多次加载
        if (!BMapLib.CityList._isStyleRender) {
            var st = null;
            if (baidu.g("_bmaplib_citylist_css")) {
                baidu.g("_bmaplib_citylist_css").parentNode.removeChild(baidu.g("_bmaplib_citylist_css"));
            }
            var st = document.createElement("STYLE");
            st.type = "text/css";
            st.id = "_bmaplib_citylist_css";
            document.body.appendChild(st);
            if (baidu.browser.ie > 0) {
                st.styleSheet.cssText = this._css.join("");  
            } else {
                st.appendChild(document.createTextNode(this._css.join("")));
            }
            BMapLib.CityList._isStyleRender = true;
        }
    };

    /**
     * 整理输入接口的数据
     * @param {Json} cityData 城市数据
     *
     * @return {Json} 整理后的输入数据
     */
    CityList.prototype._formatCityData = function(cityData){
        var _dt = cityData,
              _newDt = {};
        if (_dt.municipalities && _dt.municipalities.length > 0) {
            _newDt.municipalities = [];
            for (var i = 0, n = _dt.municipalities.length; i < n; i++) {
                _newDt.municipalities.push(formatJson(_dt.municipalities[i]));
            }
        }
        if (_dt.provinces && _dt.provinces.length > 0) {
            _newDt.provinces = [];
            for (var i = 0, n = _dt.provinces.length; i < n; i++) {
                _newDt.provinces.push(formatJson(_dt.provinces[i]));
                _newDt.provinces[i].cities = [];
                for (var j = 0, m = _dt.provinces[i].cities.length; j < m; j++) {
                    _newDt.provinces[i].cities.push(formatJson(_dt.provinces[i].cities[j]));
                }
            }
        }
        if (_dt.other && _dt.other.length > 0) {
            _newDt.other = [];
            for (var i = 0, n = _dt.other.length; i < n; i++) {
                _newDt.other.push(formatJson(_dt.other[i]));
            }
        }
        return _newDt;
    };

    /**
     * 返回城市数据
     * @return {Json || false} 如果获取到了城市数据，则返回城市数据；否则返回false
     *
     * @example <b>参考示例：</b><br />
     * myCityListObject.getCityData();
     */
    CityList.prototype.getCityData = function(){
        return (!!_outputData ? _outputData : false); 
    };

    /**
     * 整理后端来的{"n":"北京","g":"116.395645,39.929986|12"}这种数据格式，
     * 让它成为{"name" : "", "zoom" : 12, "center" : BMap.Point}这个可识别数据格式
     * @ignore
     * @param {Json} cityinfo 如{"n":"北京","g":"116.395645,39.929986|12"}的数据
     *
     * @return {Json} 如{"name" : "", "zoom" : 12, "center" : BMap.Point}的数据
     */
    function formatJson(cityinfo) {
        if (!cityinfo || !cityinfo.n || !cityinfo.g) {
            return;
        }
        var newInfo = {};
        newInfo.name = cityinfo.n;
        var dts = cityinfo.g.split("|"),
              dtsPts = dts[0].split(",");
        newInfo.center = new BMap.Point(dtsPts[0], dtsPts[1]);
        var _zoom = parseInt(dts[1], 10);
        newInfo.zoom = _zoom;
        if (!!cityinfo.t) {
            newInfo.t = cityinfo.t;
        }
        return newInfo;
    }

    /**
     * 数据请求函数
     * @ignore
     * @param {String} url 请求脚本url
     * @param {Function} callback 回调函数
     * @param {String} charset 编码
     *
     * @return 无返回值
     */
    function scriptRequest(url, callback, charset){
        var isIe = /msie/i.test(window.navigator.userAgent)
        var scriptId = "_script_bmaplib_citylist_";
        if (baidu.g(scriptId)) {
            var script = baidu.g(scriptId);
        } else {
            if (baidu.g(scriptId)) {
                baidu.g(scriptId).parentNode.removeChild(baidu.g(scriptId));
            }
            var script = document.createElement("script");
            if(charset != null){
                script.charset = charset;
            }
            script.setAttribute("id", scriptId);
            script.setAttribute("type", "text/javascript");
            document.body.appendChild(script);    
        }

        // 加上时间戳
        var t = new Date();
        if (url.indexOf("?") > -1) {
            url += "&t=" + t.getTime()
        } else {
            url += "?t=" + t.getTime()
        }
        var _complete = function(){
            if(!script.readyState || 
                script.readyState == "loaded" || 
                script.readyState == "complete"){
                    if(typeof(callback)=="function"){
                        try{
                            callback();
                        } catch (e){ };
                    } else {
                        eval(callback);
                    }
            }
        }
        if (isIe) {
            script.onreadystatechange = _complete;
        } else {
            script.onload = _complete;
        }
        script.setAttribute("src", url);
    }

    /*
     * 根据地图当前大小计算适合的level，输入的level为后端根据固定大小确定的层级
     * @ignore
     * @param {Number} 后端提供的level
     * @param {Map} map实例
     *
     * @return {Number} level 计算后的最佳地图层级
     */
    function getBestLevel(level, map){
        if (map) {
            var sz = map.getSize();
            var ratio = Math.min(sz.width / 1100, sz.height / 660);     // 取长宽比例最小的数值
            level = Math.round(level + (Math.log(ratio) / Math.log(2)));  // 也可用Math.floor策略
        }
        if (level < 1) {
            level = 1;
        }
        if (level > 18) {
            level = 18;
        }
        return level;
    }
})();