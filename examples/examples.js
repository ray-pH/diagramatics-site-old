/* This file is generated by examples_to_jsfile.py */
/* Do not edit this file */
/* Edit the files in ./examples/ instead */
/* The format of the file is as follows:
/* // Comment line 1
/* // Comment line ...
/* ////
/* <Code>
*/

export let examples = [];
examples.push({name : 'Rectangles.js', comments : ['The Rectangle'], code : "let big_rect   = square(150).fill('orange');\nlet small_rect = square(20).fill('blue').rotate(Math.PI/4);\nlet r1 = small_rect.position(big_rect.get_anchor('top-left'));\nlet r2 = small_rect.position(big_rect.get_anchor('top-right'));\nlet r3 = small_rect.position(big_rect.get_anchor('bottom-left'));\nlet r4 = small_rect.position(big_rect.get_anchor('bottom-right'));\ndraw(big_rect, r1, r2, r3, r4);\n"});
examples.push({name : 'Function.js', comments : ['Plotting Function'], code : "let opt = {\n    xrange : [-1.5, 4],\n    yrange : [-1.5, 4],\n}\nlet ax = xyaxes(opt);\nlet f = x => x**2;\nlet g = x => Math.sin(x);\nlet graph_f = plotf(f, opt).stroke('red').strokewidth(2);\nlet graph_g = plotf(g, opt).stroke('blue').strokewidth(2);\ndraw(ax, graph_f, graph_g);\n"});
examples.push({name : 'DiagramaticsLogo.js', comments : ['Diagramatics Logo'], code : "// base\nlet base0 = circle(50);\nlet base1 = circle(35).translate(V2(-40,-20));\nlet base2 = circle(35).translate(V2( 40,-20));\nlet base_raw  = diagram_combine(base0, base1, base2);\n\nlet base_stroke = base_raw.stroke('black').strokewidth(4);\nlet base_fill   = base_raw.fill('white').stroke('none');\nlet base_dashed = base_raw.stroke('gray').strokewidth(2).strokedasharray([5,5]).opacity(0.5);\nlet base = diagram_combine(base_stroke, base_fill, base_dashed);\n\n// beans\nlet pivot = V2(0,0);\nlet bean0 = circle(24).scale(V2(1,1.5))\n    .move_origin('bottom-center').position().translate(V2(0,60))\n    .strokewidth(2);\nlet angle_sep = from_degree(36);\nlet bean1 = bean0.rotate(angle_sep/2*3, pivot);\nlet bean2 = bean0.rotate(angle_sep/2, pivot);\nlet bean3 = bean2.hflip();\nlet bean4 = bean1.hflip();\n\nlet bean_arc_r1 = bean0.origin.length();\nlet bean_arc1 = arc(bean_arc_r1, 3*angle_sep).rotate(angle_sep)\n    .strokedasharray([5,5]).stroke('gray').opacity(0.5).strokewidth(2);\nlet bean_arc_r2 = bean0.get_anchor('center-center').length();\nlet bean_arc2 = arc(bean_arc_r2, 3*angle_sep).rotate(angle_sep)\n    .strokedasharray([5,5]).stroke('gray').opacity(0.5).strokewidth(2);\nlet bean_line_1 = line(V2(0,0), bean2.get_anchor('center-center'));\nlet bean_line_2 = line(V2(0,0), bean3.get_anchor('center-center'));\nlet bean_lines = bean_line_1.combine(bean_line_2)\n    .strokedasharray([5,5]).stroke('gray').opacity(0.5).strokewidth(2);\n\n// accents\nlet basebg1 = base1.translate(V2(10,-5));\nlet basebg2 = base2.translate(V2(5,5));\nlet basebg  = basebg1.combine(basebg2).fill('lightblue').stroke('none');\nlet beanbg  = bean2.combine(bean3)\n    .rotate(from_degree(-4), pivot).fill('lightblue').stroke('none');\n\n\ndraw(\n    beanbg, basebg,\n    base, bean1, bean2, bean3, bean4,\n    bean_arc1, bean_arc2, bean_lines,\n);\n"});
examples.push({name : 'FreeBodyDiagram.js', comments : ['Free Body Diagram'], code : "default_diagram_style['stroke-width'] = 2;\ndefault_textdata['font-size'] = 25;\n\nlet angle = from_degree(30);\nlet horizontal = line(V2(0,0), V2(8,0))\n    .stroke('gray').strokedasharray([5,5]);\nlet plane = line(V2(0,0), Vdir(angle).scale(10)).stroke('gray');\n\nlet sq = square(4).move_origin('bottom-center')\n    .position(plane.parametric_point(0.5)).rotate(angle)\n    .fill('lightblue').stroke('none');\nlet csq = sq.get_anchor('center-center');\n\nlet arrow_head_size = 0.12;\n\n\nlet vx = V2(1,0); let vy = V2(0,1); let vnx = V2(-1,0); let vny = V2(0,-1);\nlet forces_annotation = diagram_combine(\n    annotation_vector(vny.scale(3.5), 'Mg', V2(0.6,0.2), arrow_head_size)\n        .position(csq),\n    annotation_vector(Vdir(angle + Math.PI/2).scale(5), 'N', V2(0.6,0.2), arrow_head_size)\n        .position(plane.parametric_point(0.6)),\n    annotation_vector(Vdir(angle).scale(1.2), 'f', V2(0.0,-0.6), arrow_head_size)\n        .position(plane.parametric_point(0.6)),\n    annotation_vector(Vdir(angle).scale(2), 'F', V2(-0.5,-1.0), arrow_head_size)\n        .move_origin(Vdir(angle).scale(2)).position(sq.parametric_point(0.5,0)),\n);\nlet angle_annotation = annotation_angle([V2(1,0), V2(0,0), Vdir(angle)], '\\\\theta', 1, V2(0.5,0.1));\n\ndraw (horizontal, sq, plane, forces_annotation, angle_annotation);\n"});
