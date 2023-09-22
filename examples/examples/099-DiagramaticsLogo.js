// Diagramatics Logo
////
// base
let base0 = circle(50);
let base1 = circle(35).translate(V2(-40,-20));
let base2 = circle(35).translate(V2( 40,-20));
let base_raw  = diagram_combine(base0, base1, base2);

let base_stroke = base_raw.stroke('black').strokewidth(4);
let base_fill   = base_raw.fill('white').stroke('none');
let base_dashed = base_raw.stroke('gray').strokewidth(2).strokedasharray([5,5]).opacity(0.5);
let base = diagram_combine(base_stroke, base_fill, base_dashed);

// beans
let pivot = V2(0,0);
let bean0 = circle(24).scale(V2(1,1.5))
    .move_origin('bottom-center').position().translate(V2(0,60))
    .strokewidth(2);
let angle_sep = from_degree(36);
let bean1 = bean0.rotate(angle_sep/2*3, pivot);
let bean2 = bean0.rotate(angle_sep/2, pivot);
let bean3 = bean2.hflip(0);
let bean4 = bean1.hflip(0);

let bean_arc_r1 = bean0.origin.length();
let bean_arc1 = arc(bean_arc_r1, 3*angle_sep).rotate(angle_sep)
    .strokedasharray([5,5]).stroke('gray').opacity(0.5).strokewidth(2);
let bean_arc_r2 = bean0.get_anchor('center-center').length();
let bean_arc2 = arc(bean_arc_r2, 3*angle_sep).rotate(angle_sep)
    .strokedasharray([5,5]).stroke('gray').opacity(0.5).strokewidth(2);
let bean_line_1 = line(V2(0,0), bean2.get_anchor('center-center'));
let bean_line_2 = line(V2(0,0), bean3.get_anchor('center-center'));
let bean_lines = bean_line_1.combine(bean_line_2)
    .strokedasharray([5,5]).stroke('gray').opacity(0.5).strokewidth(2);

// accents
let basebg1 = base1.translate(V2(10,-5));
let basebg2 = base2.translate(V2(5,5));
let basebg  = basebg1.combine(basebg2).fill('lightblue').stroke('none');
let beanbg  = bean2.combine(bean3)
    .rotate(from_degree(-4), pivot).fill('lightblue').stroke('none');


draw(
    beanbg, basebg,
    base, bean1, bean2, bean3, bean4,
    bean_arc1, bean_arc2, bean_lines,
);
