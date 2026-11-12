// Print what the React Compiler emits for one file.
//
//   node .agents/skills/ohif-react-compiler/assets/emit.mjs <file>
//
// Uses the repo's own babel config (compiler included), found by walking up
// from the target file, so it works from any working directory. To see whether
// an edit changed anything the compiler produces, run it before and after and
// diff the two outputs. Identical output means identical runtime behaviour.
import { createRequire } from 'node:module';
import path from 'node:path';

const file = path.resolve(process.argv[2] ?? '');
if (!process.argv[2]) {
  console.error('usage: node emit.mjs <file>');
  process.exit(2);
}

const babel = createRequire(file)('@babel/core');
const { code } = babel.transformFileSync(file, {
  filename: file,
  cwd: path.dirname(file),
  rootMode: 'upward',
});
console.log(code);
