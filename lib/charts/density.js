function densityPlot() {
  // Dimensions
  var margin = {top: 20, right: 10, bottom: 40, left: 40},
      plotWidth = 500,
      plotHeight = 100,
      width, height,
      wScale = 1, hScale = 1;
  
  // Data / Other globals
  var dataIn,
      data, // array of objects with value and densityValue components
      values, // array of values
      parentId; // ID of parent element
  
  // Mapping functions
  var value = function(d) { return d['x'] }, // overwrite this based on dataset
      xValue = function(d) { return d.value },
      yValue = function(d) { return d.densityValue },
      idValue = function(d) { return d['id'] };
  
  // Scales/Axes    
  var xScale = d3.scale.linear(),
      yScale = d3.scale.linear(),
      xAxis = d3.svg.axis().orient("bottom"),
      yAxis = d3.svg.axis().orient("left"),
      xAxisg, yAxisg,
      showAxes = "x";
  
  // Main components    
  var svg, // SVG container
      plotContainer, // container group for plot (for custom transformations)
      main, // Main container (translated by margins)
      line = d3.svg.line(), // density line in background
      path;
  
  // Highlight, which shows portions of density distribution
  // selected by the brush.
  var highlight, // group containing all highlight elements
      highlightLine = d3.svg.line(), // highlighted line
      highlightLinePath,
      highlightArea = d3.svg.area(), // highlighted area
      highlightAreaPath,
      highlightClipPath, highlightClipPathRect;
      
  // Brush, allowing user to select only a portion of the density distribution
  var brush = d3.svg.brush(),
      brushg,
      brushHandle = d3.svg.arc(), // element used as handle
      brushStartListener = function() { return null; },
      brushMoveListener = function() { return null; },
      brushEndListener = function() { return null; };
      
/* Constructor */
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
  
/* Private functions */
  function createPlot(selection) {
    // Create SVG
    svg = selection.append("svg").attr("class", "main-svg");
    plotContainer = svg.append("g").attr("class", "plotContainer");
    main = plotContainer.append("g").attr("class", "main");
    
    // Create Axes groups
    xAxisg = main.append("g").attr("class", "axis x-axis");
    yAxisg = main.append("g").attr("class", "axis y-axis");
          
    // Create density path
    path = main.append("path").attr("class", "line density-line");
    
    // Create highlight
    highlight = main.append("g").attr("class", "density-highlight");        
    highlightClipPath = highlight.append("clipPath")
              .attr("class", "clip-path")
              .attr("id", parentId + "-highlight-clip-path");
    highlightClipPathRect = highlightClipPath.append("rect");
      
    highlightAreaPath = highlight.append("path")
            .attr("class", "area highlight-area")
            .attr("clip-path", _do("url", "#" + highlightClipPath.attr("id")));
      
    highlightLinePath = highlight.append("path")
            .attr("class", "line highlight-line")
            .attr("clip-path", "url(#" + highlightClipPath.attr("id") + ")");
    
    // Create bursh group  
    brushg = main.append("g").attr("class", "brush");
    
  }
  // Brush listener wrappers
  // These call the custom (external) listeners after doing basic functionality
  function brushStart() {
    brushStartListener(brush);
  }
  function brushMove() {
    var extent = brush.extent()
    highlightClipPathRect.attr("x", xScale(extent[0]))
            .attr("width", xScale(extent[1] - extent[0]));
    brushMoveListener(brush);
  }
  function brushEnd() {
    if (d3.event.target.empty()) { // empty target, reset to full extent
      var extent = d3.extent(data, xValue);
      brush.extent(extent);
      brushg.call(brush);
      highlightClipPathRect.attr("x", xScale(extent[0]))
            .attr("width", xScale(extent[1] - extent[0]));
    }
    brushEndListener(brush);
  }
  
/* Public functions */
  // Create data from imported dataset
  plot.updateData = function(dataset) {
    if (arguments.length) dataIn = dataset;
    // Extract (1-dimensional) data from dataset 
    values = dataIn.data.map(function(d, i) {
                    return value.call(dataIn, d, i);
                  });
    // create a kernel density function
    var kde = science.stats.kde().sample(values);
    
    // Create density dataset
    // x = values
    // y = density at those values
    data = kde(values).map(function(d, i) {
          return { value: d[0],
                   densityValue: d[1] };
        })
        .sort(function(a, b) { // sort by x value
          return a.value - b.value;
        });
    return plot;
  };
  
  // (Re)draw plot
  plot.updatePlot = function() {
    svg.attr("width", wScale * plotWidth)
        .attr("height", hScale * plotHeight);
    
    main.attr("transform", _do("translate", margin.left, margin.top));
    
    width = (plotWidth - margin.left - margin.right);
    height = (plotHeight - margin.top - margin.bottom);
    
    
    xScale.range([0, width]);
      // Make yScale slightly smaller to allow for line to not get cut off
    yScale.range([height, .1 * height]);
    
    xAxis.scale(xScale);
    yAxis.scale(yScale);
    xAxisg.attr("transform", _do("translate", 0, height));
    
    plot.updateAxes();
    
    plot.updateLine();
    
    highlightAreaPath.datum(data);
    highlightLinePath.datum(data);
    highlightClipPathRect.attr("y", 0).attr("x", 0)
          .attr("height", height)
          .attr("width", 100);
    
    brush.x(xScale)
            .extent(d3.extent(data, xValue))
            .on("brushstart", brushStart)
            .on("brush", brushMove)
            .on("brushend", brushEnd);
            
    brushg.call(brush);
    brushg.selectAll("rect")
          .attr("height", height);
          
    
    brushHandle.outerRadius(height / 8)
      .startAngle(0)
      .endAngle(function (d, i) { return i ? -Math.PI : Math.PI; });
    
    brushg.selectAll(".resize").append("path")
      .attr("transform", _do("translate", 0, height / 2))
      .attr("d", brushHandle);
    
    brushMove();
    
    plot.updateHighlight();
    
    return plot;
  };
  
  // (Re)draw axes (or a single axis)
  // Takes "x", "y", or "xy" (both, default)
  plot.updateAxes = function(axes) {
    if (!arguments.length) axes = "xy"; // if no argument, update all
    
    // Update x-axis
    if (axes.indexOf("x") !== -1) {
      xScale.domain(d3.extent(data, xValue));
      if (showAxes.indexOf("x") !== -1) svg.select(".x-axis").call(xAxis);
    }
    
    // Update y-axis
    if (axes.indexOf("y") !== -1) {
      yScale.domain(d3.extent(data, yValue));
      if (showAxes.indexOf("y") !== -1) svg.select(".y-axis").call(yAxis);
    }
    
    return plot;
  };
  
  // (Re)draw background density line
  plot.updateLine = function() {
    line.x(function(d) { return xScale(xValue(d)); })
        .y(function(d) { return yScale(yValue(d)); });
    path.attr("d", line);
    
    return plot;
  };
  
  // (Re)draw highlighted portion of density distribution
  plot.updateHighlight = function() {
    highlightArea.x(function(d) { return xScale(xValue(d)); })
                 .y0(height)
                 .y1(function(d) { return yScale(yValue(d)); });
    highlightLine.x(function(d) { return xScale(xValue(d)); })
                 .y(function(d) { return yScale(yValue(d)); });
    
    highlightAreaPath.attr("d", highlightArea);
    highlightLinePath.attr("d", highlightLine);
    
    return plot;
  };
  
  
  // Getters
  plot.svg = function() {
    return svg;
  };
  plot.brush = function() {
    return brush;
  }
  
  // Custom brush listeners
  plot.brushStartListener = function(_) {
    if (!arguments.length) return brushStartListener;
    brushStartListener = _;
    return plot;
  };
  plot.brushMoveListener = function(_) {
    if (!arguments.length) return brushMoveListener;
    brushMoveListener = _;
    return plot;
  };
  plot.brushEndListener = function(_) {
    if (!arguments.length) return brushEndListener;
    brushEndListener = _;
    return plot;
  };

  plot.value = function(_) {
    if (!arguments.length) return value;
    value = _;
    return plot;
  }
  
  // Plot size
  plot.plotWidth = function(_, update) {
    if (!arguments.length) return plotWidth;
    plotWidth = _;
    if (typeof update === "undefined" || update) plot.updatePlot();
    else svg.attr("width", plotWidth);
    return plot;
  };
  plot.plotHeight = function(_, update) {
    if (!arguments.length) return plotHeight;
    plotHeight = _;
    if (typeof update === "undefined" || update) plot.updatePlot();
    else svg.attr("height", plotHeight);
    return plot;
  };
  plot.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    if (typeof update === "undefined" || update) plot.updatePlot();
    return plot;
  };
  
  plot.plotContainer = function(_) {
    if (!arguments.length) return plotContainer;
  };
  plot.rotate = function(angle) {
    // modulo out full rotations and convert to radians
    angle = angle % 360;
    theta = angle * (Math.PI / 180);
    var H = plotHeight * Math.cos(theta) + plotWidth * Math.sin(theta);
    var W = plotHeight * Math.sin(theta) + plotWidth * Math.cos(theta);
    //var H = plotHeight * Math.sin(theta);
    //var W = plotWidth  * Math.cos(theta);
    if (0 <= angle && angle < 90) {
      var dx = plotHeight * Math.sin(theta);
      var dy = 0;
      var H = plotHeight * Math.cos(theta) + plotWidth * Math.sin(theta);
      var W = plotHeight * Math.sin(theta) + plotWidth * Math.cos(theta);
    
    } else if (90 <= angle && angle < 180) {
      var dx = -plotWidth * Math.cos(theta) + plotHeight * Math.sin(theta);
      var dy = -plotHeight * Math.cos(theta);
      var H = plotHeight * Math.cos(theta) - plotWidth * Math.sin(theta);
      var W = plotHeight * Math.sin(theta) - plotWidth * Math.cos(theta);
      brushg.selectAll(".resize").attr("style", "cursor: ns-resize;");
    } else if (180 <= angle && angle < 270) {
      var dx = -plotWidth * Math.cos(theta);
      var dy = -plotWidth * Math.sin(theta) - plotHeight * Math.cos(theta);
      var H = plotHeight * Math.cos(theta) + plotWidth * Math.sin(theta);
      var W = plotHeight * Math.sin(theta) + plotWidth * Math.cos(theta);
    } else {
      var dx = 0;
      var dy = -plotWidth * Math.sin(theta);
      var H = plotHeight * Math.cos(theta) - plotWidth * Math.sin(theta);
      var W = plotHeight * Math.sin(theta) - plotWidth * Math.cos(theta);
      brushg.selectAll(".resize").attr("style", "cursor: ns-resize;");
    }
    
    wScale = Math.abs(W / plotWidth);
    hScale = Math.abs(H / plotHeight);
    console.log("W: ", W);
    console.log("H: ", H);
    console.log("dx: ", dx);
    console.log("dy: ", dy);
    console.log("scale: ", wScale, hScale);
    //plot.plotHeight(H, false)
    //plot.plotWidth(W, false);
    plot.updatePlot();
    plotContainer.attr("transform", _do("translate", dx, dy) + " "
                       + _do("rotate", angle));
  };
  
  
  
  return plot;
}