// Free Body Diagram
////
default_diagram_style['stroke-width'] = 2;
default_textdata['font-size'] = 25;

let angle = from_degree(30);
let horizontal = line(V2(0,0), V2(8,0))
    .stroke('gray').strokedasharray([5,5]);
let plane = line(V2(0,0), Vdir(angle).scale(10)).stroke('gray');

let sq = square(4).move_origin('bottom-center')
    .position(plane.parametric_point(0.5)).rotate(angle)
    .fill('lightblue').stroke('none');
let csq = sq.get_anchor('center-center');

let arrow_head_size = 0.12;


let vx = V2(1,0); let vy = V2(0,1); let vnx = V2(-1,0); let vny = V2(0,-1);
let forces_annotation = diagram_combine(
    annotation_vector(vny.scale(3.5), 'Mg', V2(0.6,0.2), arrow_head_size)
        .position(csq),
    annotation_vector(Vdir(angle + Math.PI/2).scale(5), 'N', V2(0.6,0.2), arrow_head_size)
        .position(plane.parametric_point(0.6)),
    annotation_vector(Vdir(angle).scale(1.2), 'f', V2(0.0,-0.6), arrow_head_size)
        .position(plane.parametric_point(0.6)),
    annotation_vector(Vdir(angle).scale(2), 'F', V2(-0.5,-1.0), arrow_head_size)
        .move_origin(Vdir(angle).scale(2)).position(sq.parametric_point(0.5,0)),
);
let angle_annotation = annotation_angle([V2(1,0), V2(0,0), Vdir(angle)], '\\theta', 1, V2(0.5,0.1));

draw (horizontal, sq, plane, forces_annotation, angle_annotation);
