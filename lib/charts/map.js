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
      featureListeners = { }; /*
        "mouseover": function(d, i, that) {
          if (!that) that = this;
          // Move to end of parent node, so that it draws above others
          d3.select(that).classed("selected", true);
        },
        "mouseout": function(d, i, that) {
          if (!that) that = this;
          d3.select(that).classed("selected", false);
        }
      };*/
      
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
      //console.log("Data", features.map(value));//.map(value));
      colorScale.domain(d3.extent(features.map(value)));
      quantScale.domain(d3.extent(features.map(value)));
      
      
      //console.log("map data:", data);
      
      svg = d3.select(this).selectAll("svg")
                .data([data])
              .enter()
                .append("svg")
                  .attr("width", plotWidth)
                  .attr("height", plotHeight)
                  .append("g")
                    .attr("transform", _do("translate", margin.left, margin.top));
      //svg.append("path").attr("class", "tract");
      
      //console.log(featureArray(data));
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
    });
  }
  /// Create default listeners
  
  map.mouseover = function(d, i) {
    //if (!that) that = this;
    // Move to end of parent node, so that it draws above others
    console.log("INTERNAL MOUSEOVER");
    this.parentNode.appendChild(this);
  };
  
  map.updateFeatures = function() {
    map.updateFeatureListeners();
  }
  map.updateFeatureListeners = function() {
    for (type in featureListeners) {
      (function() { // need this function to create a closure for each type
        var ext= featureListeners[type];
        if (map.hasOwnProperty(type)) {
          var own = map[type];
          tracts.on(type, function(d, i) {
            //console.log("Has internal", own);
            //console.log("external", ext);
            own.call(this, d, i);
            ext.call(this, d, i);
          });
        } else {
          tracts.on(type, function(d, i) {
            //console.log("external", ext);
            ext.call(this, d, i);
          });
        }
      })();
    }
  };
  map.addFeatureListener = function(newType, newListener) {
    featureListeners[newType] = newListener;
    map.updateFeatureListeners();
    return map;
  };
  map.triggerFeatureListener = function(type, d, i, ftr) {
    if (map.hasOwnProperty(type)) {
      var f = map[type];
      f.call(ftr, d, i);
    }
    if (featureListeners.hasOwnProperty(type)) {  
      var f = featureListeners[type];//
      f.call(ftr, d, i);
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