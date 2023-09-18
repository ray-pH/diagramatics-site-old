// Plotting Function
////
let opt = {
    xrange : [-1.5, 4],
    yrange : [-1.5, 4],
}
let ax = xyaxes(opt);
let f = x => x**2;
let g = x => Math.sin(x);
let graph_f = plotf(f, opt).stroke('red').strokewidth(2);
let graph_g = plotf(g, opt).stroke('blue').strokewidth(2);
draw(ax, graph_f, graph_g);
