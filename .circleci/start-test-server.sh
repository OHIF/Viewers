cd "$(dirname "$0")"

yarn -v
node -v

echo 'Spinning up test DICOMWeb Server'

git clone git://github.com/ohif/viewer-testdata ./test-server/

cd test-server/dcm

# Setup Python client
apt-get -y install python2.7 python-pip
pip install dicomweb-client

python seed-db.py
