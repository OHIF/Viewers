/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path =
  'd:\\Essential-Logic\\EL-ohif-viewers\\node_modules\\dicom-microscopy-viewer\\src\\viewer.js';
let content = fs.readFileSync(path, 'utf8');

const target = `    const uid = feature.getId()
    if (uid) {
      return new ROI({ scoord3d, properties, uid })
    }`;

const replacement = `    let uid = feature.getId();
    if (!uid) {
      uid = 'generated-' + Math.random().toString(36).substr(2, 9);
    }
    return new ROI({ scoord3d, properties, uid });`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully patched viewer.js');
} else {
  console.error('Target string not found in viewer.js');

  // This is getting complicated to match exactly with whitespace issues.
  // Let's try a regex approach if exact match fails.
  const regex =
    /const\s+uid\s*=\s*feature\.getId\(\)\s*if\s*\(uid\)\s*\{\s*return\s*new\s*ROI\(\{\s*scoord3d,\s*properties,\s*uid\s*\}\)\s*\}/;
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully patched viewer.js using regex');
  } else {
    console.error('Target regex not found either.');
    process.exit(1);
  }
}
