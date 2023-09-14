import * as diagramatics from './lib/diagramatics.js'
Object.entries(diagramatics).forEach(([name, exported]) => window[name] = exported);
import { handle_editor } from './lib/editor.js'

let svgelem = document.getElementById("svg");
let draw = (...diagrams) => {
    svgelem.innerHTML = '';
    draw_to_svg(svgelem, diagram_combine(...diagrams));
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
let sq2 = square(10).fill('lightblue');
draw(sq1, sq2);`

handle_editor((doc) => {
    console.log(doc.toString());
    eval_diagram(doc.toString());
}, initial_str);
eval_diagram(initial_str);
