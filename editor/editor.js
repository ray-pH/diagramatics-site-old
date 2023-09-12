import {EditorView, basicSetup} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"

export function handle_editor(func){
    let editor = new EditorView({
        extensions: [
            basicSetup, 
            javascript(),
            EditorView.updateListener.of((v) => {
                if (v.docChanged) {
                    func(v.state.doc)
                }
            }) 
        ],
        parent: document.getElementById("editor")
    })
}
