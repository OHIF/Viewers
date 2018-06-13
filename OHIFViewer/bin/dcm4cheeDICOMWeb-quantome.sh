echo "Starting Meteor server..."
METEOR_PACKAGE_DIRS="../Packages" meteor npm install
METEOR_PACKAGE_DIRS="../Packages" meteor --settings ../config/dcm4cheeDICOMWeb-quantome.org.json
