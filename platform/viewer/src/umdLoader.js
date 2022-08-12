/**
 * Loads UMD and imported files dynamically
 * Methods are:
 *   umdLoader - default export, loads the specified file
 *   umdLoader.registerImport registers an import function used to load modules on demand
 *   umdLoader.registerUmd registers a UMD module.
 *   umdLoader.pluginLoad loads the initial plugin setup
 */

let importer = name => undefined;
const amd = {};
const modules = {};
let counter = 0;

function defineGlobal(...args) {
  let path, child, t;
  if (args.length === 3) {
    [path, child, t] = args;
  } else {
    [child, t] = args;
    path = 'undefinedName' + counter;
    counter += 1;
    console.warn('***** amd args of length !=3', args, path, child, t);
  }
  try {
    const argsPromise = Promise.all(
      child.map(key => {
        const ret = umdLoader(key);
        if (!ret) {
          console.log('Rejecting', key, 'as it was not found', amd[path]);
          amd[path].reject(`Module ${key} required by ${path} not found`);
        }
        return ret;
      })
    );
    argsPromise
      .then(args => {
        args.forEach((m, i) => {
          if (!m) {
            throw new Error(`Can't load module ${child[i]}`);
          }
        });
        try {
          const module = t(...args);
          modules[path] = module;
          amd[path].resolve(module);
        } catch (e) {
          console.log('Caught exception loading', path, e);
          amd[path].reject(e);
        }
      })
      .catch(reason => {
        console.log("Can't load module", path, ' because', reason);
        amd[path].reject(`Module ${path} failed to load required submodule`);
      });
  } catch (e) {
    console.log("Couldn't load", e);
    amd[path].reject(e);
  }
}

function importUmd(name) {
  if (modules[name]) {
    return modules[name];
  }
  if (amd[name]) {
    throw new Error('Cyclic request for', name);
  }
  // TODO - lookup the module definition
  const moduleDefn = { id: name, src: `/umd/${name}/index.umd.js` };
  return new Promise((resolve, reject) => {
    amd[moduleDefn.id] = { resolve, reject };

    const xhr = new XMLHttpRequest();
    const { src: url } = moduleDefn;
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
      //Call a function when the state changes.
      if (xhr.readyState == 4) {
        switch (xhr.status) {
          case 200:
          case 204:
          case 304:
            try {
              // This is code provided by the server as part of OHIF, so it
              // isn't any less safe than OHIF itself.
              if (xhr.responseText.substring(0, 20).indexOf('DOCTYPE') !== -1) {
                console.log(`${name} was returned as react page`);
                reject(`${name} not found`);
                return;
              }
              // eslint-disable-next-line no-new-func
              const func = new Function(xhr.responseText);
              func();
            } catch (e) {
              reject(`Threw exception loading ${name} e=${e}`);
            }
            return;
          default:
            console.log('Unexpected status', xhr.status);
        }
        reject(`Can't load ${name}`);
      }
    };
    xhr.send();
  });
}

window.define = defineGlobal;

defineGlobal.amd = amd;

export default async function umdLoader(name) {
  if (typeof name !== 'string') return name;
  try {
    const module = (await importer(name)) || (await importUmd(name));
    if (!module) {
      console.log('Module', name, 'not found');
    }
    return module ? module.default || module : undefined;
  } catch (e) {
    console.warn('Unable to import', name, e);
  }
}

umdLoader.registerImport = registeredImporter => {
  importer = registeredImporter;
};
