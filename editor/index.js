import { 
    Diagram, polygon, line, curve, empty, text, diagram_combine,
    Vector2, V2, Vdir, from_degree, linspace, 
    draw_to_svg,
    rectangle, square, regular_polygon, circle, arrow, arrow2, textvar,
    str_to_mathematical_italic,
    Interactive,
    axes_transform, ax, axes_empty, 
    xtickmark_empty, xtickmark, xticks,
    ytickmark_empty, ytickmark, yticks,
    xyaxes, xygrid,
    plot, plotv, plotf, under_curvef,
    inclined_plane,
} from '../node_modules/diagramatics/dist/index.js'
import { handle_editor } from './build/editor.js'

let svgelem = document.getElementById("svg");
let draw = (...diagrams) => {
    svgelem.innerHTML = '';
    draw_to_svg(svgelem, diagram_combine(diagrams));
};

let inputstr=`
let sq = square(20);
draw(sq, square(10));
`

var prev_str = "";
function eval_diagram(str){
    try {
        eval(str);
        prev_str = str;
    }catch(e){
        console.log(e);
        eval(prev_str);
    }finally{
    }
}

let initial_str =
`let sq1 = square(20);
let sq2 = square(10).fill('red');
draw(sq1, sq2);`

handle_editor((doc) => {
    console.log(doc.toString());
    eval_diagram(doc.toString());
}, initial_str);
