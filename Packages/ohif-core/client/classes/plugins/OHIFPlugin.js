export class OHIFPlugin {
    // TODO: this class is still under development and will
    // likely change in the near future
    constructor () {
        this.name = "Unnamed plugin";
        this.description = "No description available";
    }

    // load an individual script URL
    static loadScript(scriptURL, type = "text/javascript") {
        return new Promise((resolve, reject) => {
            const head = document.getElementsByTagName("head")[0];
            const script = document.createElement("script");

            script.onload = () => {
                head.removeChild(script);
                resolve();
            };

            script.onerror = reject;

            script.src = scriptURL;
            script.type = type;
            script.async = false;

            head.appendChild(script);
        });
    }

    // reload all the dependency scripts and also
    // the main plugin script url.
    static reloadPlugin(plugin) {
        if (plugin.scriptURLs && plugin.scriptURLs.length) {
            plugin.scriptURLs.forEach(scriptURL => {
                this.loadScript(scriptURL);
            });
        }

        // TODO: Later we should probably merge script and module URLs
        if (plugin.moduleURLs && plugin.moduleURLs.length) {
            plugin.moduleURLs.forEach(moduleURLs => {
                this.loadScript(moduleURLs, "module");
            });
        }

        if (plugin.styleURLs && plugin.styleURLs.length) {
            plugin.styleURLs.forEach(styleURLs => {
                this.loadScript(styleURLs, "text/css");
            });
        }

        let scriptURL = plugin.url;

        if (plugin.allowCaching === false) {
            scriptURL += "?" + performance.now();
        }

        const type = plugin.module === true ? 'module' : 'text/javascript'

        console.warn(`Calling loadScript for ${plugin.name}`);
        console.time(`loadScript ${plugin.name}`);
        this.loadScript(scriptURL, type).then((script) => {
            console.timeEnd(`loadScript ${plugin.name}`);
            const entryPointFunction = OHIF.plugins.entryPoints[plugin.name];

            if (entryPointFunction) {
                entryPointFunction();
            } else {
                throw new Error(`No entry point found for ${plugin.name}`);
            }
        }, error => {
            throw new Error(error);
        });
    }
}
