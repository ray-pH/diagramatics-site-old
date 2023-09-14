// /home/ray/Code/diagramatics/dist/linear_algebra.js
function from_degree(angle) {
  return angle * Math.PI / 180;
}
function V2(x, y) {
  return new Vector2(x, y);
}
function Vdir(angle) {
  return new Vector2(Math.cos(angle), Math.sin(angle));
}
function linspace(start, end, n = 100) {
  let result = [];
  let step = (end - start) / (n - 1);
  for (let i = 0;i < n; i++) {
    result.push(start + step * i);
  }
  return result;
}

class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }
  sub(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }
  scale(s) {
    return new Vector2(this.x * s, this.y * s);
  }
  mul(v) {
    return new Vector2(this.x * v.x, this.y * v.y);
  }
  rotate(angle) {
    let x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
    let y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
    return new Vector2(x, y);
  }
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
  cross(v) {
    return this.x * v.y - this.y * v.x;
  }
  equals(v) {
    return this.x == v.x && this.y == v.y;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  angle() {
    return Math.atan2(this.y, this.x);
  }
  normalize() {
    let len = this.length();
    return new Vector2(this.x / len, this.y / len);
  }
}

// /home/ray/Code/diagramatics/dist/diagram.js
var assert = function(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
};
var anchor_to_textdata = function(anchor) {
  switch (anchor) {
    case Anchor.TopLeft:
      return { "text-anchor": "start", "dominant-baseline": "text-before-edge" };
    case Anchor.TopCenter:
      return { "text-anchor": "middle", "dominant-baseline": "text-before-edge" };
    case Anchor.TopRight:
      return { "text-anchor": "end", "dominant-baseline": "text-before-edge" };
    case Anchor.CenterLeft:
      return { "text-anchor": "start", "dominant-baseline": "middle" };
    case Anchor.CenterCenter:
      return { "text-anchor": "middle", "dominant-baseline": "middle" };
    case Anchor.CenterRight:
      return { "text-anchor": "end", "dominant-baseline": "middle" };
    case Anchor.BottomLeft:
      return { "text-anchor": "start", "dominant-baseline": "text-after-edge" };
    case Anchor.BottomCenter:
      return { "text-anchor": "middle", "dominant-baseline": "text-after-edge" };
    case Anchor.BottomRight:
      return { "text-anchor": "end", "dominant-baseline": "text-after-edge" };
    default:
      throw new Error("Unknown anchor " + anchor);
  }
};
function diagram_combine(...diagrams) {
  let newdiagrams = diagrams.map((d) => d.copy());
  return new Diagram(DiagramType.Diagram, { children: newdiagrams });
}
function line(start, end) {
  let path = new Path([start, end]);
  let line2 = new Diagram(DiagramType.Curve, { path });
  return line2;
}
function curve(points) {
  let path = new Path(points);
  let curve2 = new Diagram(DiagramType.Curve, { path });
  return curve2;
}
function polygon(points) {
  assert(points.length >= 3, "Polygon must have at least 3 points");
  let path = new Path(points);
  let polygon2 = new Diagram(DiagramType.Polygon, { path });
  return polygon2;
}
function empty(v) {
  let emp = new Diagram(DiagramType.Empty, { path: new Path([v]) });
  return emp;
}
function text(str) {
  let dtext = new Diagram(DiagramType.Text, {
    textdata: { text: str },
    path: new Path([new Vector2(0, 0)])
  });
  return dtext;
}
var DiagramType;
(function(DiagramType2) {
  DiagramType2["Polygon"] = "polygon";
  DiagramType2["Curve"] = "curve";
  DiagramType2["Empty"] = "empty";
  DiagramType2["Text"] = "text";
  DiagramType2["Diagram"] = "diagram";
})(DiagramType || (DiagramType = {}));
var Anchor;
(function(Anchor2) {
  Anchor2["TopLeft"] = "top-left";
  Anchor2["TopCenter"] = "top-center";
  Anchor2["TopRight"] = "top-right";
  Anchor2["CenterLeft"] = "center-left";
  Anchor2["CenterCenter"] = "center-center";
  Anchor2["CenterRight"] = "center-right";
  Anchor2["BottomLeft"] = "bottom-left";
  Anchor2["BottomCenter"] = "bottom-center";
  Anchor2["BottomRight"] = "bottom-right";
})(Anchor || (Anchor = {}));

class Diagram {
  constructor(type_, args = {}) {
    this.children = [];
    this.path = undefined;
    this.origin = new Vector2(0, 0);
    this.style = {};
    this.textdata = {};
    this.type = type_;
    this.path = args.path;
    if (args.children) {
      this.children = args.children;
    }
    if (args.textdata) {
      this.textdata = args.textdata;
    }
  }
  copy() {
    let newd = JSON.parse(JSON.stringify(this));
    Object.setPrototypeOf(newd, Diagram.prototype);
    newd.origin = Object.setPrototypeOf(newd.origin, Vector2.prototype);
    for (let c in newd.children) {
      Object.setPrototypeOf(newd.children[c], Diagram.prototype);
      newd.children[c] = newd.children[c].copy();
    }
    if (newd.path != null) {
      Object.setPrototypeOf(newd.path, Path.prototype);
      newd.path = newd.path.copy();
    }
    return newd;
  }
  combine(...diagrams) {
    return diagram_combine(this, ...diagrams);
  }
  to_curve() {
    let newd = this.copy();
    if (newd.type == DiagramType.Polygon) {
      newd.type = DiagramType.Curve;
    } else if (newd.type == DiagramType.Diagram) {
      newd.children = newd.children.map((c) => c.to_curve());
    }
    return newd;
  }
  to_polygon() {
    let newd = this.copy();
    if (newd.type == DiagramType.Curve) {
      newd.type = DiagramType.Polygon;
    } else if (newd.type == DiagramType.Diagram) {
      newd.children = newd.children.map((c) => c.to_polygon());
    }
    return newd;
  }
  add_points(points) {
    let newd = this.copy();
    if (newd.type == DiagramType.Polygon || newd.type == DiagramType.Curve) {
      if (newd.path == undefined) {
        throw new Error(this.type + " must have a path");
      }
      newd.path = newd.path.add_points(points);
    } else if (newd.type == DiagramType.Diagram) {
      let last_child = newd.children[newd.children.length - 1];
      newd.children[newd.children.length - 1] = last_child.add_points(points);
    }
    return newd;
  }
  update_style(stylename, stylevalue) {
    let newd = this.copy();
    if (newd.type == DiagramType.Polygon || newd.type == DiagramType.Curve || newd.type == DiagramType.Text) {
      newd.style[stylename] = stylevalue;
    } else if (newd.type == DiagramType.Diagram) {
      newd.children = newd.children.map((c) => c.update_style(stylename, stylevalue));
    } else if (newd.type == DiagramType.Empty) {
    } else {
      throw new Error("Unreachable, unknown diagram type : " + newd.type);
    }
    return newd;
  }
  fill(color) {
    return this.update_style("fill", color);
  }
  stroke(color) {
    return this.update_style("stroke", color);
  }
  opacity(opacity) {
    return this.update_style("opacity", opacity.toString());
  }
  strokewidth(width) {
    return this.update_style("stroke-width", width.toString());
  }
  strokelinecap(linecap) {
    return this.update_style("stroke-linecap", linecap);
  }
  strokejoin(linejoin) {
    return this.update_style("stroke-linejoin", linejoin);
  }
  strokedasharray(dasharray) {
    return this.update_style("stroke-dasharray", dasharray.join(","));
  }
  vectoreffect(vectoreffect) {
    return this.update_style("vector-effect", vectoreffect);
  }
  update_textdata(textdataname, textdatavalue) {
    let newd = this.copy();
    if (newd.type == DiagramType.Text) {
      newd.textdata[textdataname] = textdatavalue;
    } else if (newd.type == DiagramType.Diagram) {
      newd.children = newd.children.map((c) => c.update_textdata(textdataname, textdatavalue));
    } else if (newd.type == DiagramType.Polygon || newd.type == DiagramType.Curve || newd.type == DiagramType.Empty) {
    } else {
      throw new Error("Unreachable, unknown diagram type : " + newd.type);
    }
    return newd;
  }
  fontfamily(fontfamily) {
    return this.update_textdata("font-family", fontfamily);
  }
  fontsize(fontsize) {
    return this.update_textdata("font-size", fontsize.toString());
  }
  fontweight(fontweight) {
    return this.update_textdata("font-weight", fontweight.toString());
  }
  textanchor(textanchor) {
    return this.update_textdata("text-anchor", textanchor);
  }
  dominantbaseline(dominantbaseline) {
    return this.update_textdata("dominant-baseline", dominantbaseline);
  }
  bounding_box() {
    let minx = Infinity, miny = Infinity;
    let maxx = (-Infinity), maxy = (-Infinity);
    if (this.type == DiagramType.Diagram) {
      for (let c in this.children) {
        let child = this.children[c];
        let [min, max] = child.bounding_box();
        minx = Math.min(minx, min.x);
        miny = Math.min(miny, min.y);
        maxx = Math.max(maxx, max.x);
        maxy = Math.max(maxy, max.y);
      }
      return [new Vector2(minx, miny), new Vector2(maxx, maxy)];
    } else if (this.type == DiagramType.Curve || this.type == DiagramType.Polygon || this.type == DiagramType.Empty) {
      if (this.path == undefined) {
        throw new Error(this.type + " must have a path");
      }
      for (let point of this.path.points) {
        minx = Math.min(minx, point.x);
        miny = Math.min(miny, point.y);
        maxx = Math.max(maxx, point.x);
        maxy = Math.max(maxy, point.y);
      }
      return [new Vector2(minx, miny), new Vector2(maxx, maxy)];
    } else {
      throw new Error("Unreachable, unknown diagram type : " + this.type);
    }
  }
  transform(transform_function) {
    let newd = this.copy();
    newd.children = newd.children.map((c) => c.transform(transform_function));
    if (newd.path != null)
      newd.path = newd.path.transform(transform_function);
    return newd;
  }
  translate(v) {
    let newd = this.copy();
    newd.origin = newd.origin.add(v);
    for (let c in newd.children) {
      newd.children[c] = newd.children[c].translate(v);
    }
    if (newd.path != null)
      newd.path = newd.path.translate(v);
    return newd;
  }
  position(v = new Vector2(0, 0)) {
    let dv = v.sub(this.origin);
    let newd = this.translate(dv);
    return newd;
  }
  rotate(angle, pivot = undefined) {
    let newd = this.copy();
    if (pivot == undefined) {
      pivot = newd.origin;
    }
    for (let c in newd.children) {
      newd.children[c] = newd.children[c].rotate(angle, pivot);
    }
    if (newd.path != null)
      newd.path = newd.path.rotate(angle, pivot);
    return newd;
  }
  scale(scale, origin) {
    let newd = this.copy();
    if (origin == undefined) {
      origin = newd.origin;
    }
    newd.children = newd.children.map((c) => c.scale(scale, origin));
    if (newd.path != null)
      newd.path = newd.path.scale(scale, origin);
    return newd;
  }
  reflect_over_point(p) {
    let newd = this.copy();
    newd.children = newd.children.map((c) => c.reflect_over_point(p));
    if (newd.path != null)
      newd.path = newd.path.reflect_over_point(p);
    return newd;
  }
  reflect_over_line(p1, p2) {
    let newd = this.copy();
    newd.children = newd.children.map((c) => c.reflect_over_line(p1, p2));
    if (newd.path != null)
      newd.path = newd.path.reflect_over_line(p1, p2);
    return newd;
  }
  reflect(p1, p2) {
    if (p1 == undefined && p2 == undefined) {
      return this.reflect_over_point(new Vector2(0, 0));
    } else if (p1 != null && p2 == undefined) {
      return this.reflect_over_point(p1);
    } else if (p1 != null && p2 != null) {
      return this.reflect_over_line(p1, p2);
    } else {
      throw new Error("Unreachable");
    }
  }
  vflip(a = 0) {
    return this.reflect(new Vector2(0, a), new Vector2(1, a));
  }
  hflip(a = 0) {
    return this.reflect(new Vector2(a, 0), new Vector2(a, 1));
  }
  get_anchor(anchor) {
    let [min, max] = this.bounding_box();
    let { x: minx, y: miny } = min;
    let { x: maxx, y: maxy } = max;
    let midx = (minx + maxx) / 2;
    let midy = (miny + maxy) / 2;
    switch (anchor) {
      case Anchor.TopLeft:
        return new Vector2(minx, maxy);
      case Anchor.TopCenter:
        return new Vector2(midx, maxy);
      case Anchor.TopRight:
        return new Vector2(maxx, maxy);
      case Anchor.CenterLeft:
        return new Vector2(minx, midy);
      case Anchor.CenterCenter:
        return new Vector2(midx, midy);
      case Anchor.CenterRight:
        return new Vector2(maxx, midy);
      case Anchor.BottomLeft:
        return new Vector2(minx, miny);
      case Anchor.BottomCenter:
        return new Vector2(midx, miny);
      case Anchor.BottomRight:
        return new Vector2(maxx, miny);
      default:
        throw new Error("Unknown anchor " + anchor);
    }
  }
  move_origin(pos) {
    let newd = this.copy();
    if (pos instanceof Vector2) {
      newd.origin = pos;
    } else {
      newd.origin = newd.get_anchor(pos);
    }
    return newd;
  }
  __move_origin_text(anchor) {
    let newd = this.copy();
    let textdata = anchor_to_textdata(anchor);
    newd.textdata["text-anchor"] = textdata["text-anchor"];
    newd.textdata["dominant-baseline"] = textdata["dominant-baseline"];
    return newd;
  }
  move_origin_text(anchor) {
    let newd = this.copy();
    if (this.type == DiagramType.Text) {
      newd = newd.__move_origin_text(anchor);
    } else if (this.type == DiagramType.Diagram) {
      newd.children = newd.children.map((c) => c.move_origin_text(anchor));
    } else if (this.type == DiagramType.Polygon || this.type == DiagramType.Curve || this.type == DiagramType.Empty) {
    }
    return newd;
  }
  path_length() {
    if (this.type == DiagramType.Diagram) {
      let length = 0;
      for (let c in this.children) {
        length += this.children[c].path_length();
      }
      return length;
    } else if (this.type == DiagramType.Curve || this.type == DiagramType.Polygon) {
      if (this.path == undefined) {
        throw new Error(this.type + " must have a path");
      }
      return this.path.length();
    } else if (this.type == DiagramType.Empty) {
      if (this.path == undefined) {
        throw new Error(this.type + " must have a path");
      }
      return this.path.length();
    } else {
      throw new Error("Unreachable, unknown diagram type : " + this.type);
    }
  }
  parametric_point(t, segment_index) {
    if (this.type == DiagramType.Diagram) {
      let cumuative_length = [];
      let length = 0;
      for (let c in this.children) {
        length += this.children[c].path_length();
        cumuative_length.push(length);
      }
      let total_length = length;
      let cumulative_t = cumuative_length.map((l) => l / total_length);
      for (let i = 0;i < cumulative_t.length; i++) {
        if (t < cumulative_t[i]) {
          let child_id = i;
          let prev_t = i == 0 ? 0 : cumulative_t[i - 1];
          let segment_t = (t - prev_t) / (cumulative_t[i] - prev_t);
          return this.children[child_id].parametric_point(segment_t);
        }
      }
      throw Error("Unreachable");
    } else if (this.type == DiagramType.Curve || this.type == DiagramType.Polygon) {
      if (this.path == undefined) {
        throw new Error(this.type + " must have a path");
      }
      return this.path.parametric_point(t, segment_index);
    } else if (this.type == DiagramType.Empty) {
      if (this.path == undefined) {
        throw new Error(this.type + " must have a path");
      }
      return this.path.parametric_point(t, segment_index);
    } else {
      throw new Error("Unreachable, unknown diagram type : " + this.type);
    }
  }
}

class Path {
  constructor(points) {
    this.points = points;
  }
  copy() {
    let newpoints = this.points.map((p) => new Vector2(p.x, p.y));
    return new Path(newpoints);
  }
  length() {
    let length = 0;
    console.log(this);
    for (let i = 1;i < this.points.length; i++) {
      length += this.points[i].sub(this.points[i - 1]).length();
    }
    return length;
  }
  add_points(points) {
    let newp = this.copy();
    newp.points = newp.points.concat(points);
    return newp;
  }
  parametric_point(t, segment_index) {
    if (segment_index == undefined) {
      if (t < 0 || t > 1) {
        throw Error("t must be between 0 and 1");
      }
      let cumuative_length = [];
      let length = 0;
      for (let i = 1;i < this.points.length; i++) {
        length += this.points[i].sub(this.points[i - 1]).length();
        cumuative_length.push(length);
      }
      let total_length = length;
      let cumulative_t = cumuative_length.map((l) => l / total_length);
      for (let i = 0;i < cumulative_t.length; i++) {
        if (t < cumulative_t[i]) {
          let segment_id = i;
          let prev_t = i == 0 ? 0 : cumulative_t[i - 1];
          let segment_t = (t - prev_t) / (cumulative_t[i] - prev_t);
          return this.parametric_point(segment_t, segment_id);
        }
      }
      throw Error("Unreachable");
    } else {
      if (segment_index < 0 || segment_index >= this.points.length - 1) {
        throw Error("segment_index must be between 0 and n-1");
      }
      let start = this.points[segment_index];
      let end = this.points[segment_index + 1];
      let dir = end.sub(start);
      return start.add(dir.scale(t));
    }
  }
  transform(transform_function) {
    let newp = this.copy();
    newp.points = newp.points.map((p) => transform_function(p));
    return newp;
  }
  translate(v) {
    return this.transform((p) => p.add(v));
  }
  rotate(angle, pivot) {
    return this.transform((p) => p.sub(pivot).rotate(angle).add(pivot));
  }
  scale(scale, origin) {
    return this.transform((p) => p.sub(origin).mul(scale).add(origin));
  }
  reflect_over_point(p) {
    return this.rotate(Math.PI, p);
  }
  reflect_over_line(p1, p2) {
    return this.transform((p) => {
      let v = p2.sub(p1);
      let n = v.rotate(Math.PI / 2);
      let d = n.dot(p.sub(p1));
      let q = p.sub(n.scale(2 * d));
      return q;
    });
  }
}
// /home/ray/Code/diagramatics/dist/color_palette.js
function get_color(colorname, palette) {
  if (colorname in palette) {
    return palette[colorname];
  } else {
    return colorname;
  }
}
var tab_color = {
  blue: "#1f77b4",
  lightblue: "#aec7e8",
  orange: "#ff7f0e",
  lightorange: "#ffbb78",
  green: "#2ca02c",
  lightgreen: "#98df8a",
  red: "#d62728",
  lightred: "#ff9896",
  purple: "#9467bd",
  lightpurple: "#c5b0d5",
  brown: "#8c564b",
  lightbrown: "#c49c94",
  pink: "#e377c2",
  lightpink: "#f7b6d2",
  grey: "#7f7f7f",
  lightgrey: "#c7c7c7",
  gray: "#7f7f7f",
  lightgray: "#c7c7c7",
  olive: "#bcbd22",
  lightolive: "#dbdb8d",
  cyan: "#17becf",
  lightcyan: "#9edae5"
};

// /home/ray/Code/diagramatics/dist/draw_svg.js
var draw_polygon = function(svgelement, diagram2) {
  let style = Object.assign(Object.assign({}, default_diagram_style), diagram2.style);
  style.fill = get_color(style.fill, tab_color);
  style.stroke = get_color(style.stroke, tab_color);
  let polygon2 = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  for (let stylename in style) {
    polygon2.style[stylename] = style[stylename];
  }
  svgelement.appendChild(polygon2);
  if (diagram2.path != null) {
    for (let p of diagram2.path.points) {
      var point = svgelement.createSVGPoint();
      point.x = p.x;
      point.y = -p.y;
      polygon2.points.appendItem(point);
    }
  }
};
var draw_curve = function(svgelement, diagram2) {
  let style = Object.assign(Object.assign({}, default_diagram_style), diagram2.style);
  style.fill = "none";
  style.stroke = get_color(style.stroke, tab_color);
  let polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  for (let stylename in style) {
    polyline.style[stylename] = style[stylename];
  }
  svgelement.appendChild(polyline);
  if (diagram2.path != null) {
    for (let p of diagram2.path.points) {
      var point = svgelement.createSVGPoint();
      point.x = p.x;
      point.y = -p.y;
      polyline.points.appendItem(point);
    }
  }
};
var collect_text = function(diagram2) {
  if (diagram2.type == DiagramType.Text) {
    return [diagram2];
  } else if (diagram2.type == DiagramType.Diagram) {
    let result = [];
    for (let d of diagram2.children) {
      result = result.concat(collect_text(d));
    }
    return result;
  } else {
    return [];
  }
};
var draw_text = function(svgelement, diagram2) {
  let style = Object.assign(Object.assign({}, default_text_diagram_style), diagram2.style);
  style.fill = get_color(style.fill, tab_color);
  style.stroke = get_color(style.stroke, tab_color);
  let textdata = Object.assign(Object.assign({}, default_textdata), diagram2.textdata);
  if (diagram2.path == undefined) {
    throw new Error("Text must have a path");
  }
  let text2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text2.setAttribute("x", diagram2.path.points[0].x.toString());
  text2.setAttribute("y", (-diagram2.path.points[0].y).toString());
  let bbox = svgelement.getBBox();
  let svgelement_width = svgelement.width.baseVal.value;
  let svgelement_height = svgelement.height.baseVal.value;
  let scale = Math.max(bbox.width / svgelement_width, bbox.height / svgelement_height);
  let font_size = parseFloat(textdata["font-size"]) * scale;
  text2.setAttribute("font-family", textdata["font-family"]);
  text2.setAttribute("font-size", font_size.toString());
  text2.setAttribute("font-weight", textdata["font-weight"]);
  text2.setAttribute("text-anchor", textdata["text-anchor"]);
  text2.setAttribute("dominant-baseline", textdata["dominant-baseline"]);
  for (let stylename in style) {
    text2.style[stylename] = style[stylename];
  }
  text2.innerHTML = textdata["text"];
  svgelement.appendChild(text2);
};
function draw_to_svg(svgelement, diagram2, set_html_attribute = true, render_text = true) {
  if (diagram2.type == DiagramType.Polygon) {
    draw_polygon(svgelement, diagram2);
  } else if (diagram2.type == DiagramType.Curve) {
    draw_curve(svgelement, diagram2);
  } else if (diagram2.type == DiagramType.Empty || diagram2.type == DiagramType.Text) {
  } else if (diagram2.type == DiagramType.Diagram) {
    for (let d of diagram2.children) {
      draw_to_svg(svgelement, d, false, false);
    }
  } else {
    console.warn("Unreachable, unknown diagram type : " + diagram2.type);
  }
  if (render_text) {
    let text_diagrams = collect_text(diagram2);
    for (let d of text_diagrams) {
      draw_text(svgelement, d);
    }
  }
  if (set_html_attribute) {
    let bbox = svgelement.getBBox();
    let svgelement_width = svgelement.width.baseVal.value;
    let svgelement_height = svgelement.height.baseVal.value;
    let scale = Math.max(bbox.width / svgelement_width, bbox.height / svgelement_height);
    let pad = 10 * scale;
    bbox.x -= pad;
    bbox.y -= pad;
    bbox.width += 2 * pad;
    bbox.height += 2 * pad;
    svgelement.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    svgelement.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }
}
var default_diagram_style = {
  fill: "none",
  stroke: "black",
  "stroke-width": "1",
  "stroke-linecap": "butt",
  "stroke-dasharray": "none",
  "stroke-linejoin": "round",
  "vector-effect": "non-scaling-stroke"
};
var default_text_diagram_style = {
  fill: "black",
  stroke: "none",
  "stroke-width": "1",
  "stroke-linecap": "butt",
  "stroke-dasharray": "none",
  "stroke-linejoin": "round",
  "vector-effect": "non-scaling-stroke"
};
var default_textdata = {
  text: "",
  "font-family": "Latin Modern Math, sans-serif",
  "font-size": "18",
  "font-weight": "normal",
  "text-anchor": "middle",
  "dominant-baseline": "middle"
};
// /home/ray/Code/diagramatics/dist/unicode_utils.js
function str_latex_to_unicode(str) {
  str = str + " ";
  for (let key in latex_greek) {
    str = str.replaceAll(key + " ", latex_greek[key]);
  }
  return str;
}
function str_to_mathematical_italic(str) {
  return [...str_latex_to_unicode(str)].map((c) => unicode_mathematical_italic[c] || c).join("");
}
var unicode_mathematical_italic = {
  A: "\uD835\uDC34",
  B: "\uD835\uDC35",
  C: "\uD835\uDC36",
  D: "\uD835\uDC37",
  E: "\uD835\uDC38",
  F: "\uD835\uDC39",
  G: "\uD835\uDC3A",
  H: "\uD835\uDC3B",
  I: "\uD835\uDC3C",
  J: "\uD835\uDC3D",
  K: "\uD835\uDC3E",
  L: "\uD835\uDC3F",
  M: "\uD835\uDC40",
  N: "\uD835\uDC41",
  O: "\uD835\uDC42",
  P: "\uD835\uDC43",
  Q: "\uD835\uDC44",
  R: "\uD835\uDC45",
  S: "\uD835\uDC46",
  T: "\uD835\uDC47",
  U: "\uD835\uDC48",
  V: "\uD835\uDC49",
  W: "\uD835\uDC4A",
  X: "\uD835\uDC4B",
  Y: "\uD835\uDC4C",
  Z: "\uD835\uDC4D",
  a: "\uD835\uDC4E",
  b: "\uD835\uDC4F",
  c: "\uD835\uDC50",
  d: "\uD835\uDC51",
  e: "\uD835\uDC52",
  f: "\uD835\uDC53",
  g: "\uD835\uDC54",
  h: "\u210E",
  i: "\uD835\uDC56",
  j: "\uD835\uDC57",
  k: "\uD835\uDC58",
  l: "\uD835\uDC59",
  m: "\uD835\uDC5A",
  n: "\uD835\uDC5B",
  o: "\uD835\uDC5C",
  p: "\uD835\uDC5D",
  q: "\uD835\uDC5E",
  r: "\uD835\uDC5F",
  s: "\uD835\uDC60",
  t: "\uD835\uDC61",
  u: "\uD835\uDC62",
  v: "\uD835\uDC63",
  w: "\uD835\uDC64",
  x: "\uD835\uDC65",
  y: "\uD835\uDC66",
  z: "\uD835\uDC67",
  "\u0391": "\uD835\uDEE2",
  "\u0392": "\uD835\uDEE3",
  "\u0393": "\uD835\uDEE4",
  "\u0394": "\uD835\uDEE5",
  "\u0395": "\uD835\uDEE6",
  "\u0396": "\uD835\uDEE7",
  "\u0397": "\uD835\uDEE8",
  "\u0398": "\uD835\uDEE9",
  "\u0399": "\uD835\uDEEA",
  "\u039A": "\uD835\uDEEB",
  "\u039B": "\uD835\uDEEC",
  "\u039C": "\uD835\uDEED",
  "\u039D": "\uD835\uDEEE",
  "\u039E": "\uD835\uDEEF",
  "\u039F": "\uD835\uDEF0",
  "\u03A0": "\uD835\uDEF1",
  "\u03A1": "\uD835\uDEF2",
  "\u03A3": "\uD835\uDEF4",
  "\u03A4": "\uD835\uDEF5",
  "\u03A5": "\uD835\uDEF6",
  "\u03A6": "\uD835\uDEF7",
  "\u03A7": "\uD835\uDEF8",
  "\u03A8": "\uD835\uDEF9",
  "\u03A9": "\uD835\uDEFA",
  "\u03B1": "\uD835\uDEFC",
  "\u03B2": "\uD835\uDEFD",
  "\u03B3": "\uD835\uDEFE",
  "\u03B4": "\uD835\uDEFF",
  "\u03B5": "\uD835\uDF00",
  "\u03B6": "\uD835\uDF01",
  "\u03B7": "\uD835\uDF02",
  "\u03B8": "\uD835\uDF03",
  "\u03B9": "\uD835\uDF04",
  "\u03BA": "\uD835\uDF05",
  "\u03BB": "\uD835\uDF06",
  "\u03BC": "\uD835\uDF07",
  "\u03BD": "\uD835\uDF08",
  "\u03BE": "\uD835\uDF09",
  "\u03BF": "\uD835\uDF0A",
  "\u03C0": "\uD835\uDF0B",
  "\u03C1": "\uD835\uDF0C",
  "\u03C2": "\uD835\uDF0D",
  "\u03C3": "\uD835\uDF0E",
  "\u03C4": "\uD835\uDF0F",
  "\u03C5": "\uD835\uDF10",
  "\u03C6": "\uD835\uDF11",
  "\u03C7": "\uD835\uDF12",
  "\u03C8": "\uD835\uDF13",
  "\u03C9": "\uD835\uDF14",
  "\u03D1": "\uD835\uDF17",
  "\u03F0": "\uD835\uDF18",
  "\u03D5": "\uD835\uDF19",
  "\u03F1": "\uD835\uDF1A",
  "\u03D6": "\uD835\uDF1B"
};
var latex_greek = {
  "\\alpha": "\u03B1",
  "\\beta": "\u03B2",
  "\\gamma": "\u03B3",
  "\\delta": "\u03B4",
  "\\epsilon": "\u03B5",
  "\\zeta": "\u03B6",
  "\\eta": "\u03B7",
  "\\theta": "\u03B8",
  "\\iota": "\u03B9",
  "\\kappa": "\u03BA",
  "\\lambda": "\u03BB",
  "\\mu": "\u03BC",
  "\\nu": "\u03BD",
  "\\xi": "\u03BE",
  "\\omicron": "\u03BF",
  "\\pi": "\u03C0",
  "\\rho": "\u03C1",
  "\\sigma": "\u03C3",
  "\\tau": "\u03C4",
  "\\upsilon": "\u03C5",
  "\\phi": "\u03D5",
  "\\chi": "\u03C7",
  "\\psi": "\u03C8",
  "\\omega": "\u03C9",
  "\\vartheta": "\u03D1",
  "\\varchi": "\u03F0",
  "\\varphi": "\u03C6",
  "\\varepsilon": "\u03B5",
  "\\varrho": "\u03F1",
  "\\varsigma": "\u03C2"
};

// /home/ray/Code/diagramatics/dist/shapes.js
function rectangle(width, height) {
  let points = [
    V2(-width / 2, -height / 2),
    V2(-width / 2, height / 2),
    V2(width / 2, height / 2),
    V2(width / 2, -height / 2)
  ];
  return polygon(points);
}
function square(side = 1) {
  return rectangle(side, side);
}
function regular_polygon(n, radius = 1) {
  let points = [];
  for (let i = 0;i < n; i++) {
    points.push(V2(0, radius).rotate(i * 2 * Math.PI / n));
  }
  return polygon(points);
}
function circle(radius = 1) {
  return regular_polygon(50, radius);
}
function arc(radius = 1, angle = from_degree(360)) {
  let n = 100;
  let points = [];
  for (let i = 0;i < n; i++) {
    points.push(V2(radius, 0).rotate(i * angle / (n - 1)));
  }
  return curve(points);
}
function arrow(v, headsize = 3) {
  let line_diagram = line(V2(0, 0), v);
  let raw_triangle = polygon([V2(0, 0), V2(-headsize, headsize / 2), V2(-headsize, -headsize / 2)]);
  let head_triangle = raw_triangle.rotate(v.angle()).position(v);
  return diagram_combine(line_diagram, head_triangle);
}
function arrow2(start, end, headsize = 3) {
  let line_diagram = line(start, end);
  let direction = end.sub(start);
  let raw_triangle = polygon([V2(0, 0), V2(-headsize, headsize / 2), V2(-headsize, -headsize / 2)]);
  let head_triangle = raw_triangle.rotate(direction.angle()).position(end);
  let head_triangle2 = raw_triangle.rotate(direction.angle() + Math.PI).position(start);
  return diagram_combine(line_diagram, head_triangle, head_triangle2);
}
function textvar(str) {
  return text(str_to_mathematical_italic(str));
}
// /home/ray/Code/diagramatics/dist/interactive.js
var create_slider = function(callback, min = 0, max = 100, value = 50, step) {
  let slider = document.createElement("input");
  slider.type = "range";
  slider.min = min.toString();
  slider.max = max.toString();
  slider.value = value.toString();
  slider.step = step.toString();
  slider.oninput = () => {
    let val = slider.value;
    callback(parseFloat(val));
  };
  slider.classList.add("diagramatics-slider");
  return slider;
};

class Interactive {
  constructor(container_div, inp_object_) {
    this.container_div = container_div;
    this.inp_variables = {};
    this.inp_inputs = {};
    this.draw_function = (_) => {
    };
    this.intervals = {};
    if (inp_object_ != null) {
      this.inp_variables = inp_object_;
    }
  }
  draw() {
    this.draw_function(this.inp_variables);
  }
  slider(variable_name, min = 0, max = 100, value = 50, step = -1, time = 1.5) {
    if (step == -1) {
      step = (max - min) / 100;
    }
    this.inp_variables[variable_name] = value;
    let varstyle_variable_name = str_to_mathematical_italic(variable_name);
    let labeldiv = document.createElement("div");
    labeldiv.classList.add("diagramatics-label");
    labeldiv.innerHTML = `${varstyle_variable_name} = ${value}`;
    const callback = (val) => {
      this.inp_variables[variable_name] = val;
      this.draw_function(this.inp_variables);
      labeldiv.innerHTML = `${varstyle_variable_name} = ${val}`;
    };
    let slider = create_slider(callback, min, max, value, step);
    this.inp_inputs[variable_name] = slider;
    let nstep = (max - min) / step;
    const interval_time = 1000 * time / nstep;
    let playbutton = document.createElement("button");
    playbutton.classList.add("diagramatics-slider-playbutton");
    playbutton.innerHTML = ">";
    playbutton.onclick = () => {
      if (this.intervals[variable_name] == undefined) {
        playbutton.innerHTML = "o";
        this.intervals[variable_name] = setInterval(() => {
          let val = parseFloat(slider.value);
          val += step;
          if (val > max) {
            val = min;
          }
          slider.value = val.toString();
          callback(val);
        }, interval_time);
      } else {
        playbutton.innerHTML = ">";
        clearInterval(this.intervals[variable_name]);
        this.intervals[variable_name] = undefined;
      }
    };
    let morebutton = document.createElement("button");
    morebutton.classList.add("diagramatics-slider-moreplaybutton");
    morebutton.innerHTML = "\u22EF";
    let leftcontainer = document.createElement("div");
    leftcontainer.classList.add("diagramatics-slider-leftcontainer");
    leftcontainer.appendChild(playbutton);
    leftcontainer.appendChild(document.createElement("br"));
    leftcontainer.appendChild(morebutton);
    let rightcontainer = document.createElement("div");
    rightcontainer.classList.add("diagramatics-slider-rightcontainer");
    rightcontainer.appendChild(labeldiv);
    rightcontainer.appendChild(slider);
    let container = document.createElement("div");
    container.classList.add("diagramatics-slider-container");
    container.appendChild(leftcontainer);
    container.appendChild(rightcontainer);
    this.container_div.appendChild(container);
  }
}
// /home/ray/Code/diagramatics/dist/shapes/shapes_graph.js
function axes_transform(axes_options) {
  let opt = Object.assign(Object.assign({}, default_axes_options), axes_options);
  if (opt.bbox == undefined) {
    let [xmin2, xmax2] = opt.xrange;
    let [ymin2, ymax2] = opt.yrange;
    opt.bbox = [V2(xmin2, ymin2), V2(xmax2, ymax2)];
  }
  let [lowerleft, upperright] = opt.bbox;
  let [xmin, xmax] = opt.xrange;
  let [ymin, ymax] = opt.yrange;
  return function(v) {
    let x = lowerleft.x + (v.x - xmin) / (xmax - xmin) * (upperright.x - lowerleft.x);
    let y = lowerleft.y + (v.y - ymin) / (ymax - ymin) * (upperright.y - lowerleft.y);
    return V2(x, y);
  };
}
function axes_empty(axes_options) {
  let opt = Object.assign(Object.assign({}, default_axes_options), axes_options);
  if (opt.bbox == undefined) {
    let [xmin, xmax] = opt.xrange;
    let [ymin, ymax] = opt.yrange;
    opt.bbox = [V2(xmin, ymin), V2(xmax, ymax)];
  }
  let [lowerleft, upperright] = opt.bbox;
  let xorigin = lowerleft.x + (upperright.x - lowerleft.x) / (opt.xrange[1] - opt.xrange[0]) * (0 - opt.xrange[0]);
  let yorigin = lowerleft.y + (upperright.y - lowerleft.y) / (opt.yrange[1] - opt.yrange[0]) * (0 - opt.yrange[0]);
  let xaxis = arrow2(V2(lowerleft.x, yorigin), V2(upperright.x, yorigin), 0.05);
  let yaxis = arrow2(V2(xorigin, lowerleft.y), V2(xorigin, upperright.y), 0.05);
  return diagram_combine(xaxis, yaxis).stroke("gray").fill("gray");
}
function xtickmark_empty(x, height = 0.1) {
  return line(V2(x, height / 2), V2(x, -height / 2)).stroke("gray");
}
function xtickmark(x, str, height = 0.1) {
  let tick = xtickmark_empty(x, height);
  let label = textvar(str).move_origin_text(Anchor.TopCenter).translate(tick.get_anchor(Anchor.BottomCenter)).fill("gray");
  return diagram_combine(tick, label);
}
function ytickmark_empty(y, height = 0.1) {
  return line(V2(height / 2, y), V2(-height / 2, y)).stroke("gray");
}
function ytickmark(y, str, height = 0.1) {
  let tick = ytickmark_empty(y, height);
  let label = textvar(str).move_origin_text(Anchor.CenterRight).translate(tick.get_anchor(Anchor.CenterLeft)).fill("gray");
  return diagram_combine(tick, label);
}
var get_tick_interval = function(min, max) {
  let range = max - min;
  let range_order = Math.floor(Math.log10(range));
  let interval_to_try = [0.1, 0.15, 0.2, 0.5, 1].map((x) => x * Math.pow(10, range_order));
  let tick_counts = interval_to_try.map((x) => Math.floor(range / x));
  for (let i = 0;i < tick_counts.length; i++) {
    if (tick_counts[i] <= 10) {
      return interval_to_try[i];
    }
  }
  return interval_to_try.slice(-1)[0];
};
var get_tick_numbers_range = function(min, max) {
  let interval = get_tick_interval(min, max);
  let new_min = Math.ceil(min / interval) * interval;
  let new_max = Math.floor(max / interval) * interval;
  let new_count = Math.floor((new_max - new_min) / interval);
  return linspace(new_min, new_max, new_count + 1);
};
var get_tick_numbers_aroundzero = function(neg, pos, nozero = true) {
  if (neg > 0)
    throw new Error("neg must be negative");
  if (pos < 0)
    throw new Error("pos must be positive");
  let magnitude = Math.max(-neg, pos);
  let interval = get_tick_interval(-magnitude, magnitude);
  let new_min = Math.ceil(neg / interval) * interval;
  let new_max = Math.floor(pos / interval) * interval;
  let new_count = Math.floor((new_max - new_min) / interval);
  if (nozero) {
    return linspace(new_min, new_max, new_count + 1).filter((x) => x != 0);
  } else {
    return linspace(new_min, new_max, new_count + 1);
  }
};
var get_tick_numbers = function(min, max) {
  if (min < 0 && max > 0) {
    return get_tick_numbers_aroundzero(min, max);
  } else {
    return get_tick_numbers_range(min, max);
  }
};
function xticks(axes_options) {
  let opt = Object.assign(Object.assign({}, default_axes_options), axes_options);
  if (opt.xticks == undefined) {
    opt.xticks = get_tick_numbers(opt.xrange[0], opt.xrange[1]);
  }
  opt.xticks = opt.xticks.filter((x) => x > opt.xrange[0] && x < opt.xrange[1]);
  let xticks_diagrams = opt.xticks.map((x) => xtickmark(x, x.toString()));
  return diagram_combine(...xticks_diagrams).transform(axes_transform(opt));
}
function yticks(axes_options) {
  let opt = Object.assign(Object.assign({}, default_axes_options), axes_options);
  if (opt.yticks == undefined) {
    opt.yticks = get_tick_numbers(opt.yrange[0], opt.yrange[1]);
  }
  opt.yticks = opt.yticks.filter((y) => y > opt.yrange[0] && y < opt.yrange[1]);
  let yticks_diagrams = opt.yticks.map((y) => ytickmark(y, y.toString()));
  return diagram_combine(...yticks_diagrams).transform(axes_transform(opt));
}
function xyaxes(axes_options) {
  let opt = Object.assign(Object.assign({}, default_axes_options), axes_options);
  return diagram_combine(axes_empty(opt), xticks(opt), yticks(opt));
}
function xygrid(axes_options) {
  let opt = Object.assign(Object.assign({}, default_axes_options), axes_options);
  if (opt.xticks == undefined) {
    opt.xticks = get_tick_numbers(opt.xrange[0], opt.xrange[1]);
  }
  if (opt.yticks == undefined) {
    opt.yticks = get_tick_numbers(opt.yrange[0], opt.yrange[1]);
  }
  let xgrid_diagrams = opt.xticks.map((x) => line(V2(x, opt.yrange[0]), V2(x, opt.yrange[1])).transform(axes_transform(opt)).stroke("gray"));
  let ygrid_diagrams = opt.yticks.map((y) => line(V2(opt.xrange[0], y), V2(opt.xrange[1], y)).transform(axes_transform(opt)).stroke("gray"));
  return diagram_combine(...xgrid_diagrams, ...ygrid_diagrams);
}
function plotv(data, axes_options) {
  let opt = Object.assign(Object.assign({}, default_axes_options), axes_options);
  let [xmin, xmax] = opt.xrange;
  let [ymin, ymax] = opt.yrange;
  let segments = [];
  let current_segment = [];
  for (let i = 0;i < data.length; i++) {
    let p = data[i];
    let is_inside = p.x >= xmin && p.x <= xmax && p.y >= ymin && p.y <= ymax;
    if (!is_inside) {
      if (current_segment.length > 1)
        segments.push(current_segment);
      current_segment = [];
    } else {
      current_segment.push(p);
    }
  }
  if (current_segment.length > 1)
    segments.push(current_segment);
  let d;
  let path_diagrams = segments.map((segment) => curve(segment));
  if (path_diagrams.length == 1) {
    d = path_diagrams[0];
  } else {
    d = diagram_combine(...path_diagrams).stroke("black").fill("none");
  }
  return d.transform(axes_transform(opt));
}
function plot(xdata, ydata, axes_options) {
  if (xdata.length != ydata.length)
    throw new Error("xdata and ydata must have the same length");
  let vdata = xdata.map((x, i) => V2(x, ydata[i]));
  return plotv(vdata, axes_options);
}
function plotf(f, axes_options) {
  let opt = Object.assign(Object.assign({}, default_axes_options), axes_options);
  let xdata = linspace(...opt.xrange, opt.n);
  let vdata = xdata.map((x) => V2(x, f(x)));
  return plotv(vdata, axes_options);
}
function under_curvef(f, x_start, x_end, axes_options) {
  let opt = Object.assign(Object.assign({}, default_axes_options), axes_options);
  let new_opt = Object.assign({}, opt);
  new_opt.xrange = [x_start, x_end];
  new_opt.bbox = undefined;
  let fplot = plotf(f, new_opt);
  let area_under = fplot.add_points([V2(x_end, 0), V2(x_start, 0)]).to_polygon();
  return area_under.transform(axes_transform(opt));
}
var default_axes_options = {
  bbox: undefined,
  xrange: [-2, 2],
  yrange: [-2, 2],
  xticks: undefined,
  yticks: undefined,
  n: 100
};
var ax = axes_transform;
// /home/ray/Code/diagramatics/dist/shapes/shapes_annotation.js
function annotation_vector(v, str, text_offset, arrow_head_size) {
  if (text_offset == undefined) {
    text_offset = V2(0, 0);
  }
  let vec = arrow(v, arrow_head_size);
  if (str == "" || str == undefined) {
    return vec;
  }
  let txt = textvar(str).position(v.add(text_offset));
  return diagram_combine(vec, txt);
}
function annotation_vector_text(v, str, text_offset, arrow_head_size) {
  if (text_offset == undefined) {
    text_offset = V2(0, 0);
  }
  let vec = arrow(v, arrow_head_size);
  if (str == "" || str == undefined) {
    return vec;
  }
  let txt = text(str).position(v.add(text_offset));
  return diagram_combine(vec, txt);
}
function annotation_angle(p, str, radius = 1, text_offset) {
  if (text_offset == undefined) {
    text_offset = V2(0, 0);
  }
  let [p1, p2, p3] = p;
  let va = p1.sub(p2);
  let vb = p3.sub(p2);
  let angle_a = va.angle();
  let angle_b = vb.angle();
  let angle_arc = arc(radius, angle_b - angle_a).rotate(angle_a);
  if (str == "" || str == undefined) {
    return angle_arc;
  }
  let angle_text = textvar(str_to_mathematical_italic(str)).position(Vdir((angle_a + angle_b) / 2)).translate(text_offset);
  return diagram_combine(angle_arc, angle_text);
}
// /home/ray/Code/diagramatics/dist/shapes/shapes_mechanics.js
function inclined_plane(length, angle) {
  return polygon([V2(0, 0), V2(length, length * Math.tan(angle)), V2(length, 0)]);
}
export {
  yticks,
  ytickmark_empty,
  ytickmark,
  xygrid,
  xyaxes,
  xticks,
  xtickmark_empty,
  xtickmark,
  under_curvef,
  textvar,
  text,
  str_to_mathematical_italic,
  str_latex_to_unicode,
  square,
  regular_polygon,
  rectangle,
  polygon,
  plotv,
  plotf,
  plot,
  linspace,
  line,
  inclined_plane,
  from_degree,
  empty,
  draw_to_svg,
  diagram_combine,
  default_textdata,
  default_text_diagram_style,
  default_diagram_style,
  curve,
  circle,
  axes_transform,
  axes_empty,
  ax,
  arrow2,
  arrow,
  arc,
  annotation_vector_text,
  annotation_vector,
  annotation_angle,
  Vector2,
  Vdir,
  V2,
  Interactive,
  Diagram
};
