import hljscore from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';

hljscore.registerLanguage('javascript', javascript);
export let hljs = hljscore;
