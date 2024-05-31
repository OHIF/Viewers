console.log('postinstall.js');

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const log = (err, stdout, stderr) => console.log(stdout);

if (!fs.existsSync(path.resolve(__dirname, './node_modules/dicom-microscopy-viewer'))) {
  console.log("Extracting dicom-microscopy-viewer");
  const command = `tar -zxvf externals/external-dicom-microscopy-viewer/dicom-microscopy-viewer-0.46.1.tgz --transform s,package,dicom-microscopy-viewer, -C node_modules`
  console.log(command);
  exec(command, log);
} else {
  console.log("Dicom microscopy viewer already exists.");
}
