(function ($) {
    // Constants
    const idGradientLegend = "linearGradient-legend-candlestick-chart-c3";

    // defaultValues
    var defaults = {
        chart: null, // Mandatory
        colorCloseGreaterThanOpen: "green",
        colorCloseLessThanOpen: "red",
        candlestickLegendName: "Candlestick"
    };

    // Private functions
    function createSVG(colorUp, colorDown) {
        const idSvg = "svg-candlestick-chart-c3";
        const idGradientLines = "linearGradient-lines-candlestick-chart-c3"; 
    
        let svg = $("#" + idSvg);
        if (svg.length === 0) {
            let svg = $(document.createElementNS("http://www.w3.org/2000/svg", "svg")).attr({
                id: idSvg,
                style: "height: 0px"
            }).prependTo("body");
    
            let defs = $(document.createElementNS("http://www.w3.org/2000/svg", "defs")).prependTo(svg);
    
            let linearGradient1 = $(document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")).attr("id", idGradientLines).appendTo(defs);
    
            $(document.createElementNS("http://www.w3.org/2000/svg", "stop")).attr({
                style: "stop-color:rgb(0,0,0);stop-opacity:0",
                offset: "49%"
            }).appendTo(linearGradient1);
    
            $(document.createElementNS("http://www.w3.org/2000/svg", "stop")).attr({
                style: "stop-color:rgb(0,0,0);stop-opacity:1",
                offset: "50%"
            }).appendTo(linearGradient1);
    
            $(document.createElementNS("http://www.w3.org/2000/svg", "stop")).attr({
                style: "stop-color:rgb(0,0,0);stop-opacity:0",
                offset: "51%"
            }).appendTo(linearGradient1);
    
            let linearGradient2 = $(document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")).attr("id", idGradientLegend).appendTo(defs);
    
            $(document.createElementNS("http://www.w3.org/2000/svg", "stop")).attr({
                style: "stop-color: " + colorUp,
                offset: "50%"
            }).appendTo(linearGradient2);
    
            $(document.createElementNS("http://www.w3.org/2000/svg", "stop")).attr({
                style: "stop-color: " + colorDown,
                offset: "50%"
            }).appendTo(linearGradient2);
        }
    }
    
    function bugSvgGradientColorInLine(selector) {
        let selectorLine = $(selector + " g.c3-legend-item-low line.c3-legend-item-tile");
        let y1 = selectorLine.attr("y1");
        let y2 = selectorLine.attr("y2");
    
        if (y1 === y2) {
            selectorLine.attr("y2", parseInt(y2) + 0.01);
        }
    }
    
    function chartToChartWithCandlestick(chart, data, dic, colorUp, colorDown, candlestickName, min) {
        var candlestickChart = {
            data: {
                json: data,
                names: {
                    low: candlestickName
                },
                order: null,
                colors: {
                    low: "url(#" + idGradientLegend + ")",
                    open: colorUp,
                    close: colorUp,
                    high: colorUp
                },
                color: function (color, d) {
                    return candlestickColorFunction(color, colorDown, d, dic);
                },
                types: {
                    low: 'bar',
                    open: 'bar',
                    close: 'bar',
                    high: 'bar'
                },
            },
            axis: {
                x: {
                    tick: {
                        count: null
                    }
                },
                y: {
                    min: min
                }
            },
            legend: {
                item: {
                    onclick: onClickItemLegendFunction,
                    onmouseover: onMouseOverLegendFunction,
                }
            },
            tooltip: {
                format: {
                    name: nameFormatTooltip
                },
                contents: contentsTooltipFunction
            }
        };
    
        chart = $.extend(true, {}, chart, candlestickChart);
    
        chart.data.keys.value = chart.data.keys.value == null ? [] : chart.data.keys.value;
        chart.data.keys.value = chart.data.keys.value.concat(["low", "open", "close", "high"]);
    
        chart.data.groups = chart.data.groups == null ? [] : chart.data.groups;
        chart.data.groups.push(["low", "open", "close", "high"]);
    
        chart.legend.hide = chart.legend.hide == null ? [] : chart.legend.hide;
        chart.legend.hide = chart.legend.hide.concat(["open", "close", "high"]);
    
        return chart;
    }
    
    function toStackedData(realData, xAxisName, typeXAxis) {
        let data = [], dic = {}, min = Number.MAX_SAFE_INTEGER;
        realData.forEach(function (element) {
            let x = element[xAxisName];
            if (typeXAxis === "timeseries")
                x = new Date(element[xAxisName].replace("T", " "));
            dic[x] = element;
    
            let low = element.low;
            let oc = element.open - low;
            let co = element.close - low;
            let open = element.open <= element.close ? oc : co;
            let close = (element.open <= element.close ? element.close : element.open) - (low + open);
            let high = element.high - (low + open + close);
    
            let e = $.extend({}, element);
            e.low = low;
            e.open = open;
            e.close = close;
            e.high = high;
    
            data.push(e);
    
            min = getMinFromObject(element, min, xAxisName);
        });
    
        return { data, dic, min };
    }
    
    function getMinFromObject(element, min, xAxisName) {
        let min2 = min;
        for (var nameProperty in element) {
            if (nameProperty !== xAxisName) {
                let v = element[nameProperty];
                min2 = (v < min2) ? v : min2;
            }
        }
    
        return min2;
    }
    
    function candlestickColorFunction(colorUp, colorDown, d, dic) {
        if (d.id === "low") {
            return "transparent";
        }
        else if (d.id === "close" && dic[d.x] != null) {
            return dic[d.x]["open"] <= dic[d.x][d.id] ? colorUp : colorDown;
        }
    
        return colorUp;
    }

    // Events
    var refreshIntervalId;
    function onClickItemLegendFunction(id) {
        var chart = $(this)[0];
        if (id === "low") {
            chart.api.toggle(["low", "open", "high", "close"]);
        } else {
            chart.api.toggle(id);
        }

        refreshIntervalId = setInterval(function () {
            bugSvgGradientColorInLine(chart.config.bindto);
            clearInterval(refreshIntervalId);
        }, 250);
    }

    function onMouseOverLegendFunction(id) {
        let chart = $(this)[0];
        if (id === "low") {
            chart.api.focus(["low", "open", "high", "close"]);
        } else {
            chart.api.focus(id);
        }
    }

    function nameFormatTooltip(name, ratio, id, index) {
        return id === "low" ? id : name;
    }

    function contentsTooltipFunction(d, defaultTitleFormat, defaultValueFormat, color) {
        let chart = $(this)[0];
        let selector = chart.config.bindto;
        let dic = $(selector).data("dic");
        let colorUp = $(selector).data("colorUp");
        let colorDown = $(selector).data("colorDown");

        let defaultValueFormat2 = function (v, ratio, id) {
            let v2 = v;
            if ((id === "low" || id === "open" || id === "close" || id === "high") && dic[d[0].x] != null) {
                v2 = dic[d[0].x][id];
            }

            return defaultValueFormat(v2, ratio, id)
        }

        let color2 = function (id) {
            if ((id === "low" || id === "open" || id === "close" || id === "high") && dic[d[0].x] != null) {
                return dic[d[0].x]["open"] <= dic[d[0].x]["close"] ? colorUp : colorDown;
            } else {
                return color(id);
            }
        };

        return this.getTooltipContent(d, defaultTitleFormat, defaultValueFormat2, color2);
    }

    // Public functions
    var methods = {
        init: function (options) {
            var settings = $.extend(true, {}, defaults, options);
            
            if (settings.chart == null)
                console.error("Definition of c3js chart doesn't exist.");

            let id = this.attr("id");
            if (id == null)
                console.error("Id in element is mandatory.");

            this.addClass("candlestick-chart-c3");

            createSVG(settings.colorCloseGreaterThanOpen, settings.colorCloseLessThanOpen);

            let selector = "#" + id;
            let realData = settings.chart.data.json;
            let xAxisName = settings.chart.data.keys.x;
            let typeXAxis = settings.chart.axis && settings.chart.axis.x && settings.chart.axis.x.type;
        
            let stackedData = toStackedData(realData, xAxisName, typeXAxis);
        
            $(selector).data("dic", stackedData.dic);
            $(selector).data("colorUp", settings.colorCloseGreaterThanOpen);
            $(selector).data("colorDown", settings.colorCloseLessThanOpen);
        
            let chartWithCandlestick = chartToChartWithCandlestick(
                settings.chart, 
                stackedData.data, 
                stackedData.dic, 
                settings.colorCloseGreaterThanOpen, 
                settings.colorCloseLessThanOpen, 
                settings.candlestickName, 
                stackedData.min);
        
            c3.generate(chartWithCandlestick);
        
            bugSvgGradientColorInLine(selector);
        }
    };

    // Extension method
    $.fn.candlestickChart = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === "object" || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error("The method '" + method + "' doesn't exist in candlestickChart.");
        }
    };
}(jQuery));
