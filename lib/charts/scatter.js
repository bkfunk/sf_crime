function scatterPlot() {
  var margin = {top: 20, right: 10, bottom: 40, left: 40},
      plotWidth = 500, // total width of the plot, including margins
      plotHeight = 500, // total height of the plot, including margins
      markerType = "circle";
  
  var width = plotWidth - margin.left - margin.right,
      height = plotHeight - margin.top - margin.bottom,
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
      xScale = d3.scale.linear().range([0, width]),
        // For yScale, we reduce the range so that we won't cut off top marker
      yScale = d3.scale.linear().range([height, markerSizeValue(0)]),
      xAxis = d3.svg.axis().scale(xScale).orient("bottom"),
      yAxis = d3.svg.axis().scale(yScale).orient("left"),
      markerListeners = {
        "mouseover": function(d, i) {
          console.log("Event triggered:", d3.event);
          console.log("i:", i, "d:", d);
          console.log("this:", this);
        }
      };
      var markerMouseoverListener = function(d, i) {
        console.log("Event triggered:", d3.event);
        console.log("i:", i, "d:", d);
        console.log("this:", this);
      };
      
  var svg, markers;//, dataset;
      
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
  
  plot.enterMarkers = function(newMarkers) {
    newMarkers = newMarkers.append(markerType);
    if (markerType == "circle") {
      newMarkers.attr("r", markerSizeValue)
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
  
  plot.updateAxes = function(axes, domain) {
    console.log("Updating axes: ", axes);
    console.log("Domain: ", domain);
    // pass "x", "y" or "xy" for axes
    // pass domain object with array with min/max in x or y
    if (!arguments.length) {
      axes = "xy"; // if no argument, update all
      domain = {
        x: d3.extent(svg.data()[0], function(d) { return d.x; }),
        y: d3.extent(svg.data()[0], function(d) { return d.y; })
      };
    } else if (arguments.length == 1) {
      // supply axes but not domains
      domain = {
        x: d3.extent(svg.data()[0], function(d) { return d.x; }),
        y: d3.extent(svg.data()[0], function(d) { return d.y; })
      };
    } else if (typeof domain.x === "undefined"
               && typeof domain.y === "undefined") {
      var old = domain;
      domain = {
        x: old,
        y: old
      };
    }
    
    // Update x-axis
    if (axes.indexOf("x") !== -1) {
      xScale.domain(domain.x)
      svg.select(".x-axis").call(xAxis);
    }
    
    // Update y-axis
    if (axes.indexOf("y") !== -1) {
      yScale.domain(domain.y)
      svg.select(".y-axis").call(yAxis);
    }
    
    return plot;
  };
  
  // Setters/Getters
  plot.plotWidth = function(_) {
    if (!arguments.length) return plotWidth;
    plotWidth = _;
    width = plotWidth - margin.left - margin.right;
    return plot;
  };
  plot.plotHeight = function(_) {
    if (!arguments.length) return plotHeight;
    plotHeight = _;
    height = plotHeight - margin.top - margin.bottom;
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