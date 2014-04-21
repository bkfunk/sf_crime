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
      parentId, // ID of parent element
      plotCreated = false;
  
  // Mapping functions
  var getValue = function(d) { return d['x']; }, // overwrite this based on dataset
      //xValue = function(d) {
      //  return (orientation === "horizontal") ? d.value : d.densityValue; },
      //yValue = function(d) {
      //  return (orientation === "horizontal") ? d.densityValue : d.value; },
      value = function(d) { return d.value; },
      densityValue = function(d) { return d.densityValue; },
      idValue = function(d) { return d['id'] };
  
  // Scales/Axes    
  var xScale = d3.scale.linear(),
      yScale = d3.scale.linear(),
      xAxis = d3.svg.axis(),
      yAxis = d3.svg.axis(),
      xAxisg, yAxisg,
      showAxes = "x",
      flipAxis = false,
      orientation = "horizontal",
      axisLabelText = "Values",
      axisLabel;
  
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
      //brushAxis = "x",
      //brushDirection = "ew";
      
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
    plotCreated = true;
  }
  // Brush listener wrappers
  // These call the custom (external) listeners after doing basic functionality
  function brushStart() {
    brushStartListener(brush);
  }
  function brushMove() {
    var extent = brush.extent();
    console.log(extent);
    if (orientation === "horizontal") {
        highlightClipPathRect.attr("x", xScale(extent[0]))
              .attr("width", xScale(extent[1]) - xScale(extent[0]));
    }
    else {
      console.log(yScale(extent[0]), yScale(extent[1]));
        highlightClipPathRect.attr("y", yScale(extent[1]))
              .attr("height", (yScale(extent[0]) - yScale(extent[1])));
    }
    
    brushMoveListener(brush);
  }
  function brushEnd() {
    if (d3.event.target.empty()) { // empty target, reset to full extent
      var extent = d3.extent(data, value);
      if (orientation === "horizontal") {
        //var extent = d3.extent(data, value);
        highlightClipPathRect.attr("x", xScale(extent[0]))
            .attr("width", xScale(extent[1]) - xScale(extent[0]));
      } else {
        //var extent = d3.extent(data, yValue);
        highlightClipPathRect.attr("y", yScale(extent[1]))
            .attr("height", (yScale(extent[0]) - yScale(extent[1])));
      }
      brush.extent(extent);
      brushg.call(brush);
    }
    brushEndListener(brush);
  }
  
/* Public functions */
  // Create data from imported dataset
  plot.updateData = function(dataset) {
    if (arguments.length) dataIn = dataset;
    // Extract (1-dimensional) data from dataset 
    values = dataIn.map(function(d, i) {
                    return getValue.call(dataIn, d, i);
                  }).filter(function(d) {
                    return (!isNaN(d));
                  });
    
    console.log("Density data len:", dataIn.length, values.length);
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
    
    main.attr("transform", _do("translate",  
        !(flipAxis && orientation === "vertical") ? margin.left : margin.right,
        !(flipAxis && orientation === "horizontal") ? margin.top : margin.bottom));
    
    width = (plotWidth - margin.left - margin.right);
    height = (plotHeight - margin.top - margin.bottom);
    
    var xmin = (orientation === "vertical") ? .1 * width : 0;
    var ymin = (orientation === "horizontal") ? .1 * height : 0;
    
    xScale.range(
        // Unless vertical and flipped
        !(flipAxis && orientation === "vertical") ? [xmin, width] : [width, xmin]);
      // Make yScale slightly smaller to allow for line to not get cut off
    yScale.range(
        !(flipAxis && orientation === "horizontal") ? [height, ymin] : [ymin, height]);
    
    xAxis.scale(xScale)
        .orient((!flipAxis || orientation === "vertical") ? "bottom" : "top");
    yAxis.scale(yScale)
        .orient((!flipAxis || orientation === "horizontal") ? "left" : "right");
    
    // Unless flipping and horizontal
    xAxisg.attr("transform", _do("translate",
                0, // 0 width
                (flipAxis && orientation === "horizontal") ? 0 : height // vert.
            ));
    
    // ...if flipping and vertical
    yAxisg.attr("transform", _do("translate",
              (flipAxis && orientation === "vertical") ? width : 0, // horiz.
              0)); // 0 height
    
    plot.updateAxes();
    
    path.datum(data);
    plot.updateLine();
    
    highlightAreaPath.datum(data);
    highlightLinePath.datum(data);
    highlightClipPathRect.attr("y", 0).attr("x", 0)
          .attr("height", height)
          .attr("width", width);
    
    if (orientation === "horizontal") {
      brush.x(xScale)
            .extent(d3.extent(data, value));
    } else {
      brush.y(yScale)
            .extent(d3.extent(data, value));
    }
    brush.on("brushstart", brushStart)
        .on("brush", brushMove)
        .on("brushend", brushEnd);
            
    brushg.call(brush);
    
    if (orientation === "horizontal") {
      brushg.selectAll("rect")
          .attr("height", height);
      brushHandle.outerRadius(height / 8)
        .startAngle(0)
        .endAngle(function (d, i) { return i ? -Math.PI : Math.PI; });
        
      brushg.selectAll(".resize").append("path")
        .attr("d", brushHandle)
        .attr("transform", _do("translate", 0, height / 2))
        .attr("style", "cursor: ew-resize;");
        
    } else {
      brushg.selectAll("rect")
          .attr("width", width);
      brushHandle.outerRadius(width / 8)
          .startAngle(Math.PI / 2)
          .endAngle(function(d, i) {
            return i ? 3/2 * Math.PI : -Math.PI / 2; });
      brushg.selectAll(".resize").append("path")
        .attr("d", brushHandle)
        .attr("transform", _do("translate", width / 2, 0))
        .attr("style", "cursor: ns-resize;");
    }
   
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
      xScale.domain(
        d3.extent(data, (orientation === "horizontal") ? value : densityValue))
           ;//.nice();
      main.select(".x-axis")
          .classed("hidden", (showAxes.indexOf("x") === -1))
          .call(xAxis);
      xAxisg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom * .8)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(axisLabelText);
      main.select(".x-axis").selectAll(".tick").selectAll("text")
        .each(function(text, axis, i) {
          //console.log(arguments, this);
          console.log(text, ":", this.offsetWidth);
        });
    }
    
    // Update y-axis
    if (axes.indexOf("y") !== -1) {
      yScale.domain(
        d3.extent(data, (orientation === "horizontal") ? densityValue : value))
            ;//.nice();
      main.select(".y-axis")
        .classed("hidden", (showAxes.indexOf("y") === -1))
        .call(yAxis);
    }
    
    return plot;
  };
  
  // (Re)draw background density line
  plot.updateLine = function() {
    //console.log("xscale", xScale.range(), xScale.domain());
    //console.log("yscale", yScale.range(), yScale.domain());
    if (orientation === "horizontal")
      line.x(function(d) { return xScale(value(d)); })
          .y(function(d) { return yScale(densityValue(d)); });
    else
      line.x(function(d) { return xScale(densityValue(d)); })
          .y(function(d) { return yScale(value(d)); });
    path.attr("d", line);
    
    return plot;
  };
  
  // (Re)draw highlighted portion of density distribution
  plot.updateHighlight = function() {
    
    if (orientation === "horizontal") {
      highlightArea.x(function(d) { return xScale(value(d)); })
                 .y0(flipAxis ? 0 : height)
                 .y1(function(d) { return yScale(densityValue(d)); });
                 
      highlightLine.x(function(d) { return xScale(value(d)); })
                 .y(function(d) { return yScale(densityValue(d)); });
    } else {
      highlightArea.y(function(d) { return yScale(value(d)); })
                 .x0(flipAxis ? width : 0)
                 .x1(function(d) { return xScale(densityValue(d)); });
                 
      highlightLine.x(function(d) { return xScale(densityValue(d)); })
                 .y(function(d) { return yScale(value(d)); });
    }
    
    
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

  plot.getValue = function(_) {
    if (!arguments.length) return getValue;
    getValue = _;
    return plot;
  }
  
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
  plot.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    if (typeof update === "undefined" || update) plot.updatePlot();
    return plot;
  };
  
  plot.plotContainer = function(_) {
    if (!arguments.length) return plotContainer;
  };
  
  plot.showAxes = function(_) {
    if (!arguments.length) return showAxes;
    showAxes = _;
    if (plotCreated) plot.updatePlot();
    return plot;
  };
  plot.flipAxis = function(_) {
    if (!arguments.length) return flipAxis;
    flipAxis = _;
    if (plotCreated) plot.updatePlot();
    return plot;
  };
  plot.orientation = function(_) {
    if (!arguments.length) return orientation;
    orientation = _;
    brush = d3.svg.brush();
    if (plotCreated) plot.updatePlot();
    return plot;
  }
  
  
  
  plot.xScale = function() {
    return xScale;
  }
  plot.brush = function() {
    return brush;
  }
  
  return plot;
}