function densityPlot() {
  var margin = {top: 20, right: 10, bottom: 40, left: 40},
      plotWidth = 500,
      plotHeight = 100;
      
  var width, height,
      value = function(d) { return d['x'] },
      densityValue,
      xValue = function(d) { return d.value },
      yValue = function(d) { return d.densityValue },
      idValue = function(d) { return d['id'] },
      xScale = d3.scale.linear(),
      yScale = d3.scale.linear(),
      xAxis = d3.svg.axis().orient("bottom"),
      yAxis = d3.svg.axis().orient("left"),
      xAxisg, yAxisg,
      showAxes = "x",
      //kde = science.stats.kde(),
      line = d3.svg.line(),
      highlightLine = d3.svg.line(),
      highlightArea = d3.svg.area(),
      brushHandle = d3.svg.arc(),
      brush = d3.svg.brush(),
      brushStartListener = function() { return null; },
      brushMoveListener = function() { return null; },
      brushEndListener = function() { return null; };
      
  // These all depend upon the creation of SVG before we can append them
  var rootSvg, svg, density,
      data, values,
      main,
      brushg,
      path, highlight,
      highlightLinePath, highlightAreaPath,
      highlightClipPath, highlightClipPathRect,
      s,
      parentId;
  
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
    main = svg.append("g").attr("class", "main");
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
              //.attr("clip-path", "url(#" + highlightClipPath.attr("id") + ")");
      
    highlightLinePath = highlight.append("path")
              .attr("class", "line highlight-line")
              .attr("clip-path", "url(#" + highlightClipPath.attr("id") + ")");
    
    // Create bursh group  
    brushg = main.append("g").attr("class", "brush");
  }
  plot.updateData = function(dataset) {
    // Extract (1-dimensional) data from dataset 
    values = dataset.data.map(function(d, i) {
                    return value.call(dataset, d, i);
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
  
  plot.updatePlot = function() {
    svg.attr("width", plotWidth)
        .attr("height", plotHeight);
    
    main.attr("transform", _do("translate", margin.left, margin.top));
    
    width = plotWidth - margin.left - margin.right;
    height = plotHeight - margin.top - margin.bottom;
    
    
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
    console.log("extent", d3.extent(data, xValue));
    brush.x(xScale)
            .extent(d3.extent(data, xValue))
            .on("brushstart", brushStart)
            .on("brush", brushMove)
            .on("brushend", brushEnd);
            
    brushg.call(brush);
    brushg.selectAll("rect")
          .attr("height", height);
    brushMove();
    
    //plot.updateAxes();
    plot.updateHighlight();
  };
  
  
  function brushStart() {
    console.log("Brush Start", d3.event);
    brushStartListener(brush);
  }
  function brushMove() {
    console.log("Brush Move", brush.extent());
    highlightClipPathRect.attr("x", xScale(brush.extent()[0]))
            .attr("width", xScale(brush.extent()[1] - brush.extent()[0]));
    brushMoveListener(brush);
  }
  function brushEnd() {
    console.log("Brush End");
    if (d3.event.target.empty()) { // reset
      brush.extent(d3.extent(data, xValue));
      brushg.call(brush);
      highlightClipPathRect.attr("x", xScale(brush.extent()[0]))
            .attr("width", xScale(brush.extent()[1] - brush.extent()[0]));
    }
    brushEndListener(brush);
  }
  
  plot.updateAxes = function(axes) {
    if (!arguments.length) var axes = "xy"; // if no argument, update all
    
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
  
  plot.updateLine = function() {
    line.x(function(d) { return xScale(xValue(d)); })
        .y(function(d) { return yScale(yValue(d)); });
    path.attr("d", line);
    return plot;
  };
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
  plot.svg = function() {
    return svg;
  };
  plot.brush = function() {
    return brush;
  }
  
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
  /*plot.brushListeners = function(_) {
    if (!arguments.length) return brushListeners;
    brushListeners = _;
    return plot;
  };*/
  
  // Setters/Getters
  plot.plotWidth = function(_) {
    if (!arguments.length) return plotWidth;
    plotWidth = _;
    return plot;
  };
  plot.plotHeight = function(_) {
    if (!arguments.length) return plotHeight;
    plotHeight = _;
    return plot;
  };
  function resize() {
    console.log("Resize:", plot);
    plot(d3.select(svg.node().parentNode.parentNode.id));
    //width = plotWidth - margin.left - margin.right;
    //height = plotHeight - margin.top - margin.bottom;
    //d3.select(svg.node().parentNode).attr("width", plotWidth)
      //          .attr("height", plotHeight);
    //.attr("transform", _do("translate", margin.left, margin.top));
    //svg.attr("transform", _do("translate", margin.left, margin.top));
    /*svg.select(".x-axis")
          .attr("transform", _do("translate", 0, height));
    highlightClipPathRect.attr("height", height);
    brushg.selectAll("rect")
          .attr("height", height);
    xScale.range([0, width]);
    // Make yScale slightly smaller to allow for line to not get cut off
    yScale.range([height, .1 * height]);
    plot.updateAxes();
    plot.updateLine();
    plot.updatehighlight();*/
    //plot(d3.select);
    //svg.attr("transform", _do("rotate", 270) + " " +
                         // _do("translate", -plotHeight + margin.left, width - margin.bottom));
  }
  
  
  return plot;
}