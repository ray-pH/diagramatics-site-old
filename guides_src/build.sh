#!/bin/sh

set -xe

bun build ./highlighter.js --outdir ../guides/lib

cp ../node_modules/highlight.js/styles/lightfair.css ../guides/lib
bun build ../node_modules/diagramatics/dist/index.js --outdir ../lib
mv ../lib/index.js ../lib/diagramatics.js
cp ../node_modules/diagramatics/css/diagramatics.css ../lib/diagramatics.css

cp ./index.js ../guides/
cp ./style.css ../guides/

python3 ./staticsite_builder.py
