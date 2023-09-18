import * as diagramatics from './lib/diagramatics.js'
Object.entries(diagramatics).forEach(([name, exported]) => window[name] = exported);

let svgelem = document.getElementById("svg");
let draw = (...diagrams) => {
    svgelem.innerHTML = '';
    draw_to_svg(svgelem, diagram_combine(...diagrams));
};
let controldiv = document.getElementById("control-container");
let int = new Interactive(controldiv);

function readTitleFromURL() {
    let queryString = window.location.search;
    let urlParams   = new URLSearchParams(queryString);
    let urlTitle = urlParams.get('title');
    if (urlTitle == null) return;
    try {
        let parseTitle = encoding.decode(urlTitle);
        document.title = parseTitle;
    } catch(e) {
        console.log(e);
    }

}
function readCodeFromURL() {
    let queryString = window.location.search;
    let urlParams   = new URLSearchParams(queryString);
    let urlCode = urlParams.get('code');
    if (urlCode == null) return false;

    try{
        let parsedCode = encoding.decode(urlCode)
        eval(parsedCode);
    } catch(e){ 
        controldiv.innerHTML = "Error: " + e;
        console.log(e);
        return false; 
    }
    return true;
}

readTitleFromURL();
readCodeFromURL();
