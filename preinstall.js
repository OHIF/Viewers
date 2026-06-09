console.log('preinstall.js');

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const log = (err, stdout, stderr) => console.log(stdout);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (GITHUB_TOKEN) {
  const command = `git config --global url."https://${GITHUB_TOKEN}:x-oauth-basic@github.com/".insteadOf ssh://git@github.com/`;
  console.log(command);
  exec(command, log);
} else {
  console.log('No GITHUB_TOKEN found, skipping private repo customization');
}

const agentsPath = path.join(__dirname, 'AGENTS.md');
const claudePath = path.join(__dirname, 'CLAUDE.md');

try {
  if (fs.existsSync(agentsPath)) {
    try {
      fs.unlinkSync(claudePath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
    fs.symlinkSync('AGENTS.md', claudePath);
    console.log('Linked CLAUDE.md -> AGENTS.md');
  }
} catch (err) {
  console.log(`Skipped CLAUDE.md symlink: ${err.message}`);
}
