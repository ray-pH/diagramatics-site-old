#!/bin/sh

set -xe
bun build ./editor.js --outdir ./lib
bun build ../node_modules/diagramatics/dist/index.js --outdir ./lib
mv ./lib/index.js ./lib/diagramatics.js
