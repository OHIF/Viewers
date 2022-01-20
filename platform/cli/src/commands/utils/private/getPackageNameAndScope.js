export default function getPackageNameAndScope(packageName) {
  let scope;
  let packageNameLessScope;

  if (packageName.includes('@')) {
    [scope, packageNameLessScope] = packageName.split('/');
  } else {
    packageNameLessScope = packageName;
  }

  return {
    scope,
    packageNameLessScope,
  };
}
