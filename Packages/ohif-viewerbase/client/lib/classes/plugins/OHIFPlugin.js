export class OHIFPlugin {
    // TODO: this class is still under development and will
    // likely change in the near future
    constructor () {
        this.name = "Unnamed plugin";
        this.description = "No description available";
    }

    // load an individual script URL
    static loadScript(scriptURL) {
        const script = document.createElement("script");

        script.src = scriptURL;
        script.type = "text/javascript";
        script.async = false;

        const head = document.getElementsByTagName("head")[0];
        head.appendChild(script);
        head.removeChild(script);

        return script;
    }

    // reload all the dependency scripts and also
    // the main plugin script url.
    static reloadPlugin(plugin) {
        console.warn(`reloadPlugin: ${plugin.name}`);
        if (plugin.scriptURLs && plugin.scriptURLs.length) {
            plugin.scriptURLs.forEach(scriptURL => {
                this.loadScript(scriptURL).onload = function() {}
            });
        }

        let scriptURL = plugin.url;

        if (plugin.allowCaching === false) {
            scriptURL += "?" + performance.now();
        }

        this.loadScript(scriptURL).onload = function() {
            const entryPointFunction = OHIF.plugins.entryPoints[plugin.name];

            if (entryPointFunction) {
                entryPointFunction();
            }
        }
    }
}
