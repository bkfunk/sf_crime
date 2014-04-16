function multiMap() {
  var margin = { top: 10, right: 10, bottom: 10, left: 10 },
      plotWidth = 500,
      plotHeight = 500;
  
  var projection,
      colorScale,
      svg;
      
  function map(selection) {
    projection = d3.geo.mercator()
                        .translate([plotWidth/2, plotHeight/2])
                        .center([-122.4391, 37.7631])
                        .scale(155000);
    colorScale = d3.scale.quantize()
                    .range(colorbrewer.Greens[9])
                    .domain([0,1]);
    
    var path = d3.geo.path().projection(projection);
    
    selection.each(function(data) {
      console.log("map data:", data);
      
      svg = d3.select(this).selectAll("svg")
                .data([data])
              .enter()
                .append("svg")
                  .attr("width", plotWidth)
                  .attr("height", plotHeight)
                  .append("g")
                    .attr("transform", _do("translate", margin.left, margin.top));
      svg.selectAll(".tract")
            .data(data.features)
          .enter()
            .append("path")
            .attr("class", "tract")
            .attr("d", path)
            .style({"fill": colorScale(1),
                   "stroke": "black"});
    });
  }
  
  return map;
}