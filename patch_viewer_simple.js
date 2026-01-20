/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path =
  'd:\\Essential-Logic\\EL-ohif-viewers\\node_modules\\dicom-microscopy-viewer\\src\\viewer.js';
let content = fs.readFileSync(path, 'utf8');

// I need to match what is currently in the file (my previous patch)
// Previous patch:
//     let uid = feature.getId();
//     if (!uid) {
//       uid = 'generated-' + Math.random().toString(36).substr(2, 9);
//     }
//     return new ROI({ scoord3d, properties, uid });

// I'll try to match the previous patch first.
const previousPatchRegex =
  /let\s+uid\s*=\s*feature\.getId\(\);\s*if\s*\(!uid\)\s*\{\s*uid\s*=\s*'generated-'.*?\}\s*return\s*new\s*ROI\(\{\s*scoord3d,\s*properties,\s*uid\s*\}\);/s;

const simplifiedReplacement = `    const uid = feature.getId() || 'generated-' + Date.now();
    return new ROI({ scoord3d, properties, uid });`;

if (previousPatchRegex.test(content)) {
  content = content.replace(previousPatchRegex, simplifiedReplacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully applied simplified patch over previous patch');
} else {
  // Maybe the previous patch didn't work or I am matching wrong.
  // Try to match the original code again (in case I reverted or it failed).
  const originalRegex =
    /const\s+uid\s*=\s*feature\.getId\(\)\s*if\s*\(uid\)\s*\{\s*return\s*new\s*ROI\(\{\s*scoord3d,\s*properties,\s*uid\s*\}\)\s*\}/s;
  if (originalRegex.test(content)) {
    content = content.replace(originalRegex, simplifiedReplacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully applied simplified patch over original code');
  } else {
    console.error('Could not find target code to patch');
    // Print the area to debug
    const match = content.match(/feature\.getId\(\)/);
    if (match) {
      const start = Math.max(0, match.index - 50);
      const end = Math.min(content.length, match.index + 200);
      console.log('Context around feature.getId():');
      console.log(content.substring(start, end));
    }
    process.exit(1);
  }
}
