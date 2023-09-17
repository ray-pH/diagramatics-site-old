set -xe

cd ./editor/
bash ./build.sh
cd ..

cd ./examples/
bash ./build.sh
cd ..
