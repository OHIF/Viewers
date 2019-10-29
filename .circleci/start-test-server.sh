cd "$(dirname "$0")"

yarn -v
node -v

echo 'Spinning up test DICOMWeb Server'

git clone git://github.com/ohif/viewer-testdata ./test-server/

cd test-server

docker-compose build
docker-compose up
