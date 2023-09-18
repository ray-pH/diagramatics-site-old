// Area Under Curve
////
let opt = {
    xrange : [-2, 2],
    yrange : [-1, 2],
}
let axes = axes_empty(opt);
let f = x => Math.cos(x);
let graph_f = plotf(f, opt).stroke('blue').strokewidth(3);

let a = -0.5;
let b = 1.0;

let under_f = under_curvef(f, a, b, opt).fill('blue').opacity(0.5).stroke('none');
let pa = circle(0.05).position(V2(a, f(a)))
  .fill('blue').stroke('none');
let pb = circle(0.05).position(V2(b, f(b)))
.fill('blue').stroke('none');

let ticka = xtickmark(a, 'a');
let tickb = xtickmark(b, 'b');
let labela = textvar('f(a)').move_origin_text('bottom-right').position(V2(a, f(a)));
let labelb = textvar('f(b)').move_origin_text('bottom-left').position(V2(b, f(b)));

let labels = labela.combine(labelb).translate(V2(0, 0.1)).fill('blue');
let texts = diagram_combine(ticka, tickb, labels, pa, pb);

draw(axes, under_f, graph_f, texts);
