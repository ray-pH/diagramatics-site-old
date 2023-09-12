import { square, draw_to_svg, diagram_combine } from '../node_modules/diagramatics/dist/index.js'
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

console.log(handle_editor);
handle_editor((doc) => {
    console.log(doc.toString());
    eval_diagram(doc.toString());
});
