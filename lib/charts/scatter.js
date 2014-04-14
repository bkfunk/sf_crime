function scatterPlot() {
  var margin = {top: 20, right: 10, bottom: 40, left: 40},
      plotWidth = 500, // total width of the plot, including margins
      plotHeight = 500, // total height of the plot, including margins
      //markerSize = plotWidth / 100,
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
                 "cy": function(d) { return yScale(yValue(d)); }
               };
      },
      xScale = d3.scale.linear().range([0, width]),
      yScale = d3.scale.linear().range([height, 0]),
      xAxis = d3.svg.axis().scale(xScale).orient("bottom"),
      yAxis = d3.svg.axis().scale(yScale).orient("left");
      
  var svg, markers;//, dataset;
      
  function plot(selection) {
    console.log("IN PLOT");
    console.log(selection);
    console.log(selection.data()[0]);
    
    //dataset = data;
    // Select the svg element, if it exists.
    selection.each(function(dataset) {
    
    // Dataset MUST contain an element called "data"
    var data = dataset.data.map(function(d, i) {
      return { x: xValue.call(dataset, d, i),
               y: yValue.call(dataset, d, i),
               id: idValue.call(dataset, d, i) };
    });
    console.log("Data", data);
    svg = d3.select(this).selectAll("svg")
              .data([data])
            .enter()
              .append("svg")
                .append("g")
                  .attr("transform", _do("translate", margin.left, margin.top));
    
    // Set plot width and height
    svg.attr("width", plotWidth)
       .attr("height", plotHeight);
    
    // Create marker group
    var markerg = svg.append("g")
                      .attr("class", "markers-group")
    
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
    /*if (markerType == "circle") {
      markers.attr("r", markerSizeValue)
              .attr("cx", function(d, i) { return xScale(d.x); })
              .attr("cy", function(d, i) { return yScale(d.y); });
    }*/
    
    /*xScale.domain([0, 100]);
    yScale.domain([0, 100]);
    
    svg.select(".x-axis").call(xAxis);
    svg.select(".y-axis").call(yAxis);
    /*svg.each(function(dd, i) {
      console.log("Data:");
      console.log(dd);
      // Convert data to standard representation greedily;
      // this is needed for nondeterministic accessors.
      var circles = markerg.selectAll("circle").data(dd)
          .enter()
            .append("circle").attr("r", markerSize)
            .attr("cx", function(d, i) { return (d.x); })
            .attr("cy", function(d, i) { return (d.y); });*/
            
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
    plot.updateMarkerPositions(true);
  };
  plot.exitMarkers = function(deadMarkers) {
    deadMarkers.remove();
  };
  plot.updateAxes = function(axes) {
    if (!arguments.length) var axes = "xy"; // if no argument, update all
    
    // Update x-axis
    if (axes.indexOf("x") !== -1) {
      xScale.domain(d3.extent(svg.data()[0], function(d) { return d.x; }))
      svg.select(".x-axis").call(xAxis);
    }
    
    // Update y-axis
    if (axes.indexOf("y") !== -1) {
      yScale.domain(d3.extent(svg.data()[0], function(d) { return d.y; }))
      svg.select(".y-axis").call(yAxis);
    }
    
    return plot;
  };
  
  plot.updateMarkerPositions = function(transition) {
    if (!arguments.length) transition = false;
    if (transition) {
      markers.transition().duration(1000)
              .attr(markerPositionValue());
    } else {
      markers.attr(markerPositionValue());
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
  
  return plot;
}