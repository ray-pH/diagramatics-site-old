#!/bin/sh

set -xe

bun build ./_highlighter.js --outdir ../guides/lib
mv ../guides/lib/_highlighter.js ../guides/lib/highlighter.js

cp ../node_modules/highlight.js/styles/lightfair.css ../guides/lib
bun build ../node_modules/diagramatics/dist/index.js --outdir ../lib
mv ../lib/index.js ../lib/diagramatics.js
cp ../node_modules/diagramatics/css/diagramatics.css ../lib/diagramatics.css

python3 ./staticsite_builder.py
