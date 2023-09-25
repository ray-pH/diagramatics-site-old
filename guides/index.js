import * as diagramatics from '../lib/diagramatics.js'
Object.entries(diagramatics).forEach(([name, exported]) => window[name] = exported);
import { hljs } from './lib/highlighter.js'

function navigation_handle(){
    let nav_divs = document.getElementsByClassName('navigation');
    if (nav_divs.length == 0) return;
    let nav_div = nav_divs[0];

    // for each <a> inside nav_div, add class 'current-page' if href matches current page
    let links = nav_div.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) {
        if (links[i].href == window.location.href) {
            links[i].classList.add('current-page');
        }
    }
}

function left_trim_block(block){
    let lines = block.split('\n');
    // if the first line is empty, remove it
    if (lines[0] == '') lines.shift();
    // count indent of first line
    let indent = 0;
    for (let i = 0; i < lines[0].length; i++) {
        if (lines[0][i] == ' ') indent++;
        else break;
    }
    // remove indent from all lines
    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].substring(indent);
    }
    return lines.join('\n');
}

function eval_diagramatics(diagramatics_div){
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
    let code_str  = left_trim_block(diagramatics_div.innerHTML);
    // convert html entities to characters
    code_str = code_str.replace(/&lt;/g, '<');
    code_str = code_str.replace(/&gt;/g, '>');
    code_str = code_str.replace(/&amp;/g, '&');
    code_str = code_str.replace(/&quot;/g, '"');
    code_str = code_str.replace(/&apos;/g, "'");
    code_str = code_str.replace(/&nbsp;/g, ' ');

    let title_str = diagramatics_div.getAttribute('title');
    let subtitle_str = diagramatics_div.getAttribute('subtitle');
    diagramatics_div.innerHTML = '';
    // add class visible
    diagramatics_div.classList.add('visible');

    // ============================================

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
    let title;
    let subtitle;
    if (title_str != null) {
        title = document.createElement('span');
        title.classList.add('example-title');
        title.innerHTML = title_str;
    }
    if (subtitle_str != null) {
        subtitle = document.createElement('span');
        subtitle.classList.add('example-subtitle');
        subtitle.innerHTML = subtitle_str;
    }
    
    let codecontainerdiv = document.createElement('div');
    codecontainerdiv.classList.add('example-code-container');

    let codedivbg = document.createElement('div');
    codedivbg.classList.add('example-code-bg');
    let codediv = document.createElement('div');
    codediv.classList.add('example-code');
    codediv.classList.add('hljs');
    codediv.classList.add('javascript');

    codediv.innerHTML = '<pre>' + hljs.highlight(code_str, { language: 'javascript' }).value + '</pre>';
    codedivbg.appendChild(codediv);
    if (title_str != null) {
        codecontainerdiv.appendChild(title);
    }
    if (subtitle_str != null) {
        codecontainerdiv.appendChild(subtitle);
    }
    codecontainerdiv.appendChild(codedivbg);

    // outer
    div.appendChild(diagramdiv);
    div.appendChild(codecontainerdiv);
    diagramatics_div.appendChild(div);
    
    draw_code(svg, controlcontainer, code_str);
}

function draw_code(svgelem, controlelem, code){

    let draw = (...diagrams) => {
        svgelem.innerHTML = '';
        draw_to_svg(svgelem, diagram_combine(...diagrams));
    };

    let int = new Interactive(controlelem);
    try {
        eval(code);
    } catch (e) {
        svgelem.outerHTML = e.toString();
        console.warn(e);
    }

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


function parse_diagram_divs(){
    let diagram_divs = document.getElementsByClassName("diagramatics");
    // run eval_diagramatics() for all diagram_div
    for (let i = 0; i < diagram_divs.length; i++) {
        eval_diagramatics(diagram_divs[i]);
    }
}

navigation_handle();
parse_diagram_divs();
