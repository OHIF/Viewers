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

// Mirror every skill under .agents/skills/ into .claude/skills/
try {
  const agentsSkillsDir = path.join(__dirname, '.agents', 'skills');
  const claudeSkillsDir = path.join(__dirname, '.claude', 'skills');

  if (!fs.existsSync(agentsSkillsDir)) {
    console.log('No .agents/skills directory found, skipping skill symlinks');
  } else {
    fs.mkdirSync(claudeSkillsDir, { recursive: true });

    const agentsDirectoryEntries = fs.readdirSync(agentsSkillsDir, { withFileTypes: true });
    for (const agentFolderEntry of agentsDirectoryEntries) {
      if (!agentFolderEntry.isDirectory()) {
        continue;
      }

      const claudeSkillLinkPath = path.join(claudeSkillsDir, agentFolderEntry.name);
      const expectedSymlinkTarget = path.join('..', '..', '.agents', 'skills', agentFolderEntry.name);

      try {
        const existingLinkStats = fs.lstatSync(claudeSkillLinkPath, { throwIfNoEntry: false });

        if (existingLinkStats) {
          if (!existingLinkStats.isSymbolicLink()) {
            console.log(
              `Skipped skill symlink ${agentFolderEntry.name}: ${claudeSkillLinkPath} exists and is not a symlink`
            );
            continue;
          }

          const existingSymlinkTarget = fs.readlinkSync(claudeSkillLinkPath);
          if (existingSymlinkTarget === expectedSymlinkTarget) {
            continue;
          }

          // A symlink pointing somewhere else is treated as a developer
          // override (.claude/ is gitignored local config). Leave it alone.
          console.log(
            `Skipped skill symlink ${agentFolderEntry.name}: ${claudeSkillLinkPath} points to ${existingSymlinkTarget}, not ${expectedSymlinkTarget}`
          );
          continue;
        }

        fs.symlinkSync(expectedSymlinkTarget, claudeSkillLinkPath, 'dir');
        console.log(`Linked .claude/skills/${agentFolderEntry.name} -> ${expectedSymlinkTarget}`);
      } catch (err) {
        console.log(`Skipped skill symlink ${agentFolderEntry.name}: ${err.message}`);
      }
    }
  }
} catch (err) {
  console.log(`Skipped skill symlink setup: ${err.message}`);
}
