function twoway() {
  var margin = {top: 20, right: 10, bottom: 40, left: 40},
      plotWidth = 500, // total width of the plot, including margins
      plotHeight = 500, // total height of the plot, including margins
      width, height,
      wScale = 1, hScale = 1;
      
  var xScale = d3.scale.linear(),
      yScale = d3.scale.linear(),
      xAxis = d3.svg.axis(),
      yAxis = d3.svg.axis(),
      xAxisg, yAxisg,
      showAxes = "x";
      
  var xValue = function(d) { return d.x; },
      yValue = function(d) { return d.y; },
      idValue = function(d) { return d.id; },
      data = function(dataset) { return dataset.data; };
      
  var getValue,
      plotCreated = false;;
      
  // Main components    
  var svg, // SVG container
      plotContainer, // container group for plot (for custom transformations)
      main; // Main container (translated by margins)
  
  /* Constructor */
  var plot = function(selection) {
    selection.each(function(dataset) {
      parentId = this.id;
      //plot.updateData(dataset);
      
      d3.select(this).selectAll("svg")
          .data([dataset]).enter()
            .call(createPlot);
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
    
    plotCreated = true;
  }
  
  plot.updatePlot = function() {
    svg.attr("width", wScale * plotWidth)
        .attr("height", hScale * plotHeight);
    
    main.attr("transform", _do("translate", margin.left, margin.top));
    
    width = (plotWidth - margin.left - margin.right);
    height = (plotHeight - margin.top - margin.bottom);
    
    xScale.range([0, width]);
      // Make yScale slightly smaller to allow for line to not get cut off
    yScale.range([height, 0]);
    
    xAxis.scale(xScale);
    yAxis.scale(yScale);
    xAxisg.attr("transform", _do("translate", 0, height));
    
    //plot.updateAxes();
  };
  /*
  plot.updateAxes = function(axes, domain) {
    // pass "x", "y" or "xy" for axes
    // pass domain object with array with min/max in x or y
    if (arguments.length == 0) {
      axes = "xy"; // if no argument, update all
    }
    if (arguments.length < 2) {
      // if no domain given
      domain = {
        x: d3.extent(svg.data()[0], xValue),
        y: d3.extent(svg.data()[0], yValue)
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
/*
  plot.updateData = function(dataset) {
    if (arguments.length) dataIn = dataset;
    data = dataIn.data.map(function(d, i) {
          return { x: xValue.call(dataset, d, i),
                  y: yValue.call(dataset, d, i),
                   id: idValue.call(dataset, d, i) };
        });
    
    return plot;
  };
  
  plot.updateData = function(dataset) {
    if (arguments.length) dataIn = dataset;
    // Extract (1-dimensional) data from dataset 
    values = dataIn.data.map(function(d, i) {
                    return getValue.call(dataIn, d, i);
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
*/
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
      else svg.attr("height", plotWidth);
    }
    return plot;
  };
  
  plot.data = function(_) {
    if (!arguments.length) return data;
    data = _;
    return plot;
  }
  
  
  return plot;
}