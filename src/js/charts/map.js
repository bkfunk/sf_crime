function multiMap() {
  var margin = { top: 10, right: 10, bottom: 10, left: 10 },
      plotWidth = 500,
      plotHeight = 500,
      legendSize = 50,
      legendOrientation = "horizontal",
      width, height,
      mapWidth, mapHeight;
  
  var projection,
      path, nPath, ePath,
      colorScale,
      quantScale,
      svg,
      mapContainer,
      main, nMain, eMain,
      mapGroup,
      legend, legendHeader, legendBody, legendAxisg,
      features, nFeatures,
      dataIn,
      tracts, neighborhoods, elevation,
      featureListeners = { },
      baseZoom = 318,
      mapCreated = false;
      //series = "incidents";
      
  var zoom;
    
      
  var nColors = 9;
  
  var featureArray = function(data) {
    return data.index.map(function(d) {
      return data[d];
    });
  };
  /*var neighborhoodArray = function(data) {
    return data.
  }*/
  
  var field = function() { return "hh_size"; };
  var value = function(d) {
    if (typeof d.data === "undefined") return null;
    return (d.data.hasOwnProperty(field())) ? +d.data[field()] : null;
  };
  var idValue = function(d) {
    return d.id;
  }
  
  function map(selection) {
    selection.each(function(datasets) {
      
      map.updateData(datasets);
      d3.select(this).selectAll("svg")
        .data([features]).enter()
          .call(createMap);
      map.updateMap();
      addZoom();
    });
  }
  
  function createMap(selection) {
    projection = d3.geo.mercator()
                        .center([-122.4391, 37.7701]);
    quantScale = d3.scale.quantize();
    
    path = d3.geo.path();
    nPath = d3.geo.path();
    ePath = d3.geo.path();
                 
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
          
    // ADD CLIP PATH
    mapContainer = svg.append("g").attr("class", "mapContainer");
    mapGroup = mapContainer.append("g")
    
    mapGroup.append("clipPath")
                        .attr("class", "clip-path")
                        .attr("id",  "map-clip-path")
                      .append("rect");
    
    main = mapGroup.append("g").attr("class", "main").attr("clip-path", "url(#map-clip-path)");
    nMain = mapGroup.append("g").attr("class", "nMain").attr("clip-path", "url(#map-clip-path)");
    eMain = mapGroup.append("g").attr("class", "eMain").attr("clip-path", "url(#map-clip-path)");
    
    legend = mapContainer.append("g").attr("class", "legend");
    legendHeader = legend.append("g").attr("class", "legend-header");
    legendBody = legend.append("g").attr("class", "legend-body");
    legendAxisg = legendBody.append("g").attr("class", "axis legend-axis");
    
    legendHeader.append("text").attr("class", "header-label")
      .text("Plotted");
    legendHeader.append("text").attr("class", "header-label")
      .text("Off Plot");
      
    map.resizeMap();
    mapCreated = true;
  }
  map.updateData = function(datasets) { 
    if (arguments.length) dataIn = datasets;
    
    features = featureArray(dataIn[0]);
    nFeatures = dataIn[1];
    elevation = dataIn[2];
    
    return map;
  };
  
  map.updateMap = function() {
    map.updateData();
    
    // Set scales
    quantScale.range(d3.range(nColors));
    quantScale.domain(d3.extent(features.map(value)));
    
    // Update legend
    map.updateLegend();
    
    // Update tracts
    tracts = main.selectAll(".tract")
            .data(features, idValue);
    map.enterTracts(tracts.enter());
    map.updateTracts();
    map.exitTracts(tracts.exit());
    
    
    // Update feature listeners
    map.updateFeatures();

    neighborhoods = nMain.selectAll(".neighborhood")
            .data(nFeatures.features);
    neighborhoods.enter()
            .append("path")
            .attr("class", "neighborhood");
    neighborhoods.exit().remove();
            
    nMain.selectAll("text")
        .data(nFeatures.features.filter(function(d) { return typeof d.id !== "undefined"; }))
      .enter().append("text");
        
    
    var nLines = nFeatures.features.filter(function(d) {
        if (typeof d.label === "undefined" ) return false;
        else return typeof d.label.line !== "undefined" &&
                      d.label.line;
      });
    
    nMain.selectAll("line")
        .data(nLines)
      .enter().append("line");
 
    nMain.selectAll("text").selectAll("tspan")
        .data(function(d) { return d.label.label.split("|"); })
      .enter().append("tspan");
        
    
    map.updateNeighborhoods();
    
    /*
    eScale = d3.scale.quantize().range(d3.range(nColors))
                  .domain(d3.extent(elevation.features.map(function(d) { return Math.round(d.id / 100); })));
    ePath.projection(projection);
    eMain.selectAll("path")
      .data(elevation.features)
      .enter().append("path")
        .style("fill", "none")
        .style("opacity", .8)
        .attr("class", function(d, i) {
          var e = Math.round(d.id / 100);
          return "elev q" + eScale(e) + "-" + nColors;
        })
        .attr("d", ePath);*/
    
    return map;
  };
  
  function addZoom() {
    zoom = d3.behavior.zoom()
                 .on("zoom", zoomed);
    zoom.translate(projection.translate())
                  .scale(projection.scale())
                  .scaleExtent([projection.scale(), 8*projection.scale()]);
    zoom(svg);
  }
  
  
  map.resizeMap = function() {
    width = plotWidth - margin.left - margin.right;
    height = plotHeight - margin.top - margin.bottom;
    mapWidth = (legendOrientation === "horizontal") ? width : width - legendSize; // square map; remainder goes to legend
    mapHeight = (legendOrientation === "vertical") ? height : height - legendSize;
    
    // Set SVG dimensions
    svg.attr("width", plotWidth)
        .attr("height", plotHeight);
    
    // Translate map groups
    //main.attr("transform", _do("translate", margin.left, margin.top));
    //nMain.attr("transform", _do("translate", margin.left, margin.top));
    mapGroup.attr("transform", _do("translate", margin.left, margin.top));
    
    d3.select("#map-clip-path rect").attr("width", mapWidth)
                                    .attr("height", mapHeight);
    // Update legend
    if (legendOrientation === "horizontal") {
      legend.attr("transform", _do("translate", margin.left, 2 * margin.top + mapHeight));
    } else {
      legend.attr("transform", _do("translate", 2 * margin.left + mapWidth,
                                 margin.top));
    }
    
    
    projection.translate([mapWidth/2, mapHeight/2])
              .scale(baseZoom * Math.max(mapWidth, mapHeight));
    //console.log("projection:", projection.scale(), projection.translate());
  };
  
  
  map.updateNeighborhoods = function(duration) {
    duration = duration || 0;
    nPath.projection(projection);
    neighborhoods
      .transition().duration(duration)
      .attr("d", nPath);
    
    // Add labels
    nMain.selectAll("text")
        .attr("class", function(d) {
          var lineClass = (d.label.line) ? "lineLabel" : "";
          return "n-text " + d.id.replace(" ", "") + " " + lineClass;
        })
        .transition().duration(duration)
        .attr("transform", function(d) {
          var x = d.label.x || 0;
          var y = d.label.y || 0;
          var rotate = d.label.rotate || 0;
          return _do("translate", nPath.centroid(d)[0] + x, nPath.centroid(d)[1] + y) + " " +
                _do("rotate", rotate);
        });
    
    var lineHeight = 10;
    nMain.selectAll("text").selectAll("tspan")
        .attr("class", function(d, i) {
          return "n-label line-" + i;
        })
        .transition().duration(duration)
        .attr("font-size", lineHeight)
        .attr("x", 0)
        .attr("y", function(d, i) {
          return i * lineHeight;
        })
        .text(function(d) { return d; });
    
    // Add lines for labels that don't fit
    nMain.selectAll("line")
      .transition().duration(duration)
      .attr("x1", function(d) { return nPath.centroid(d)[0]; })
      .attr("y1", function(d) { return nPath.centroid(d)[1]; })
      .attr("x2", function(d) { return nPath.centroid(d)[0] + d.label.x })
      .attr("y2", function(d) { return nPath.centroid(d)[1] + d.label.y })
      
  };
  
  
  map.enterTracts = function(newTracts) {
    newTracts.append("path")
      
  };
  map.updateTracts = function(duration) {
    duration = duration || 0;
    path.projection(projection);
    
    //tracts.
    tracts.attr("class", function(d) {
            var plotted = d3.select(this).classed("plotted") ? " plotted" : "";
            var q = (typeof value(d) !== "undefined" && value(d) !== null)
                       ? quantScale(value(d)) + "-" + nColors
                       : "NA";
            var tractClass = "tract tract-" + idValue(d) +
               " q" + q + plotted;
            return tractClass;
          })
          .transition().duration(duration)
          .attr("d", path);
  };
  map.exitTracts = function(deadTracts) {
    deadTracts.remove();
  };
  
  
  map.updateLegend = function() {
    
    var legendDim = {"shortSide": legendSize,
                    "longSide": null};
    legendDim["longSide"] = (legendOrientation === "horizontal") ? width : height;
    
    var legendSeries = ["plotted", "unplotted"];
    
    var legendAxis = d3.svg.axis();
    legendScale = d3.scale.linear();
    
    var seriesLabelProp = 0.2; // proportion of long side going to label
    var tickLabelProp = 0.4; // proportion of short side going to tick labels
    
    legendScale.range([0, (1 - seriesLabelProp) * legendDim["longSide"]]);
    
    boxDim = {
      shortSide: (legendDim["shortSide"] * (1 - tickLabelProp)) /
                  legendSeries.length,
      longSide: (legendDim["longSide"] * (1 - seriesLabelProp)) /
                  nColors };
    
    // Create legend ticks at color boundaries, using the inverted color scale
    var legendTicks = d3.range(nColors)
                        .concat([nColors-1])
                        .map(function(d, i) {
                          return quantScale.invertExtent(d)[i-d];
                        });
    legendScale.domain(d3.extent(legendTicks));
    
    legendAxis.scale(legendScale)
      .tickValues(legendTicks);
    
    
    if (legendOrientation === "horizontal") {
      var legendWidth = width;
      var legendHeight = legendSize;
      
      legendAxis.orient("bottom");
      
      var bodyTransformX = legendDim["longSide"] * seriesLabelProp;
      var bodyTransformY = 0; //legendDim["shortSide"] * tickLabelProp;
      
      var axisGTransformX = 0;
      var axisGTransformY = legendDim["shortSide"] * (1 - tickLabelProp);
      
      // Function of i (series number, 0-indexed)
      var headerTransformX = function(i) { return .9 * bodyTransformX; /*bodyTransformX - margin.left;*/ };
      var headerTransformY = function(i) { return (i + 0.5) * boxDim["shortSide"]; };
      var headerRotate = 0;
      
      var legendGroupTranslateX = function(d) {
        return d * boxDim["longSide"];
      };
      var legendGroupTranslateY = function(d) {
        return 0;
      };
      
      var legendBoxX = function(d, i, p) {
        return 0;
      };
      var legendBoxY = function(d, i, p) {
        return i * boxDim["shortSide"];
      };
      
      var boxWidth = boxDim["longSide"];
      var boxHeight = boxDim["shortSide"];
      
      var tickX1 = function(d, i, p) { return i * boxDim["longSide"]; };
      var tickX2 = function(d, i, p) { return i * boxDim["longSide"]; };
        
      var tickY1 = function(d, i, p) {
        return legendDim["shortSide"] * (1 - tickLabelProp) * 1.05; };
      var tickY2 = function(d, i, p) {
        return 0;
      };
    } else {
      
      var legendWidth = legendSize;
      var legendHeight = height
      
      legendAxis.orient("right");
      
      var bodyTransformX = 0;  // ticks on right side, so don't transform X if vertical
      var bodyTransformY = legendDim["longSide"] * seriesLabelProp;
      
      var axisGTransformX = legendDim["shortSide"] * (1 - tickLabelProp);
      var axisGTransformY = 0;
      
      // Function of i (series number, 0-indexed)
      var headerTransformX = function(i) { return (i + 0.5) * boxDim["shortSide"]; };
      var headerTransformY = function(i) { return bodyTransformY - margin.top; };
      var headerRotate = -90;
      
      var legendGroupTranslateX = function(d) {
        return 0;
      };
      var legendGroupTranslateY = function(d) {
        return d * boxDim["longSide"];
      };
      
      var legendBoxX = function(d, i, p) {
        return i * boxDim["shortSide"];
      };
      var legendBoxY = function(d, i, p) {
        return 0;
      };
      
      var boxWidth = boxDim["longSide"];
      var boxHeight = boxDim["shortSide"];
      
      var tickX1 = function(d, i, p) { return 0; };
      var tickX2 = function(d, i, p) {
        return legendDim["shortSide"] * (1 - tickLabelProp) * 1.05; };
      var tickY1 = function(d, i, p) {
        return i * boxDim["longSide"];
      };
      var tickY2 = function(d, i, p) {
        return i * boxDim["longSide"];
      };
    }
    
    
    legendBody.attr("transform",
                        _do("translate", bodyTransformX,
                                         bodyTransformY));
    
    legendAxisg.attr("transform",
                      _do("translate", axisGTransformX, axisGTransformY));
    legendAxisg.call(legendAxis);
    
    legendHeader.selectAll(".header-label")
        .attr("transform", function(data, i) {
          // i is number of series, 0-indexed
          return _do("translate", headerTransformX(i), headerTransformY(i)) + " " +
                _do("rotate", headerRotate);
        });
    
    var legendGroups = legendBody.selectAll(".legend-group")
      .data(quantScale.range(), function(d) { return d; });
      
    legendGroups.enter()
          .append("g")
          .attr("class", "legend-group")
          .attr("transform", function(d) {
             return _do("translate", legendGroupTranslateX(d), legendGroupTranslateY(d));
          });
    legendGroups.exit()
      .remove();
          
    legendBoxes = legendGroups.selectAll(".legend-box")
        .data(legendSeries)
      .enter().append("rect")
          .attr("class", function(d) {
            return "legend-box " + d;
          });
  
    legendBoxes.attr("x", legendBoxX)
                .attr("y", legendBoxY)
                .attr("width", boxWidth)
                .attr("height", boxHeight)
                .attr("class", function(d, i, p) {
                  return d + " legend-box q" + p + "-" + nColors; 
                });
    
    
    legendGroups.selectAll(".label-tick")
        .data(function(i) {
          return (i == quantScale.range().length - 1) ? [i, i+1] : [i];
        })
        .enter()
          .append("line")
          .attr("class", "label-tick");
          
    legendGroups.selectAll(".label-tick")
      .attr("x1", tickX1)
      .attr("x2", tickX2)
      .attr("y1", tickY1)
      .attr("y2", tickY2);
    /*
    var boxWidthProp = .6; // proportion of width that goes to boxes
    var bodyHeightProp = .8;
    var boxWidth = legendWidth * boxWidthProp / legendColumns.length;
    var boxHeight = bodyHeightProp * legendHeight / nColors;
    
    */
    
    //console.log(legendAxis.tickValues());
    
    
    
    
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
  
  map.margin = function(_) {
    if (!arguments.length) return margin;
    for (key in _) {
      margin[key] = _[key];
    }
    return map;
  };
  map.plotWidth = function(_, update) {
    if (!arguments.length) return plotWidth;
    plotWidth = _;
    if (mapCreated) {
      if (typeof update === "undefined" || update)
        map.updateMap();
      else svg.attr("width", plotWidth);
    }
    return map;
  };
  map.plotHeight = function(_, update) {
    if (!arguments.length) return plotHeight;
    plotHeight = _;
    if (mapCreated) {
      if (typeof update === "undefined" || update)
        map.updateMap();
      else svg.attr("height", plotHeight);
    }
    return map;
  };
  map.legendSize = function(_) {
    if (!arguments.length) return legendSize;
    legendSize = _;
    return map;
  };
  map.legendOrientation = function(_) {
    if (!arguments.length) return legendOrientation;
    legendOrientation = _;
    return map;
  };
  
  
  map.clicked = function(d) {
    var centroid = path.centroid(d),
        translate = projection.translate();
  
    projection.translate([
      translate[0] - centroid[0] + width / 2,
      translate[1] - centroid[1] + height / 2
    ]);
    
    zoom.translate(projection.translate());
    map.updateTracts(500);
    map.updateNeighborhoods(440);
  /*
    svg.selectAll("path").transition()
        .duration(700)
        .attr("d", path);*/
  };
  
  function zoomed() {
    translation = d3.event.translate;
    scale = d3.event.scale;
    if (mapCreated) {
      //console.log(zoom.scale(), zoom.translate());
      projection.translate(translation).scale(scale);
      
      map.updateTracts();
      map.updateNeighborhoods();
      /*
      svg.select(".main").selectAll("path").attr("d", path);
      svg.select(".nMain").selectAll("path").attr("d", nPath);
      svg.select(".nMain").selectAll("text").attr("transform", function(d) {
          var x = d.label.x || 0;
          var y = d.label.y || 0;
          var rotate = d.label.rotate || 0;
          return _do("translate", path.centroid(d)[0] + x, path.centroid(d)[1] + y) + " " +
                _do("rotate", rotate);
        });
      svg.select(".nMain").selectAll("line")
        .attr("x1", function(d) { return path.centroid(d)[0]; })
        .attr("y1", function(d) { return path.centroid(d)[1]; })
        .attr("x2", function(d) { return path.centroid(d)[0] + d.label.x })
        .attr("y2", function(d) { return path.centroid(d)[1] + d.label.y });
      */
    }
    
  }
  map.resetZoom = function() {
    if (mapCreated) {
      //zoom.scale(1).translate([0,0]);
      projection.translate([mapWidth/2, mapHeight/2])
              .scale(baseZoom * Math.max(mapWidth, mapHeight));
      console.log("projection:", projection.scale(), projection.translate());
      map.updateTracts(500);
      map.updateNeighborhoods(500);
      addZoom();
      //zoom = d3.behavior.zoom()
      //          .on("zoom", zoomed);
      //zoom.translate(projection.translate())
      //              .scale(projection.scale())
      //              .scaleExtent([projection.scale(), 8*projection.scale()]);
      //zoom(svg);
      //zoom.translate([mapWidth/2, mapHeight/2])
      //    .scale(zoom * baseZoom * Math.max(mapWidth, mapHeight));
      //zoom.event(svg);
    }
  }
  
  
  map.zoom = function(_) {
    if (!arguments.length) return zoom;
    zoom = _;
    
    return map;
  };
  return map;
}