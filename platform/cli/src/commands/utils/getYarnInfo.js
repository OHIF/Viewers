import { info } from 'yarn-programmatic';

export default async function getYarnInfo(packageName) {
  return await info(packageName);
}
