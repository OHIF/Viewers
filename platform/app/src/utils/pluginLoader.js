/**
 * Generic Plugin Loader for OHIF Viewer
 *
 * Loads plugins dynamically based on configuration.
 * This keeps custom functionality (like AHI) external to the core OHIF source.
 *
 * Plugins can be loaded via:
 * 1. Script URL (config.plugins[].url) - loaded via script tag
 * 2. Built-in plugins (config.plugins[].builtin) - for backward compatibility
 */

/**
 * Load a plugin via script tag
 * @param {string} url - URL to the plugin script
 * @returns {Promise<void>}
 */
async function loadPluginScript(url) {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      console.log(`[PluginLoader] Loaded plugin script: ${url}`);
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`[PluginLoader] Failed to load plugin script: ${url}`));
    };
    document.head.appendChild(script);
  });
}

/**
 * Load and initialize all configured plugins
 * @param {Object} config - Application configuration
 * @returns {Promise<void>}
 */
export async function loadPlugins(config) {
  // Handle AHI plugin (backward compatible shorthand)
  if (config?.ahi?.enabled !== false) {
    const ahiPluginUrl = config?.ahi?.pluginUrl || '/plugins/ahi/ahi-plugin.js';

    // Check if AHI initialization is needed (has URL params or config)
    // backendUrl defaults to window.location.origin if not provided
    const urlParams = new URLSearchParams(window.location.search);
    const hasAHIParams =
      urlParams.has('datastoreId') ||
      urlParams.has('backendUrl') ||
      urlParams.has('orgId') ||
      config?.ahi?.backendUrl ||
      config?.ahi?.orgId;

    if (hasAHIParams) {
      try {
        console.log('[PluginLoader] Loading AHI plugin...');
        await loadPluginScript(ahiPluginUrl);

        // Initialize the AHI plugin
        if (window.AHIPlugin) {
          const initialized = await window.AHIPlugin.initialize(config);
          if (initialized) {
            console.log('[PluginLoader] AHI plugin initialized successfully');
          } else {
            console.log('[PluginLoader] AHI plugin skipped (no credentials)');
          }
        } else {
          console.warn('[PluginLoader] AHI plugin loaded but not available on window');
        }
      } catch (error) {
        console.error('[PluginLoader] Failed to load AHI plugin:', error);
      }
    }
  }

  // Handle generic plugins array
  if (config?.plugins && Array.isArray(config.plugins)) {
    for (const plugin of config.plugins) {
      if (plugin.enabled === false) {
        console.log(`[PluginLoader] Plugin ${plugin.name} is disabled`);
        continue;
      }

      try {
        if (plugin.url) {
          await loadPluginScript(plugin.url);
          console.log(`[PluginLoader] Loaded plugin: ${plugin.name}`);

          // Try to initialize if the plugin has an initialize function
          const pluginInstance = window[plugin.name + 'Plugin'];
          if (pluginInstance && typeof pluginInstance.initialize === 'function') {
            await pluginInstance.initialize(config, plugin.options);
          }
        }
      } catch (error) {
        console.error(`[PluginLoader] Failed to load plugin ${plugin.name}:`, error);
      }
    }
  }
}

export default loadPlugins;
