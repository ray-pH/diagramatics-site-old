import {basicSetup} from "codemirror"
import {espresso} from 'thememirror';
import {EditorView, keymap} from "@codemirror/view"
import {indentWithTab} from "@codemirror/commands"
import {javascript} from "@codemirror/lang-javascript"

function extension_update_listener(func) { 
    return EditorView.updateListener.of( (v) => {
        if (v.docChanged) func(v.state.doc)
    });
}

let extension_fixed_height = EditorView.theme({
    "&": {
        height: "300px",
        borderRadius: "15px",
    },
    "&.cm-editor.cm-focused": {
        outline: "none"
    },
    ".cm-scroller": {overflow: "auto"}
})

export function handle_editor(func, initial_doc){
    let editor = new EditorView({
        doc: initial_doc,
        extensions: [
            basicSetup, 
            javascript(),
            espresso,
            keymap.of([indentWithTab]),
            extension_update_listener(func),
            extension_fixed_height,
        ],
        parent: document.getElementById("editor")
    })
}
