import * as diagramatics from './lib/diagramatics.js'
Object.entries(diagramatics).forEach(([name, exported]) => window[name] = exported);
import { handle_editor } from './lib/editor.js'

let svgelem = document.getElementById("svg");
let draw = (...diagrams) => {
    svgelem.innerHTML = '';
    draw_to_svg(svgelem, diagram_combine(...diagrams));
};
let controldiv = document.getElementById("control-container");
let int = new Interactive(controldiv);

let inputstr=`
let sq = square(20);
draw(sq, square(10));
`

let prev_str = "";
let editor_footer_info = document.getElementById("editor-footer-info");
let editor_footer_desc = document.getElementById("editor-footer-desc");
let typing_timeout = undefined;

function eval_diagram(str){
    let success = true;
    controldiv.innerHTML = '';
    try {
        eval(str);
    }catch(e){
        // wait first to see if user is still typing
        // if user is still typing, then don't show error
        success = false;
        editor_footer_info.className = "waiting";
        editor_footer_info.innerHTML = "...";
        if (typing_timeout) clearTimeout(typing_timeout);
        typing_timeout = setTimeout(() => {
            wait_typing_show_error(e)
        }, 500);
    }finally{
        localStorage.setItem('editorCode', str);
        if(success){
            prev_str = str;
            editor_footer_info.className = "success";
            editor_footer_info.innerHTML = "success";
            editor_footer_desc.innerHTML = "";
            if (typing_timeout) clearTimeout(typing_timeout);
            typing_timeout = undefined;
        }
    }
}

// waiting for user to stop typing, then show if there is an error
function wait_typing_show_error(e){
    editor_footer_info.className = "error";
    editor_footer_info.innerHTML = "error";
    let error_message = e.toString();
    let error_position = parse_error_position(e);

    editor_footer_desc.innerHTML = `${error_message} at ${error_position}`;

    if (typing_timeout) clearTimeout(typing_timeout);
    typing_timeout = undefined;
}

// get error position from error.stack
function parse_error_position(e){
    try{
        // e.stack :
        //    ReferenceError: s is not defined
        //    at eval (eval at eval_diagram (index.js:24:9), <anonymous>:3:16)
        //    at eval_diagram (index.js:24:9)
        //    at index.js:66:5
        //    at editor.js:21674:7
        // get second line of e.stack
        let line1 = e.stack.split('\n')[1];
        // line1:
        //    at eval (eval at eval_diagram (index.js:24:9), <anonymous>:3:16)
        // get the part after <anonymous> and also remove the last ')'
        let pos = line1.split('<anonymous>:')[1].slice(0, -1);
        return pos
    }catch (err) {
        return 'unknown location'
    }
}



let initial_str =
`let sq1 = square(20);
let sq2 = square(10).fill('lightblue');
draw(sq1, sq2);`

function load_editor_code(){
    let code = localStorage.getItem('editorCode');
    return code ? code : initial_str;
}
handle_editor(
    (doc) => {
        // console.log(doc.toString());
        eval_diagram(doc.toString());
    }, 
    load_editor_code()
);

eval_diagram(load_editor_code());
