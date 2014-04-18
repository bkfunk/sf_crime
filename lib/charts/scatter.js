function scatterPlot() {
  var margin = {top: 20, right: 10, bottom: 40, left: 40},
      plotWidth = 500, // total width of the plot, including margins
      plotHeight = 500, // total height of the plot, including margins
      markerType = "circle";
  
  var width,
      height,
      wScale = 1, hScale = 1,
      xValue = function(d) { return d['x'] },
      yValue = function(d) { return d['y'] },
      idValue = function(d) { return d['id'] },
      markerSizeValue = function(d) { return plotWidth / 100; }, // constant by
                                                           // default but could
                                                           // be function of d
      markerPositionValue = function() {
        // Function that returns attributes object for d;
        return { "cx": function(d) { return xScale(xValue(d)); },
                 "cy": function(d) { return yScale(yValue(d)); } };
      },
      xScale = d3.scale.linear(),
      yScale = d3.scale.linear(),
      xAxis = d3.svg.axis().orient("bottom"),
      yAxis = d3.svg.axis().orient("left"),
      xAxisg, yAxisg,
      showAxes = "xy",
      markerListeners = {
        "mouseover": function(d, i) {
          console.log("Event triggered:", d3.event);
          console.log("i:", i, "d:", d);
          console.log("this:", this);
        }
      };
      /*var markerMouseoverListener = function(d, i) {
        console.log("Event triggered:", d3.event);
        console.log("i:", i, "d:", d);
        console.log("this:", this);
      };*/
      
  var svg, markers,
      data, parentId,
      markerClipPath,
      plotCreated = false;//, dataset;
  /*   
  function plot(selection) {
    console.log("IN PLOT");
    console.log(selection);
    console.log(selection.data()[0]);
    
    // Select the svg element, if it exists.
    selection.each(function(dataset) {
    
      // Dataset MUST contain an element called "data"
      var data = dataset.data.map(function(d, i) {
        return { x: xValue.call(dataset, d, i),
                 y: yValue.call(dataset, d, i),
                 id: idValue.call(dataset, d, i) };
      });
      
      // Append svg
      svg = d3.select(this).selectAll("svg")
                .data([data])
              .enter()
                .append("svg")
                  .attr("width", plotWidth)
                  .attr("height", plotHeight)
                  .append("g")
                    .attr("transform", _do("translate", margin.left, margin.top));
      // Add clip path
      svg.append("clipPath")
            .attr("id", this.id + "-clip-path")
          .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height);
      
      // Create marker group
      var markerg = svg.append("g")
                        .attr("class", "markers-group")
                        .attr("clip-path", "url(#" + this.id + "-clip-path)");
      
      // Add axes to svg                  
      svg.append("g")
          .attr("class", "axis x-axis")
          .attr("transform", _do("translate", 0, height));
      svg.append("g")
          .attr("class", "axis y-axis");
      
      // Update axes
      plot.updateAxes();
      
      
      // Create markers
      markers = markerg.selectAll(markerType)
                      .data(data, function(d) { return d.id; });
                    //.enter()
                      //.append(markerType);
      plot.enterMarkers(markers.enter());
      plot.updateMarkers();
      plot.exitMarkers(markers.exit());
    });
  };
  */
  function plot(selection) {
    selection.each(function(dataset) {
      parentId = this.id;
      plot.updateData(dataset);
      
      d3.select(this).selectAll("svg")
          .data([data]).enter()
            .call(createPlot);
      
      plot.updatePlot();
    });
  }
  function createPlot(selection) {
    // Create SVG
    svg = selection.append("svg").attr("class", "main-svg");
    plotContainer = svg.append("g").attr("class", "plotContainer");
    main = plotContainer.append("g").attr("class", "main");
    
    // Create Axes groups
    xAxisg = main.append("g").attr("class", "axis x-axis");
    yAxisg = main.append("g").attr("class", "axis y-axis");
    
    markerClipPath = main.append("clipPath")
                        .attr("class", "clip-path")
                        .attr("id", parentId + "-marker-clip-path");
    markerClipPathRect = markerClipPath.append("rect");
    
    markerg = main.append("g")
              .attr("class", "markers-group")
              .attr("clip-path", "url(#" + parentId + "-marker-clip-path)");
    plotCreated = true;
  }
  
  plot.updatePlot = function() {
    svg.attr("width", wScale * plotWidth)
        .attr("height", hScale * plotHeight);
    
    main.attr("transform", _do("translate", margin.left, margin.top));
    
    width = (plotWidth - margin.left - margin.right);
    height = (plotHeight - margin.top - margin.bottom);
    
    markerClipPathRect.attr("width", width)
                      .attr("height", height)
    
    xScale.range([0, width]);
      // Make yScale slightly smaller to allow for line to not get cut off
    yScale.range([height, markerSizeValue(0)]);
    
    xAxis.scale(xScale);
    yAxis.scale(yScale);
    xAxisg.attr("transform", _do("translate", 0, height));
    
    plot.updateAxes();
    
    // Create markers
    markers = markerg.selectAll(markerType)
                    .data(data, function(d) { return d.id; });
                  //.enter()
                    //.append(markerType);
    plot.enterMarkers(markers.enter());
    plot.updateMarkers();
    plot.exitMarkers(markers.exit());
  };
  
  
  plot.updateData = function(dataset) {
    if (arguments.length) dataIn = dataset;
    data = dataIn.data.map(function(d, i) {
          return { x: xValue.call(dataset, d, i),
                  y: yValue.call(dataset, d, i),
                   id: idValue.call(dataset, d, i) };
        });
    
    return plot;
  };
  
  plot.enterMarkers = function(newMarkers) {
    console.log("new markers", newMarkers);
    newMarkers = newMarkers.append(markerType);
    if (markerType == "circle") {
      newMarkers.attr("r", markerSizeValue)
                .attr("id", function(d) { return idValue(d); })
                .attr("cx", xScale(0))
                .attr("cy", yScale(0));
    }
  };
  
  plot.updateMarkers = function() {
    plot.updateMarkerPositions();
    for (type in markerListeners) {
      markers.on(type, markerListeners[type]);
    }
  };
  
  plot.exitMarkers = function(deadMarkers) {
    deadMarkers.remove();
  };
  
  plot.updateMarkerPositions = function(transition) {
    if (!arguments.length) transition = false;
    if (transition) {
      markers.transition().duration(500)
              .attr(markerPositionValue());
    } else {
      markers.attr(markerPositionValue());
    }
    return plot;
  };
  
  // Update and draw axes
  plot.updateAxes = function(axes, domain) {
    // pass "x", "y" or "xy" for axes
    // pass domain object with array with min/max in x or y
    if (arguments.length == 0) {
      axes = "xy"; // if no argument, update all
    }
    if (arguments.length < 2) {
      // if no domain given
      domain = {
        x: d3.extent(svg.data()[0], function(d) { return d.x; }),
        y: d3.extent(svg.data()[0], function(d) { return d.y; })
      };
    } else if (typeof domain.x === "undefined"
               && typeof domain.y === "undefined") {
      // if domain is given as an array, and doesn't have an X and Y property
      var old = domain;
      domain = {
        x: old,
        y: old
      };
    }
    
    // Update x-axis
    if (axes.indexOf("x") !== -1) {
      xScale.domain(domain.x);
      if (showAxes.indexOf("x") !== -1)
          main.select(".x-axis").call(xAxis);
    }
    
    // Update y-axis
    if (axes.indexOf("y") !== -1) {
      yScale.domain(domain.y);
      if (showAxes.indexOf("y") !== -1)
          main.select(".y-axis").call(yAxis);
    }
    
    return plot;
  };
  
  // Plot size
  plot.plotWidth = function(_, update) {
    if (!arguments.length) return plotWidth;
    plotWidth = _;
    if (plotCreated) {
      if (typeof update === "undefined" || update)
        plot.updatePlot();
      else svg.attr("width", plotWidth);
    }
    return plot;
  };
  plot.plotHeight = function(_, update) {
    if (!arguments.length) return plotHeight;
    plotHeight = _;
    if (plotCreated) {
      if (typeof update === "undefined" || update)
        plot.updatePlot();
      else svg.attr("height", plotHeight);
    }
    return plot;
  };
  
  plot.markerSize = function(_) {
    if (!arguments.length) return markerSize;
    markerSize = _;
    return plot;
  };
  plot.markerListeners = function(_) {
    if (!arguments.length) return markerListeners;
    markerListeners = _;
    return plot;
  };
  plot.addMarkerListener = function(newType, newListener) {
    markerListeners[newType] = newListener;
    for (type in markerListeners) {
      markers.on(type, markerListeners[type]);
    }
    return plot;
  };
  
  return plot;
}