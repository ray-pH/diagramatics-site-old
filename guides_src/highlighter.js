import hljscore from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';

// theme was imported as css
// <link href="./lib/lightfair.css" rel="stylesheet">
hljscore.registerLanguage('javascript', javascript);
export let hljs = hljscore;
