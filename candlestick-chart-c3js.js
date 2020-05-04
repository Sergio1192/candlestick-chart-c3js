// https://jsfiddle.net/Sergio11/wcztb3vy/

let realData = [];
for(let i = new Date('2018/01/01'); i < new Date('2018/02/01'); i.setDate(i.getDate() + 1)) {
    let date = `${i.getFullYear()}-${i.getMonth()+1}-${i.getDate()}T00:00:00`;
    let data = { 
        x: date, low:49.1, open:50, close:55, high:55.9, serieOne:61, serieTwo:59, serieThree: 58 
    };
    realData.push(data);
}

var chart = {
    bindto: '#chart',
    data: {
    json: realData,
    xFormat: '%Y-%m-%dT%H:%M:%S',
    keys: {
        x: "x",
        value: [
        "serieOne",
        "serieTwo",
        "serieThree"
        ]
    },
    type: 'line',
    colors: {
        serieOne: "green",
        serieTwo: "yellow",
        serieThree: "red"
    },
    names: {
        serieOne: '1',
        serieTwo: '2',
        serieThree: '3'
    }
    },
    axis: {
    x: {
        type: 'timeseries',
        tick: {
        format: "%d-%m-%Y"
        }
    }
    },
    zoom: {
    enabled: true,
    rescale: true
    },
    subchart: {
    show: true,
    size: {
        height: 10
    }
    },
    grid: {
    y: {
        show: true
    }
    }
};
                    
candlestickChart(chart, "blue", "red", "Candlestick");


// Main Candlestick function
function candlestickChart (chart, colorUp, colorDown, candlestickName) {
    let realData = chart.data.json;
    let selector = chart.bindto;
    let xAxisName = chart.data.keys.x;	
    let typeXAxis = chart.axis && chart.axis.x && chart.axis.x.type;
    
    let stackedData = toStackedData(realData, xAxisName, typeXAxis);
    let data = stackedData.data, dic = stackedData.dic, min = stackedData.min;
    
    $("#candlestickUp").attr("stop-color", colorUp);
    $("#candlestickDown").attr("stop-color", colorDown);
    
    $(selector).data("dic", dic);
    $(selector).data("colorUp", colorUp);
    $(selector).data("colorDown", colorDown);
    
    let chartWithCandlestick = chartToChartWithCandlestick(chart, data, dic, colorUp, colorDown, candlestickName, min);

    c3.generate(chartWithCandlestick);
    
    bugSvgGradientColorInLine(selector);
}

// "private" functions
function bugSvgGradientColorInLine (selector) {
    let selectorLine = $(selector + " g.c3-legend-item-low line.c3-legend-item-tile");
    let y1 = selectorLine.attr("y1");
    let y2 = selectorLine.attr("y2");
    
    if (y1 === y2) {
        selectorLine.attr("y2", parseInt(y2) + 0.01);
    }
}

function chartToChartWithCandlestick (chart, data, dic, colorUp, colorDown, candlestickName, min) {
    var candlestickChart = {
    data: {
        json: data,
        names: {
        low: candlestickName
        },
        order: null,
        colors: {
        low: "url(#gradientCandlestickChartC3)",
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

function toStackedData (realData, xAxisName, typeXAxis) {
    let data = [], dic = {}, min = Number.MAX_SAFE_INTEGER;
    realData.forEach(function (element) {
        let x = element[xAxisName];
    if(typeXAxis === "timeseries")
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

function candlestickColorFunction (colorUp, colorDown, d, dic) {
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
function onClickItemLegendFunction (id) {
    var chart = $(this)[0];
    if(id === "low") {
    chart.api.toggle(["low", "open", "high", "close"]);
    } else {
        chart.api.toggle(id);
    }
    
    refreshIntervalId = setInterval(function () {
    bugSvgGradientColorInLine(chart.config.bindto);
    clearInterval(refreshIntervalId);
    }, 250);
}

function onMouseOverLegendFunction (id) {
    let chart = $(this)[0];
    if(id === "low") {
    chart.api.focus(["low", "open", "high", "close"]);
    } else {
    chart.api.focus(id);
    }
}

function nameFormatTooltip (name, ratio, id, index) { 
    return id === "low" ? id : name; 
}
        
function contentsTooltipFunction (d, defaultTitleFormat, defaultValueFormat, color) {
    let chart = $(this)[0];
    let selector = chart.config.bindto;
    let dic = $(selector).data("dic");
    let colorUp = $(selector).data("colorUp");
    let colorDown = $(selector).data("colorDown");
    
    let defaultValueFormat2 = function (v, ratio, id) {
        let v2 = v;
    if((id === "low" || id === "open" || id === "close" || id === "high") && dic[d[0].x] != null) {
        v2 = dic[d[0].x][id];
    }
    
    return defaultValueFormat(v2, ratio, id)
    }
    
    let color2 = function (id) {
    if((id === "low" || id === "open" || id === "close" || id === "high") && dic[d[0].x] != null) {
        return dic[d[0].x]["open"] <= dic[d[0].x]["close"] ? colorUp : colorDown;
    } else {
        return color(id);
    }
    };

    return this.getTooltipContent(d, defaultTitleFormat, defaultValueFormat2, color2);
}