/*function clockwise(points) {
  var sorted = points.sort(function(a, b) {
    // If sort descending on [1], but if equal, sort ascending on [0]
    return (a[1] != b[1]) ? b[1] - a[1] : a[0] - b[0];
  });
  
  var slope = function(p, q) {
    return (q[0] - p[0])/(q[1] - p[1]);
  };
  var distance = function(p, q) {
    return Math.sqrt(Math.pow(q[0] - p[0], 2) + Math.pow(q[1] - p[1], 2));
  }
  
  var top = sorted.shift();
  
  var distanceSort = function(a, b) {
    console.log(arguments);
    var da = distance(top, a);
    var db = distance(top, b)
    return da - db;
  };
  sorted.sort(function(a, b) {
    var ma = slope(top, a);
    var mb = slope(top, b);
    if (ma == mb) return distanceSort(a, b);
    if (ma < 0 && mb >= 0 || ma >= 0 && mb < 0) return ma - mb;
    return mb - ma;
  });
  
  sorted.unshift(top);
  var result = sorted;
  return result;
}*/
function multiMap() {
  var margin = { top: 10, right: 10, bottom: 10, left: 10 },
      plotWidth = 300,
      plotHeight = 300;
  
  var projection,
      path,
      colorScale,
      svg,
      features,
      tracts,
      featureListeners = {
        "mouseover": function(d, i, that) {
          if (!that) that = this;
          // Move to end of parent node, so that it draws above others
          that.parentNode.appendChild(that)
          d3.select(that).classed("selected", true);
        },
        "mouseout": function(d, i, that) {
          if (!that) that = this;
          d3.select(that).classed("selected", false);
        }
      };
      
  var colorPalette = colorbrewer.Greens[9]; // array of colors 
      
  var featureArray = function(data) {
    return data.index.map(function(d) {
      return data[d];
    })
  };
  var borderArray = function(data) {
    return data.index.map(function(d) {
      if (typeof data[d].border === "undefined") return null;
      return { type: "MultiLineString",
                coordinates: [data[d].border] };
    }).filter(function(d) {
        return (d) ? true : false;
    }); // remove empty borders
  };
  var field = function() { return "hh_size"; };
  var value = function(d) {
    if (typeof d.data === "undefined") return null;
    return (d.data.hasOwnProperty(field())) ? +d.data[field()] : null;
  };
  var idValue = function(d) {
    return d.id;
  }
  
  function map(selection) {
    projection = d3.geo.mercator()
                        .translate([plotWidth/2, plotHeight/2])
                        .center([-122.4391, 37.7631])
                        .scale(310 * plotWidth);
    colorScale = d3.scale.quantize()
                      .range(colorPalette);
    quantScale = d3.scale.quantize()
                      .range(d3.range(colorPalette.length));
    
    path = d3.geo.path().projection(projection);
    
    selection.each(function(data) {
      features = featureArray(data);
      console.log("Data", features.map(value));//.map(value));
      colorScale.domain(d3.extent(features.map(value)));
      quantScale.domain(d3.extent(features.map(value)));
      
      
      console.log("map data:", data);
      
      svg = d3.select(this).selectAll("svg")
                .data([data])
              .enter()
                .append("svg")
                  .attr("width", plotWidth)
                  .attr("height", plotHeight)
                  .append("g")
                    .attr("transform", _do("translate", margin.left, margin.top));
      //svg.append("path").attr("class", "tract");
      
      console.log(featureArray(data));
      tracts = svg.selectAll(".tract")
            .data(featureArray)
          .enter()
            .append("path")
            .attr("class", function(d) {
              return "tract" +
                      " tract-" + idValue(d) +
                      " color-" +
                      ((d) ? quantScale(value(d)) : "NA");
            })
            .attr("d", path)
            .style("fill", function(d, i) {
              //console.log("fill", d, i);
              if (!value(d)) return "#666";
              return colorScale(value(d));
            });
            //.style("stroke", "blue");
      
      map.updateFeatures();
      
      /*
      var grad = svg.append("svg:defs")
          .append("svg:linearGradient")
            .attr("id", "grad")
            ;
      grad.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "yellow")
        ;
      grad.append("svg:stop")
        .attr("offset", "10%")
        .attr("stop-color", "red")
        ;
      grad.append("svg:stop")
        .attr("offset", "12%")
        .attr("stop-color", "red")
        ;
      
      grad.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "blue")
        ;
      /*
      grad.append("svg:stop")
        .attr("offset", "30%")
        .attr("stop-color", "green")
        ;
      grad.append("svg:stop")
        .attr("offset", "40%")
        .attr("stop-color", "blue")
        ;*/
      /*      
      svg.selectAll(".tract-border")
            .data(borderArray(data))
          .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "tract-border")
            .style({"fill": "none",
                   "stroke": "blue"});
            ///function(d, i) { console.log(i, ":", d);
                  //return "M0,0L1,1L2,3Z";});*/
    });
  }
  /// Create default listeners
  
  map.updateFeatures = function() {
    map.updateFeatureListeners();
  }
  map.updateFeatureListeners = function() {
    for (type in featureListeners) {
      tracts.on(type, featureListeners[type]);
    }
  };
  map.addFeatureListener = function(newType, newListener) {
    featureListeners[newType] = newListener;
    map.updateFeatureListeners();
    return map;
  };
  map.triggerFeatureListener = function(type, d, i, ftr) {
    console.log(arguments);
    //console.log("This:", this);
    if (featureListeners.hasOwnProperty(type)) {  
      var f = featureListeners[type];//
      f(d, i, ftr);
    }
    return arguments;
  }
  
  map.svg = function() {
    return svg;
  };
  map.borderArray = function() {
    return borderArray;
  };
  map.path = function() {
    return path;
  };
  return map;
}