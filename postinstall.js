console.log('postinstall.js');

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const log = (err, stdout, stderr) => console.log(stdout);

// This is a temporary work around for bugs in yarn/netlify that don't
// allow for tarballs to be included.  Should be removed once the
// dicom-microscopy-viewer is released.
if (!fs.existsSync(path.resolve(__dirname, './node_modules/dicom-microscopy-viewer'))) {
  console.log("Extracting dicom-microscopy-viewer");
  const command = `tar -zxvf externals/dicom-microscopy-viewer/dicom-microscopy-viewer-0.46.1.tgz --transform s,package,dicom-microscopy-viewer, -C node_modules`
  console.log(command);
  exec(command, log);
} else {
  console.log("Dicom microscopy viewer already exists.");
}
