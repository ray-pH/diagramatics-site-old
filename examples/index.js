import * as diagramatics from './lib/diagramatics.js'
Object.entries(diagramatics).forEach(([name, exported]) => window[name] = exported);
import { hljs } from './lib/highlighter.js'
import { examples } from './examples.js'

let containerdiv = document.getElementById('example-container');
// ex : { name : .. , comment : .. , code : .. }
for (let ex in examples) {
    // <div class="example">
    //     <div class="example-diagram">
    //         <svg class="svg-diagram"> ... </svg>
    //         <div class="control-container">  </div>
    //     </div>
    //     <div class="example-code-container"> 
    //         <span class="example-title"> ... </span>
    //         <div class="example-code-bg"> 
    //             <div class="example-code"> 
    //                 ... 
    //             </div>
    //         </div>
    //     </div>
    // </div>
    let div = document.createElement('div');
    div.classList.add('example');

    // diagram
    let diagramdiv = document.createElement('div');
    diagramdiv.classList.add('example-diagram');
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // set width and height to 400px x 300px
    // svg.setAttribute('width', '400');
    // svg.setAttribute('height', '300');
    svg.classList.add('svg-diagram');

    let controlcontainer = document.createElement('div');
    controlcontainer.classList.add('control-container');

    diagramdiv.appendChild(svg);
    diagramdiv.appendChild(controlcontainer);

    // code
    let codecontainerdiv = document.createElement('div');
    codecontainerdiv.classList.add('example-code-container');

    let title = document.createElement('span');
    title.classList.add('example-title');
    title.innerHTML = examples[ex].comments[0];

    let codedivbg = document.createElement('div');
    codedivbg.classList.add('example-code-bg');
    let codediv = document.createElement('div');
    codediv.classList.add('example-code');
    codediv.classList.add('hljs');
    codediv.classList.add('javascript');

    codediv.innerHTML = '<pre>' + hljs.highlight(examples[ex].code, { language: 'javascript' }).value + '</pre>';
    codedivbg.appendChild(codediv);
    codecontainerdiv.appendChild(title);
    codecontainerdiv.appendChild(codedivbg);

    // outer
    div.appendChild(diagramdiv);
    div.appendChild(codecontainerdiv);
    containerdiv.appendChild(div);
    
    draw_code(svg, controlcontainer, examples[ex].code);

    // add horizontal line
    let hr = document.createElement('hr');
    containerdiv.appendChild(hr);
}

function draw_code(svgelem, controlelem, code){

    let draw = (...diagrams) => {
        svgelem.innerHTML = '';
        draw_to_svg(svgelem, diagram_combine(...diagrams));
    };

    let int = new Interactive(controlelem);
    eval(code);

    // is this how do you delete a variable? is this even necessary?
    // not sure how GC works in JS
    // TODO : learn more about JS GC
    if (Object.keys(int.inp_variables).length == 0) {
        int = undefined;
        // delete controlelem if it's empty
        controlelem.outerHTML = '';
    }

    // reset default styles
    for (let s in default_diagram_style) 
        default_diagram_style[s] = _init_default_diagram_style[s];
    for (let s in default_text_diagram_style)
        default_text_diagram_style[s] = _init_default_text_diagram_style[s];
    for (let s in default_textdata)
        default_textdata[s] = _init_default_textdata[s];

}
