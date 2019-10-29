cd "$(dirname "$0")"

yarn -v
node -v

echo 'Spinning up test DICOMWeb Server'

git clone git://github.com/ohif/viewer-testdata ./test-server/

cd test-server

set -x
docker-compose build
docker-compose up -d
docker run --network container:contacts appropriate/curl --retry 10 --retry-delay 1 --retry-connrefused http://localhost:5985
