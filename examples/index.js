import { 
    Diagram, polygon, line, curve, empty, text, diagram_combine,
    Vector2, V2, Vdir, from_degree, linspace, 
    draw_to_svg,
    default_diagram_style, default_text_diagram_style, default_textdata,
    rectangle, square, regular_polygon, circle, arc,
    arrow, arrow2, textvar,
    str_to_mathematical_italic,
    Interactive,
    axes_transform, ax, axes_empty, 
    xtickmark_empty, xtickmark, xticks,
    ytickmark_empty, ytickmark, yticks,
    xyaxes, xygrid,
    plot, plotv, plotf, under_curvef,
    annotation_vector, annotation_vector_text, annotation_angle,
    inclined_plane,
} from './lib/diagramatics.js'
import { hljs } from './lib/highlighter.js'
import { examples } from './examples.js'

let containerdiv = document.getElementById('example-container');
// ex : { name : .. , comment : .. , code : .. }
for (let ex in examples) {
    // <div class="example">
    //     <div class="example-diagram">
    //         <svg class="svg-diagram"> ... </svg>
    //     </div>
    //     <div class="example-code"> 
    //         ... 
    //     </div>
    // </div>
    let div = document.createElement('div');
    div.classList.add('example');

    let diagramdiv = document.createElement('div');
    diagramdiv.classList.add('example-diagram');
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('svg-diagram');
    diagramdiv.appendChild(svg);

    let codediv = document.createElement('div');
    codediv.classList.add('example-code');
    codediv.classList.add('hljs');
    codediv.classList.add('javascript');

    codediv.innerHTML = '<pre>' + hljs.highlight(examples[ex].code, { language: 'javascript' }).value + '</pre>';

    div.appendChild(diagramdiv);
    div.appendChild(codediv);
    containerdiv.appendChild(div);
    
    draw_code(svg, examples[ex].code);
}

function draw_code(svgelem, code){
    let draw = (...diagrams) => {
        svgelem.innerHTML = '';
        draw_to_svg(svgelem, diagram_combine(...diagrams));
    };
    eval(code);
}
