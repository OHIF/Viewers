import { execa } from 'execa';

export default async function getYarnInfo(packageName) {
  const { stdout } = await execa('npm', ['info', packageName, '--json']);
  return JSON.parse(stdout);
}
