function multiMap() {
  var margin = { top: 10, right: 10, bottom: 10, left: 10 },
      plotWidth = 500,
      plotHeight = 500;
  
  var projection,
      colorScale,
      svg,
      features;
      
  var featureArray = function(data) {
    return data.index.map(function(d) {
      return data[d];
    })
  };
  var field = function() { return "hh_size"; };
  var value = function(d) {
    if (typeof d.data === "undefined") return null;
    return (d.data.hasOwnProperty(field())) ? +d.data[field()] : null;
  };
  
  function map(selection) {
    projection = d3.geo.mercator()
                        .translate([plotWidth/2, plotHeight/2])
                        .center([-122.4391, 37.7631])
                        .scale(155000);
    colorScale = d3.scale.quantize()
                      .range(colorbrewer.Greens[9])
    
    var path = d3.geo.path().projection(projection);
    
    selection.each(function(data) {
      features = featureArray(data);
      console.log("Data", features.map(value));//.map(value));
      colorScale.domain(d3.extent(features.map(value)));
      
      
      
      console.log("map data:", data);
      
      svg = d3.select(this).selectAll("svg")
                .data([data])
              .enter()
                .append("svg")
                  .attr("width", plotWidth)
                  .attr("height", plotHeight)
                  .append("g")
                    .attr("transform", _do("translate", margin.left, margin.top));
      //svg.append("path").attr("class", "tract");
      svg.selectAll(".tract")
            .data(featureArray)
          .enter()
            .append("path")
            .attr("class", function(d) {
              return "tract tract-" + d.id;
            })
            .attr("d", path)
            .style("fill", function(d, i) {
              //console.log("fill", d, i);
              return colorScale(value(d));
            })
            .style({
                   "stroke": "black"})
            .on("mouseover", function(d,i) { console.log(arguments);
                console.log(data.index[i]); });
    });
  }
  
  return map;
}