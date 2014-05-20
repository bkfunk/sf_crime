function Tooltip() {
  
  var tooltip, tooltipBody;
  var direction = "e";
  
  function tt(selection) {
    tooltip = selection.append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("z-index", "10")
                .style("visibility", "hidden");
    tooltipBody = tooltip.append("div")
                            .attr("class", "tooltip-body");
  }
  
  function getBoundsAndDirection(triggerNode, dir) {
    var bbox = getOffsetRect(triggerNode);
    var width = tooltip.property("clientWidth"),
        height = tooltip.property("clientHeight");
    
    // If there's a clippath, we want to set that as the boundary of our scene
    var clippath = d3.select(triggerNode.ownerSVGElement)
                  .select(".clip-path")
                  .node();
    // Otherwise, it's the SVG element
    var scene = (clippath) ? getOffsetRect(clippath) :
                              getOffsetRect(triggerNode.ownerSVGElement);

    // reset bounding box if out of scene
    var inScene = true;
    if (bbox.left < scene.left) {
      inScene = false;
      bbox.left = scene.left;
    } else if (bbox.left > scene.left + scene.width) {
      inScene = false;
      bbox.left = scene.left + scene.width;
    }
    if (bbox.top < scene.top) {
      inScene = false;
      bbox.top = scene.top;
    } else if (bbox.top > scene.top + scene.height) {
      inScene = false;
      bbox.top = scene.top + scene.height;
    }

    var left, top;
    var horizontal, vertical;
    
    var e_left = bbox.left + bbox.width;
    var w_left = bbox.left - width;
    var c_left = bbox.left + (bbox.width - width)/2;
    
    if ((dir.indexOf("e") !== -1 &&
            e_left + width <= scene.left + scene.width) ||
        (dir.indexOf("w") !== -1 && w_left < scene.left)) { // EAST
      // If EAST and left of right edge
      // or WEST and left of left edge (out of bounds)
      // then EAST
      
      horizontal = "east";
      left = e_left;
      
    } else if ((dir.indexOf("w") !== -1 && w_left >= scene.left) ||
               (dir.indexOf("e") !== -1 &&
                  e_left + width > scene.left + scene.width)) { // WEST
      // If WEST and right of left edge
      // or EAST and right of right edge (out of bounds)
      // then WEST
      
      horizontal = "west";
      left = w_left;
      
    } else { // CENTER
      if (c_left + width > scene.left + scene.width) { // too far right
        horizontal = "west";
        left = w_left;
      } else if (c_left < scene.left) { // too far left
        horizontal = "east";
        left = e_left;
      } else {
        horizontal = "h-center";
        left = c_left;
      }
    }
    
    var n_top = bbox.top - height;
    var s_top = bbox.top + bbox.height;
    var c_top = bbox.top + (bbox.height - height)/2;

    if ((dir.indexOf("n") !== -1 && n_top >= scene.top) ||
        (dir.indexOf("s") !== -1 &&
            s_top + height > scene.top + scene.height)) {
      // If NORTH and below top
      // or SOUTH and below bottom (out of bounds)
      // then: NORTH
      
      vertical = "north";
      top = n_top;
      
    } else if ((dir.indexOf("s") !== -1 &&
                    s_top + heigth <= scene.top + scene.height) ||
               (dir.indexOf("n") !== -1 && n_top < scene.top)) {
      // If SOUTH and above bottom
      // or NORTH and above top (out of bounds)
      // then: SOURTH
      
      vertical = "south";
      top = s_top;
      
    } else { // CENTER
      if (c_top < scene.top) { // too far up
        vertical = "south";
        top = s_top;
      } else if (c_top + height > scene.top + scene.height) {  // too far down
        vertical = "north"
        top = n_top;
      } else {
        vertical = "v-center";
        top = c_top;
      }
    }
    
    
    return {top: top, left: left, vertical: vertical, horizontal: horizontal, inScene: inScene};
  }
  
  function resetStyle() {
    tooltip.classed("east", false)
            .classed("west", false)
            .classed("h-center", false)
            .classed("south", false)
            .classed("north", false)
            .classed("v-center", false);  
  }
  
  tt.show = function(triggerNode, contents, dir) {
    
    dir = dir || direction;
    
    bounds = getBoundsAndDirection(triggerNode, dir);
    
    //console.log(scene);
    //console.log("Top:", bounds.top, "Left:", bounds.left);
    //console.log("Vertical: ", bounds.vertical, "Horizontal: ", bounds.horizontal);
    
    //resetStyle();
    tooltip.classed(bounds.horizontal, true)
            .classed(bounds.vertical, true)
            .classed("off-screen", !bounds.inScene)
            .style("left", bounds.left + "px")
            .style("top", bounds.top + "px")
            .style("visibility", "visible");
    
    var html = "<ul class='tooltip-list'>";
    
    
    //var item;
    //var piece;
    for (var i=0; i < contents.length; i++) {
      html += "<li>";
      var item = contents[i];
      for (var j=0; j < item.length; j++) {
        var piece = item[j];
        for (key in piece) {
          html += "<span class='" + key + "'>" + piece[key] + "</span>";
        }
      }
      html += "</li>";
    }
    /*
    _.each(contents, function(item) {
      _.each(item, function(piece) {
        var pair = _.pairs(piece);
        html += "<span class='" + pair[0] + "'>" + pair[1] + "</span>";
      });
    });*/
    /*while (typeof (item = contents.shift()) !== undefined) {
      while (typeof (piece = item.shift()) !== undefined) {
        console.log(piece);
      }
    }*/
    html += "</ul>";
    //console.log(tooltipBody);
    tooltipBody.html(html);
    
    return tt;
  };
  
  tt.hide = function() {
    resetStyle();
    tooltip.style("visibility", "hidden");
  }
  
  tt.direction = function(_) {
    if (!arguments.length) return direction;
    direction = _;
    return tt;
  };
  
  
  return tt;
}