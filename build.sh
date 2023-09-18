set -xe

cd ./editor/
bash ./build.sh
cd ..

cd ./examples/
bash ./build.sh
cd ..

cd ./preview/
bash ./build.sh
cd ..
