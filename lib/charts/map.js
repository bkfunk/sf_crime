function multiMap() {
  var margin = { top: 10, right: 10, bottom: 10, left: 10 },
      plotWidth = 550,
      plotHeight = 500,
      width, height;
  
  var projection,
      path,
      colorScale,
      quantScale,
      svg,
      mapContainer,
      main,
      legend, legendHeader, legendBody, legendAxisg,
      features,
      dataIn,
      tracts,
      featureListeners = { },
      mapCreated = false;
      
  //var colorPalette = colorbrewer.Greens[9]; // array of colors
  var nColors = 9;
      /*colorPalette = {
        plotted: "Greens",
        unplotted: "Blues"
      };*/
      
  var featureArray = function(data) {
    return data.index.map(function(d) {
      return data[d];
    });
  };
  
  /*
  var borderArray = function(data) {
    return data.index.map(function(d) {
      if (typeof data[d].border === "undefined") return null;
      return { type: "MultiLineString",
                coordinates: [data[d].border] };
    }).filter(function(d) {
        return (d) ? true : false;
    }); // remove empty borders
  };*/
  
  var field = function() { return "hh_size"; };
  var value = function(d) {
    if (typeof d.data === "undefined") return null;
    return (d.data.hasOwnProperty(field())) ? +d.data[field()] : null;
  };
  var idValue = function(d) {
    return d.id;
  }
  
  function map(selection) {
    
    
    selection.each(function(dataset) {
      
      map.updateData(dataset);
      //console.log(features);
      d3.select(this).selectAll("svg")
        .data([features]).enter()
          .call(createMap);
      map.updateMap();
    });
  }
  
  function createMap(selection) {
    projection = d3.geo.mercator()
                        .center([-122.4391, 37.7631]);
    //colorScale = d3.scale.quantize();
    quantScale = d3.scale.quantize();
    
    path = d3.geo.path();
    
    svg = selection.append("svg").attr("class", "main-svg");
    // Create hatch pattern for uncolored tracts
    svg.append("defs")
        .append("pattern")
          .attr("id", "diagonalHatch")
          .attr("patternUnits", "userSpaceOnUse")
          .attr("width", 4)
          .attr("height", 4)
        .append("rect")
          .attr("class", "hatchRect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", 4)
          .attr("height", 4);
    svg.select("#diagonalHatch").append("path")
          .attr("class", "hatchPath")
          .attr("d", 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2');
          
    
    mapContainer = svg.append("g").attr("class", "mapContainer");
    main = mapContainer.append("g").attr("class", "main");
    legend = mapContainer.append("g").attr("class", "legend");
    legendHeader = legend.append("g").attr("class", "legend-header");
    legendBody = legend.append("g").attr("class", "legend-body");
    legendAxisg = legendBody.append("g").attr("class", "axis legend-axis");
    
    legendHeader.append("text").attr("class", "header-label")
      .text("Plotted");
    legendHeader.append("text").attr("class", "header-label")
      .text("Off Plot");
      
    
    mapCreated = true;
  }
  map.updateData = function(dataset) { 
    if (arguments.length) dataIn = dataset;
    
    features = featureArray(dataIn);
    //console.log("Data", features.map(value));
    
    return map;
  };
  
  map.updateMap = function() {
    width = plotWidth - margin.left - margin.right;
    height = plotHeight - margin.top - margin.bottom;
    var mapWidth = height; // square map; remainder goes to legend
    var mapHeight = height;
    
    projection.translate([mapWidth/2, mapHeight/2])
                        .scale(310 * mapWidth);
    //colorScale.range(colorPalette);
    quantScale.range(d3.range(nColors));
    //colorScale.domain(d3.extent(features.map(value)));
    quantScale.domain(d3.extent(features.map(value)));
    
    path.projection(projection);
    
    svg.attr("width", plotWidth)
        .attr("height", plotHeight);
        //.classed(colorPalette.plotted, true);
    main.attr("transform", _do("translate", margin.left, margin.top));
    legend.attr("transform", _do("translate", margin.left + mapWidth,
                                 margin.top));
    map.updateLegend();
    
    tracts = main.selectAll(".tract")
            .data(features, idValue);
    map.enterTracts(tracts.enter());
    map.updateTracts();
    map.exitTracts(tracts.exit());
    
    //console.log(tracts);
    map.updateFeatures();
  };
  map.enterTracts = function(newTracts) {
    newTracts.append("path")
      
  };
  map.updateTracts = function() {
    tracts.attr("class", function(d) {
            var tractClass = "tract tract-" + idValue(d) +
               " q" +
                      ((typeof value(d) !== "undefined" &&
                        value(d) !== null)
                       ? quantScale(value(d)) + "-" + nColors
                       : "NA");
            return tractClass;
          })
          .attr("d", path)
          
          /*.style("fill", function(d, i) {
              //console.log("fill", d, i);
              if (!value(d)) return "#666";
              return colorScale(value(d));
            })*/;
  };
  map.exitTracts = function(deadTracts) {
    deadTracts.remove();
  };
  
  
  map.updateLegend = function() {
    var legendWidth = width - height;
    var legendHeight = height;
    
    
    var legendColumns = ["plotted", "unplotted"];
    
    var boxWidthProp = .6; // proportion of width that goes to boxes
    var bodyHeightProp = .8;
    var boxWidth = legendWidth * boxWidthProp / legendColumns.length;
    var boxHeight = bodyHeightProp * legendHeight / nColors;
    
    var legendAxis = d3.svg.axis().orient("right");
    legendScale = d3.scale.linear();
    legendScale.range([0, bodyHeightProp * legendHeight]);
    var legendTicks = d3.range(nColors)
                        .concat([nColors-1])
                        .map(function(d, i) {
                          console.log(arguments);
                          return quantScale.invertExtent(d)[i-d];
                        });
    legendScale.domain(d3.extent(legendTicks));
                       
                       /*foo.map(function(d, i) {
      console.log(arguments);
      return quantScale.invertExtent(d)[i-d];
    }));*/
    console.log("Legend scale:", legendScale.range(), legendScale.domain());
    legendAxis.scale(legendScale)
      .tickValues(legendTicks);
    console.log(legendAxis.tickValues());
    
    
    legendBody.attr("transform",
                        _do("translate", 0,
                            legendHeight * (1 - bodyHeightProp)));
    legendAxisg.attr("transform",
                     _do("translate", legendColumns.length * boxWidth, 0));
    legendAxisg.call(legendAxis);
    
    legendHeader.selectAll(".header-label")
      .attr("transform", function(data, i) {
        return _do("translate", (i + .5) * boxWidth,
                   legendHeight * (1 - bodyHeightProp) - margin.top) +
              _do("rotate", -90);
      });
      
    
    var legendGroups = legendBody.selectAll(".legend-group")
      .data(quantScale.range(), function(d) { return d; });
      
    legendGroups.enter()
          .append("g")
          .attr("class", "legend-group")
          .attr("transform", function(d) {
             return _do("translate", 0, (d  * boxHeight));
          });
    legendGroups.exit()
      .remove();
          
    legendBoxes = legendGroups.selectAll(".legend-box")
        .data(legendColumns)
        .enter().append("rect")
          .attr("class", function(d) {
            return "legend-box " + d;
          });
    
    legendBoxes.attr("x", function(d, i, p) {
                  //console.log(arguments);
                  //console.log(d3.select(this).data());
                  return (i * boxWidth);
                })
                .attr("y", function(d, i, p) {
                  return 0; //(p / nColors) * legendHeight;
                })
                .attr("width", boxWidth)
                .attr("height", boxHeight)
                .attr("class", function(d, i, p) {
                  return d + " legend-box q" + p + "-" + nColors; 
                });
    /*
    legendGroups.selectAll(".label")
        .data(function(i) {
          return (i == quantScale.range().length - 1) ? [i, i+1] : [i];
        })
        .enter()
          .append("text")
          .attr("class", "label");
    
    var legendFormat = d3.format("< .4g");
    legendGroups.selectAll(".label")
        .attr("transform", function(d, i, p) {
            return _do("translate",
              legendColumns.length * boxWidth * 1.1,
              i * boxHeight)
            })
        .text(function(d, i, p) {
          console.log("Labels:", arguments);
          //console.log(quantScale.invertExtent(p));
          return legendFormat(quantScale.invertExtent(p)[i]);
        });
    */
    legendGroups.selectAll(".label-tick")
        .data(function(i) {
          return (i == quantScale.range().length - 1) ? [i, i+1] : [i];
        })
        .enter()
          .append("line")
          .attr("class", "label-tick");
          
    legendGroups.selectAll(".label-tick")
      .attr("x1", 0)
      .attr("x2", legendColumns.length * boxWidth * 1.05)
      .attr("y1", function(d, i, p) {
        //console.log("Label ticks:", arguments, this);
        return i * boxHeight;
      })
      .attr("y2", function(d, i, p) {
        //console.log("Label ticks:", arguments, this);
        return i * boxHeight;
      });
    
    
  };
  
  
  
  /// Create default listeners
  
  map.mouseover = function(d, i) {
    //if (!that) that = this;
    // Move to end of parent node, so that it draws above others
    //console.log("INTERNAL MOUSEOVER");
    this.parentNode.appendChild(this);
  };
  
  map.updateFeatures = function() {
    map.updateFeatureListeners();
  }
  map.updateFeatureListeners = function() {
    //console.log("Tracts: ", mapCreated);
    if (mapCreated) {
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
    }
    
  };
  map.addFeatureListener = function(newType, newListener) {
    featureListeners[newType] = newListener;
    if (mapCreated) map.updateFeatureListeners();
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
  
  map.field = function(_) {
    if (!arguments.length) return field;
    field = _;
    return map;
  };
  
  map.nColors = function(_) {
    if (!arguments.length) return nColors;
    nColors = _;
    map.updateMap();
    return map;
  };
  /*map.colorPalette = function(_) {
    if (!arguments.length) return colorPalette;
    svg.classed(colorPalette, false);
    colorPalette = _;
    svg.classed(colorPalette, true);
    return map;
  }*/
  
  return map;
}