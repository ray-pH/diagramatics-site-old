#!/bin/sh

set -xe
python3 ./examples_to_jsfile.py
bun build ./highlighter.js --outdir ./lib
cp ../node_modules/highlight.js/styles/lightfair.css ./lib
bun build ../node_modules/diagramatics/dist/index.js --outdir ./lib
mv ./lib/index.js ./lib/diagramatics.js
cp ../node_modules/diagramatics/css/diagramatics.css ./lib/diagramatics.css
